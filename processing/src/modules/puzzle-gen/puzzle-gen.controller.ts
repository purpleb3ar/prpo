import { Controller, Param, Sse } from '@nestjs/common';
import { PuzzleGenService } from './puzzle-gen.service';
import { RedisNotificationProxyService } from './services/redis-notification-proxy.service';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { PuzzleIdDto } from './dtos/puzzle-id.dto';

@Controller('puzzle-gen')
export class PuzzleGenController {
  constructor(
    private puzzleGenService: PuzzleGenService,
    private notificationService: RedisNotificationProxyService,
  ) {}

  @ApiOperation({
    summary:
      'Stream notifications to the client when the puzzle processing is completed.',
    description:
      'This route streams notifications to the client, informing them when the processing of a job has completed. The client will receive real-time updates about the status of the job until it is finished.',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status notifications being streamed to the client',
  })
  @ApiResponse({
    status: 422,
    description: 'The `id` param was not a valid MongoDB ObjectId.',
  })
  @ApiParam({
    name: 'puzzleId',
    description:
      'The MongoDB ObjectId of the puzzle whose processing status is being tracked',
    required: true,
    type: 'string',
  })
  @Sse('/progress/:id')
  async listen(@Param() params: PuzzleIdDto) {
    return this.notificationService.getObservable(params.id);
  }
}
