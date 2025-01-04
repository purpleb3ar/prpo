import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PuzzleService } from './puzzle.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TokenPayload } from '../auth/types';
import { CreatePuzzleDto } from './dtos/create-puzzle.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdatePuzzleDto } from './dtos/update-puzzle.dto';
import { PuzzleIdDto } from './dtos/puzzle-id.dto';
import { Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { Subjects } from '../nats/events/subjects';
import { PuzzleProcessingStartedEvent } from '../nats/events/puzzle-processing-started.event';
import { NatsStreamingContext } from '@nestjs-plugins/nestjs-nats-streaming-transport';
import { ProcessingState, PuzzleAsset } from './types';
import { PuzzleProcessingDoneEvent } from '../nats/events/puzzle-processing-done.event';
import { GetPuzzleAssetDto } from './dtos/get-asset.dto';

@Controller('puzzles')
export class PuzzleController {
  constructor(private puzzleService: PuzzleService) {}

  @Post()
  @HttpCode(201)
  @UseInterceptors(FileInterceptor('image'))
  @UseGuards(JwtAuthGuard)
  async createPuzzle(
    @Body() puzzle: CreatePuzzleDto,
    @UploadedFile(
      new ParseFilePipe({
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.puzzleService.createPuzzle(puzzle, file, user);
  }

  @Get('invite/:inviteKey')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async addCollaborator(
    @Param('inviteKey') inviteKey: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.puzzleService.addCollaborator(user, inviteKey);
  }

  @Put(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async updatePuzzle(
    @Body() updatedPuzzle: UpdatePuzzleDto,
    @Param() params: PuzzleIdDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.puzzleService.updatePuzzle(user, params.id, updatedPuzzle);
  }

  @Get()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async getPuzzles(@CurrentUser() user: TokenPayload) {
    return this.puzzleService.getOwnedAndCollaborativePuzzles(user);
  }

  @Get('public')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async getPublicPuzzles(@CurrentUser() user: TokenPayload) {
    return this.puzzleService.getPublicPuzzles(user);
  }

  @Get(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async getSingle(
    @CurrentUser() user: TokenPayload,
    @Param() params: PuzzleIdDto,
  ) {
    return this.puzzleService.getSingle(user, params.id);
  }

  @Get(':id/thumbnail')
  @HttpCode(200)
  async getPuzzleThumbnail(@Param() params: PuzzleIdDto) {
    const { contentType, size, stream } =
      await this.puzzleService.getThumbnailAsStream(params.id);

    return new StreamableFile(stream, {
      length: size,
      type: contentType,
    });
  }

  @Get(':id/:assetType')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async getPuzzleAsset(
    @CurrentUser() user: TokenPayload,
    @Param() params: GetPuzzleAssetDto,
  ) {
    const { contentType, size, stream } =
      await this.puzzleService.getAssetAsStream(
        user,
        params.id,
        params.assetType,
      );

    return new StreamableFile(stream, {
      length: size,
      type: contentType,
    });
  }

  @Delete(':puzzleId/collaborator/:userId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async removeCollaborator(
    @Param() params: any,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.puzzleService.removeCollaborator(
      user,
      params.puzzleId,
      params.userId,
    );
  }

  @EventPattern(Subjects.PuzzleProcessingStarted)
  async puzzleProcessingStartedHandler(
    @Payload() data: PuzzleProcessingStartedEvent['data'],
    @Ctx() { message }: NatsStreamingContext,
  ) {
    await this.puzzleService.updatePuzzleProcessingState(
      data.id,
      ProcessingState.Processing,
    );

    message.ack();
  }

  @EventPattern(Subjects.PuzzleProcessingDone)
  async puzzleProcessingDoneHandler(
    @Payload() data: PuzzleProcessingDoneEvent['data'],
    @Ctx() { message }: NatsStreamingContext,
  ) {
    await this.puzzleService.updatePuzzleProcessingState(
      data.id,
      ProcessingState.Done,
    );

    message.ack();
  }
}
