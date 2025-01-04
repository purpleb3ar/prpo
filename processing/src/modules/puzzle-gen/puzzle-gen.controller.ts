import { Controller, Param, Sse } from '@nestjs/common';
import { PuzzleGenService } from './puzzle-gen.service';
import { RedisNotificationProxyService } from './services/redis-notification-proxy.service';

@Controller('puzzle-gen')
export class PuzzleGenController {
  constructor(
    private puzzleGenService: PuzzleGenService,
    private notificationService: RedisNotificationProxyService,
  ) {}

  @Sse('/progress/:puzzleId')
  async listen(@Param('puzzleId') puzzleId: string) {
    return this.notificationService.getObservable(puzzleId);
  }
}
