import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Puzzle, PuzzleDocument } from './schemas/puzzle.schema';
import { Model } from 'mongoose';
import { TokenPayload } from '../auth/types';
import { ProcessingState, PuzzleAsset, Visibility } from './types';
import { CreatePuzzleDto } from './dtos/create-puzzle.dto';
import { ConfigService } from '@nestjs/config';
import { InviteKeyService } from './services/invite-key.service';
import { NestMinioService } from 'nestjs-minio';
import { NatsService } from '../nats/nats.service';
import { PuzzleCreatedEvent } from '../nats/events/puzzle-created.event';
import { Subjects } from '../nats/events/subjects';
import { UpdatePuzzleDto } from './dtos/update-puzzle.dto';
import { PuzzleUpdatedEvent } from '../nats/events/puzzle-updated.event';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class PuzzleService implements OnModuleInit {
  private bucketName: string;

  constructor(
    @InjectModel(Puzzle.name)
    private puzzleModel: Model<PuzzleDocument>,
    @InjectPinoLogger(PuzzleService.name)
    private readonly logger: PinoLogger,
    private configService: ConfigService,
    private inviteKeyService: InviteKeyService,
    private minioService: NestMinioService,
    private natsService: NatsService,
  ) {}

  onModuleInit() {
    this.bucketName = this.configService.get<string>('minio.bucketName');
  }

  private getObjectName(assetType: PuzzleAsset, id: string) {
    switch (assetType) {
      case PuzzleAsset.Specification:
        return `${id}/spec.json`;
      case PuzzleAsset.Spritesheet:
        return `${id}/spritesheet.webp`;
      case PuzzleAsset.Thumbnail:
        return `${id}/thumbnail.png`;
    }
  }

  async createPuzzle(
    createPuzzleDto: CreatePuzzleDto,
    image: Express.Multer.File,
    user: TokenPayload,
  ) {
    const existingPuzzle = await this.puzzleModel.findOne({
      title: createPuzzleDto.title,
    });

    if (existingPuzzle) {
      throw new HttpException('Title already exists', HttpStatus.BAD_REQUEST);
    }

    const inviteKey =
      createPuzzleDto.visibility === Visibility.InviteOnly
        ? this.inviteKeyService.generate()
        : undefined;

    const puzzle = new this.puzzleModel({
      title: createPuzzleDto.title,
      rows: createPuzzleDto.rows,
      columns: createPuzzleDto.columns,
      size: createPuzzleDto.size,
      owner: user.id,
      visibility: createPuzzleDto.visibility,
      status: ProcessingState.Created,
      inviteKey,
      collaborators: [],
    });

    const createdPuzzle = await puzzle.save();
    const imageObjectName = this.getObjectName(
      PuzzleAsset.Thumbnail,
      createdPuzzle.id,
    );

    const minio = this.minioService.getMinio();

    await minio.putObject(
      this.bucketName,
      imageObjectName,
      image.buffer,
      image.size,
      {
        'Content-Type': image.mimetype,
      },
    );

    this.natsService.publish<PuzzleCreatedEvent>(Subjects.PuzzleCreated, {
      columns: createdPuzzle.columns,
      rows: createdPuzzle.rows,
      owner: user.id,
      id: createdPuzzle.id,
      size: createdPuzzle.size,
      status: createdPuzzle.status,
      title: createdPuzzle.title,
      visibility: createdPuzzle.visibility,
      objectNames: {
        specification: this.getObjectName(
          PuzzleAsset.Specification,
          createdPuzzle.id,
        ),
        thumbnail: imageObjectName,
        spritesheet: this.getObjectName(
          PuzzleAsset.Spritesheet,
          createdPuzzle.id,
        ),
      },
    });

    return createdPuzzle.populate('owner');
  }

  async updatePuzzleProcessingState(id: string, newState: ProcessingState) {
    this.logger.info(`Puzzle is now in ${newState} state`);

    const puzzle = await this.puzzleModel.findByIdAndUpdate(id, {
      status: newState,
    });

    if (!puzzle) {
      this.logger.error('Tried updating state for unknown puzzle');
    }
  }

  async updatePuzzle(user: TokenPayload, id: string, data: UpdatePuzzleDto) {
    const puzzle = await this.puzzleModel
      .findById(id)
      .orFail(new HttpException('puzzle not found', HttpStatus.NOT_FOUND))
      .populate('owner');

    if (puzzle.title !== data.title) {
      const titleExist = await this.puzzleModel.exists({
        _id: id,
        title: data.title,
      });

      if (titleExist) {
        throw new HttpException('title already exists', HttpStatus.BAD_REQUEST);
      }
    }

    if (puzzle.owner.id !== user.id) {
      throw new HttpException(
        'you do not have permission to edit this puzzle',
        HttpStatus.FORBIDDEN,
      );
    }

    if (
      puzzle.visibility === Visibility.Public &&
      data.visibility !== Visibility.Public
    ) {
      throw new HttpException(
        'you cannot change visibity from public',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      data.updateInviteKey === true &&
      (data.visibility === Visibility.InviteOnly ||
        puzzle.visibility === Visibility.InviteOnly)
    ) {
      this.logger.info('User requested inviteKey update');
      const inviteKey = this.inviteKeyService.generate();

      puzzle.set({
        inviteKey,
      });
    }

    puzzle.set({
      visibility: data.visibility,
      title: data.title,
    });

    if (puzzle.isModified()) {
      this.logger.info('Puzzle was modified. Saving and publishing event');

      const updatedPuzzle = await puzzle.save();

      this.natsService.publish<PuzzleUpdatedEvent>(Subjects.PuzzleUpdated, {
        collaborators: puzzle.collaborators.map((doc) => doc._id.toString()),
        id: updatedPuzzle.id,
        version: updatedPuzzle.version,
        status: updatedPuzzle.status,
        title: updatedPuzzle.title,
        visibility: updatedPuzzle.visibility,
      });

      return updatedPuzzle;
    }

    return puzzle;
  }

  async addCollaborator(user: TokenPayload, inviteKey: string) {
    const puzzle = await this.puzzleModel
      .findOne({
        visibility: Visibility.InviteOnly,
        inviteKey,
      })
      .orFail(new HttpException('incorrect invite key', HttpStatus.NOT_FOUND));

    const alreadyExists = puzzle.collaborators.find(
      (doc) => doc._id.toString() === user.id,
    );

    if (alreadyExists) {
      throw new HttpException(
        'you are already a collaborator',
        HttpStatus.BAD_REQUEST,
      );
    }

    puzzle.set({
      collaborators: [...puzzle.collaborators, user.id],
    });

    await puzzle.save();

    this.natsService.publish<PuzzleUpdatedEvent>(Subjects.PuzzleUpdated, {
      collaborators: puzzle.collaborators.map((doc) => doc._id.toString()),
      id: puzzle.id,
      status: puzzle.status,
      title: puzzle.title,
      version: puzzle.version,
      visibility: puzzle.visibility,
    });

    return puzzle;
  }

  async removeCollaborator(
    user: TokenPayload,
    puzzleId: string,
    userId: string,
  ) {
    const puzzle = await this.puzzleModel
      .findOne({
        $and: [
          { _id: puzzleId },
          {
            $or: [
              { owner: user.id },
              {
                collaborators: {
                  $in: [userId],
                },
              },
            ],
          },
        ],
      })
      .orFail(
        new HttpException(
          'only owner can remove collaborators',
          HttpStatus.BAD_REQUEST,
        ),
      )
      .populate('owner');

    console.log(puzzle.owner);
    console.log(user.id);

    if (puzzle.owner.id !== user.id && userId !== user.id) {
      throw new HttpException(
        'as a collaborator, you can only remove yourself',
        HttpStatus.BAD_REQUEST,
      );
    }

    const collaborators = puzzle.collaborators.filter(
      (doc) => doc._id.toString() !== userId,
    );

    puzzle.set({
      collaborators,
    });

    if (puzzle.isModified()) {
      this.logger.info(`puzzle was modified. Sending 'puzzle:updated' event`);
      await puzzle.save();

      this.natsService.publish<PuzzleUpdatedEvent>(Subjects.PuzzleUpdated, {
        collaborators: puzzle.collaborators.map((doc) => doc._id.toString()),
        id: puzzle.id,
        status: puzzle.status,
        title: puzzle.title,
        version: puzzle.version,
        visibility: puzzle.visibility,
      });
    }
  }

  async getPublicPuzzles(user: TokenPayload) {
    const puzzles = await this.puzzleModel
      .find({
        visibility: Visibility.Public,
      })
      .populate('owner');

    return puzzles;
  }

  private async getStreamWithMetadata(id: string, assetType: PuzzleAsset) {
    const objectName = this.getObjectName(assetType, id);

    this.logger.info(
      `Fetching '${objectName}' from '${this.bucketName}' bucket`,
    );

    const client = this.minioService.getMinio();
    const stat = await client.statObject(this.bucketName, objectName);

    return {
      contentType: stat.metaData['content-type'],
      size: stat.size,
      stream: await client.getObject(this.bucketName, objectName),
    };
  }

  async getThumbnailAsStream(id: string) {
    return this.getStreamWithMetadata(id, PuzzleAsset.Thumbnail);
  }

  async getAssetAsStream(
    user: TokenPayload,
    id: string,
    assetType: PuzzleAsset,
  ) {
    const puzzle = await this.getSingle(user, id);

    return this.getStreamWithMetadata(puzzle.id, assetType);
  }

  async getOwnedAndCollaborativePuzzles(user: TokenPayload) {
    const puzzles = await this.puzzleModel
      .find(
        {
          $or: [
            { owner: user.id },
            {
              collaborators: {
                $in: [user.id],
              },
            },
          ],
        },
        {
          rows: 1,
          columns: 1,
          owner: 1,
          size: 1,
          title: 1,
          visibility: 1,
          status: 1,
        },
      )
      .populate('owner');

    return puzzles;
  }

  async getSingle(user: TokenPayload, id: string) {
    const puzzle = await this.puzzleModel
      .findOne({
        $and: [
          { _id: id },
          {
            $or: [
              { owner: user.id },
              {
                collaborators: {
                  $in: [user.id],
                },
              },
            ],
          },
        ],
      })
      .populate('owner collaborators')
      .orFail(new HttpException('puzzle does not exist', HttpStatus.NOT_FOUND));

    if (puzzle.status === ProcessingState.Created) {
      throw new HttpException(
        'puzzle is not ready yet. awaiting processing',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (puzzle.status === ProcessingState.Processing) {
      throw new HttpException(
        'puzzle is not ready yet. processing in progress',
        HttpStatus.BAD_REQUEST,
      );
    }

    return puzzle;

    // we need to add progress and assetURLs
  }
}
