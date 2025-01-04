import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Puzzle, PuzzleDocument } from './schemas/puzzle.schema';
import { Model } from 'mongoose';
import { PuzzleCreatedEvent } from '../nats/events/puzzle-created.event';
import { PuzzleUpdatedEvent } from '../nats/events/puzzle-updated.event';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { TokenPayload } from '../auth/types';
import { WsException } from '@nestjs/websockets';
import { Visibility } from './types';

@Injectable()
export class PuzzleService {
  constructor(
    @InjectModel(Puzzle.name)
    private puzzleModel: Model<PuzzleDocument>,
    @InjectPinoLogger(PuzzleService.name)
    private readonly logger: PinoLogger,
  ) {}

  async createPuzzle(createPuzzleDto: PuzzleCreatedEvent['data']) {
    this.logger.info("Receving 'puzzle:created' event. Replicating..");
    const puzzle = new this.puzzleModel({
      _id: createPuzzleDto.id,
      owner: createPuzzleDto.owner,
      title: createPuzzleDto.title,
      columns: createPuzzleDto.columns,
      rows: createPuzzleDto.rows,
      size: createPuzzleDto.size,
      visibility: createPuzzleDto.visibility,
      status: createPuzzleDto.status,
      collaborators: [],
    });

    try {
      await puzzle.save();
      return true;
    } catch (err) {
      this.logger.error('Could not replicate puzzle based on event', err);
      return false;
    }
  }

  async updatePuzzle(updatePuzzleDto: PuzzleUpdatedEvent['data']) {
    this.logger.info("Receving 'puzzle:updated' event. Replicating..");
    console.log(updatePuzzleDto);
    const { collaborators, id, status, title, version, visibility } =
      updatePuzzleDto;

    const puzzle = await this.puzzleModel.findOne({
      _id: id,
      version: version - 1,
    });

    if (!puzzle) {
      this.logger.info(
        "Tried to update non-existing puzzle. Maybe we missed 'puzzle:created'",
      );
      return false;
    }

    puzzle.set({
      title,
      status,
      visibility,
      collaborators,
    });

    try {
      await puzzle.save();
      return true;
    } catch (err) {
      this.logger.error(
        'Could not update replicated puzzle based on event',
        err,
      );
      return false;
    }
  }

  async wsCheckAccess(user: TokenPayload, puzzleId: string) {
    const puzzle = await this.puzzleModel.findById(puzzleId);

    if (puzzle === null) {
      throw new WsException('Puzzle does not exist.');
    }

    // NOTE: we have an explicit check for visibility in case of
    // checking collaborators. This is to support
    // the case when user changes visibility from invite-only
    // to private and does not want/have to remove
    // collaborators by hand. This makes sure that
    // if visibility is changed back to invite-only
    // the collaborators stay the same.
    // Removal of collaborators is facilitated though
    // an endpoint.

    const isCollaborator =
      puzzle.collaborators.includes(user.id) &&
      puzzle.visibility === Visibility.InviteOnly;

    const isOwner = puzzle.owner === user.id;
    const isPublic = puzzle.visibility === Visibility.Public;

    if (isCollaborator || isOwner || isPublic) {
      return true;
    }

    throw new WsException('You do not have permission to access this puzzle');
  }
}
