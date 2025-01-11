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
import {
  ApiConsumes,
  ApiCookieAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { Puzzle } from './schemas/puzzle.schema';

@Controller('puzzles')
export class PuzzleController {
  constructor(private puzzleService: PuzzleService) {}

  @ApiOperation({
    summary: 'Create a new puzzle',
    description:
      'This route allows users to upload a source image along with some metadata and settings, which will be processed to create a solvable jigsaw puzzle.\n\n. Upon success, a `puzzle:created` event is generated as well.',
  })
  @ApiHeader({
    name: 'Cookie',
    description: `The 'prpo_app_access_token' cookie must be set and contain a valid JWT.\n\n\n\nTo test the API leave the value empty!`,
    example: 'prpo_app_access_token=eyJhbGciOiJIUzI1NiIsInR...',
  })
  @ApiResponse({
    status: 422,
    description: 'Provided request body failed validation (invalid).',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid token.',
  })
  @ApiResponse({
    status: 400,
    description: 'Title already exists.',
  })
  @ApiResponse({
    status: 201,
    description: 'Puzzle successfully created.',
    type: Puzzle,
  })
  @ApiCookieAuth()
  @ApiConsumes('multipart/form-data')
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

  @ApiOperation({
    summary: 'Adds a new collaborator',
    description:
      'This route allows users with the valid invite key to become a puzzles collaborator.',
  })
  @ApiCookieAuth()
  @ApiHeader({
    name: 'Cookie',
    description: `The 'prpo_app_access_token' cookie must be set and contain a valid JWT.\n\n\n\nTo test the API leave the value empty!`,
    example: 'prpo_app_access_token=eyJhbGciOiJIUzI1NiIsInR...',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid token.',
  })
  @ApiResponse({
    status: 404,
    description:
      '(1) Invite key not found.\n\n(2) The puzzle visibility is not set to `invite-only`.',
  })
  @ApiResponse({
    status: 400,
    description: 'The current user is already a collaborator.',
  })
  @ApiResponse({
    status: 201,
    description: 'Collaborator added successfully.',
    type: Puzzle,
    example: {
      title: 'Lake Tahoe',
      owner: {
        username: 'inexperienced-harlot',
        id: '677818f3e259f76a575fda17',
      },
      rows: 11,
      columns: 21,
      size: 90,
      visibility: 'invite-only',
      status: 'done',
      inviteKey: 'gyS54Ca2HetqVYe4',
      collaborators: ['677818f3e259f76a575fda19'],
    },
  })
  @ApiParam({
    name: 'inviteKey',
    type: 'string',
    required: true,
    example: 'gyS54Ca2HetqVYe4',
    description:
      'When the puzzle visiblity is `invite-only`, this value represents the invite key which can be used to become a puzzle collaborator.',
  })
  @Get('invite/:inviteKey')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async addCollaborator(
    @Param('inviteKey') inviteKey: string,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.puzzleService.addCollaborator(user, inviteKey);
  }

  @ApiOperation({
    summary: 'Updates a puzzle',
    description:
      'This route allows users to update a puzzle title, visibility or refresh the invite key. Only puzzle owners can update puzzles. Only puzzles whose status is not `public` can be updated.\n\nUpon success, a `puzzle:updated` event is generated as well.',
  })
  @ApiCookieAuth()
  @ApiHeader({
    name: 'Cookie',
    description: `The 'prpo_app_access_token' cookie must be set and contain a valid JWT.\n\n\n\nTo test the API leave the value empty!`,
    example: 'prpo_app_access_token=eyJhbGciOiJIUzI1NiIsInR...',
  })
  @ApiResponse({
    status: 200,
    type: Puzzle,
    description: 'The puzzle was successfully updated.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid token.',
  })
  @ApiResponse({
    status: 400,
    description: `(1) Public puzzles cannot be updated.\n\n(2) Title already exists.`,
  })
  @ApiResponse({
    status: 403,
    description: 'Only the puzzle owner is allowed to update a puzzle.',
  })
  @ApiResponse({
    status: 404,
    description: 'Requested puzzle was not found.',
  })
  @ApiResponse({
    status: 422,
    description: 'Request body failed validation (invalid).',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description:
      'The MongoDB ObjectId of the puzzle that the user wants to update.',
  })
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

  @ApiOperation({
    summary: 'Delete a puzzle',
    description:
      'This route allows users to delete a puzzle. Only puzzle owners can delete a puzzle. Only puzzles which are not `public` can be deleted.',
  })
  @ApiCookieAuth()
  @ApiHeader({
    name: 'Cookie',
    description: `The 'prpo_app_access_token' cookie must be set and contain a valid JWT.\n\n\n\nTo test the API leave the value empty!`,
    example: 'prpo_app_access_token=eyJhbGciOiJIUzI1NiIsInR...',
  })
  @ApiResponse({
    status: 204,
    description: 'Puzzle successfully deleted.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid token.',
  })
  @ApiResponse({
    status: 404,
    description: 'The requested puzzle was not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Only the puzzle owner can delete a puzzle.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Puzzles with the visibility set to `public` cannot be removed.',
  })
  @ApiResponse({
    status: 422,
    description: 'The `id` param was not a valid ObjectId.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description:
      'The MongoDB ObjectId of the puzzle that the user wants to delete.',
  })
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async deletePuzzle(
    @CurrentUser() user: TokenPayload,
    @Param() params: PuzzleIdDto,
  ) {
    return this.puzzleService.deletePuzzle(user, params.id);
  }

  @ApiOperation({
    summary: 'Retrieves all owned puzzles and collaborative puzzles',
    description:
      'This route returns all the puzzles that the current user is either an owner of, or a collaborator in.',
  })
  @ApiCookieAuth()
  @ApiHeader({
    name: 'Cookie',
    description: `The 'prpo_app_access_token' cookie must be set and contain a valid JWT\n\nTo test the API leave the value empty`,
    example: 'prpo_app_access_token=eyJhbGciOiJIUzI1NiIsInR...',
  })
  @ApiResponse({
    status: 401,
    description: 'missing or invalid token.',
  })
  @ApiResponse({
    status: 200,
    type: [Puzzle],
    description: 'Puzzles were successfully retrieved.',
  })
  @Get()
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async getPuzzles(@CurrentUser() user: TokenPayload) {
    return this.puzzleService.getOwnedAndCollaborativePuzzles(user);
  }

  @ApiOperation({
    summary: 'Retrieves all public puzzles',
    description:
      'This route returns all the puzzles with visibility set to `public`.',
  })
  @ApiCookieAuth()
  @ApiHeader({
    name: 'Cookie',
    description: `The 'prpo_app_access_token' cookie must be set and contain a valid JWT\n\nTo test the API leave the value empty`,
    example: 'prpo_app_access_token=eyJhbGciOiJIUzI1NiIsInR...',
  })
  @ApiResponse({
    status: 401,
    description: 'missing or invalid token.',
  })
  @ApiResponse({
    status: 200,
    type: [Puzzle],
    description: 'Puzzles were successfully retrieved.',
  })
  @Get('public')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async getPublicPuzzles(@CurrentUser() user: TokenPayload) {
    return this.puzzleService.getPublicPuzzles(user);
  }

  @ApiOperation({
    summary: 'Retrieves a single puzzle by its id',
    description:
      'This route retrieves details about a puzzle by its id. Only the owner and potential collaborators can access this route. Puzzle details can only be retrieved when the state property is set to `done` which happens when the processing job is completed.',
  })
  @ApiHeader({
    name: 'Cookie',
    description: `The 'prpo_app_access_token' cookie must be set and contain a valid JWT\n\nTo test the API leave the value empty`,
    example: 'prpo_app_access_token=eyJhbGciOiJIUzI1NiIsInR...',
  })
  @ApiResponse({
    status: 401,
    description: 'missing or invalid token.',
  })
  @ApiResponse({
    status: 422,
    description: 'The provided `id` param was not a valid ObjectId.',
  })
  @ApiCookieAuth()
  @ApiResponse({
    status: 404,
    description: `The puzzle does not exist (triggered also when an unauthorized user tries to access it).`,
  })
  @ApiResponse({
    status: 400,
    description: 'The requested puzzles state is not set to `done`.',
  })
  @ApiResponse({
    status: 200,
    type: Puzzle,
  })
  @ApiParam({
    name: 'id',
    required: true,
    description:
      'The MongoDB ObjectId of the puzzle that the user wants to retrieve the details of.',
  })
  @Get(':id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async getSingle(
    @CurrentUser() user: TokenPayload,
    @Param() params: PuzzleIdDto,
  ) {
    return this.puzzleService.getSingle(user, params.id);
  }

  @ApiOperation({
    summary: 'Retrieves the puzzle thumbnail',
    description:
      'Fetches the puzzle thumbnail from the object storage and streams it back to the user. This route does not require authentication.',
  })
  @ApiResponse({
    status: 422,
    description: 'The provided `id` param was not a valid ObjectId.',
  })
  @ApiResponse({
    status: 404,
    description: 'Puzzle with the requested id does not exist.',
  })
  @ApiResponse({
    status: 200,
    description: 'The thumbnail has been successfully retrieved.',
    type: StreamableFile,
  })
  @ApiParam({
    name: 'id',
    required: true,
    description:
      'The MongoDB ObjectId of the puzzle that the user wants to fetch the thumbnail of.',
  })
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

  @ApiOperation({
    summary: 'Retrieves the requsted asset',
    description:
      'Fetches the puzzle asset (either `spritesheet` or `specification`) from the object storage and streams it back to the user.',
  })
  @ApiCookieAuth()
  @ApiHeader({
    name: 'Cookie',
    description: `The 'prpo_app_access_token' cookie must be set and contain a valid JWT\n\nTo test the API leave the value empty`,
    example: 'prpo_app_access_token=eyJhbGciOiJIUzI1NiIsInR...',
  })
  @ApiResponse({
    status: 422,
    description: 'The provided `id` param was not a valid ObjectId.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid token.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Puzzle with the requested id does not exist (triggered also when an unauthorized user tries to access it).',
  })
  @ApiResponse({
    status: 400,
    description: 'The requested puzzles state is not set to `done`.',
  })
  @ApiResponse({
    status: 200,
    description: 'The asset has been successfully retrieved.',
    type: StreamableFile,
    example: 'thumbnail.png',
  })
  @ApiParam({
    name: 'assetType',
    enum: PuzzleAsset,
    description: 'Define the type of asset that the user has requested.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    description:
      'The MongoDB ObjectId of the puzzle that the user wants to fetch the asset of.',
  })
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

  @ApiOperation({
    summary: 'Remove collaborator',
    description:
      'This route allows puzzle owners to remove collaborators from their puzzle and the collaborators to remove themselves. ',
  })
  @ApiCookieAuth()
  @ApiHeader({
    name: 'Cookie',
    description: `The 'prpo_app_access_token' cookie must be set and contain a valid JWT\n\nTo test the API leave the value empty`,
    example: 'prpo_app_access_token=eyJhbGciOiJIUzI1NiIsInR...',
  })
  @ApiResponse({
    status: 204,
    description: 'Collaborator has been successfully removed.',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid token',
  })
  @ApiResponse({
    status: 404,
    description:
      'The requested puzzle was not found (triggered also when unauthorized users tries to access it).',
  })
  @ApiResponse({
    status: 400,
    description:
      'Collaborator tried to remove someone other than themselves from the collaborator list',
  })
  @ApiParam({
    name: 'puzzleId',
    required: true,
    description:
      'The MongoDB ObjectId of the puzzle that the user wants to remove collaborator from.',
  })
  @ApiParam({
    name: 'userId',
    required: true,
    description: 'The MongoDB ObjectId of the collaborator to be removed.',
  })
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
