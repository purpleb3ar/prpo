import { Module } from '@nestjs/common';
import { NatsModule } from '../nats/nats.module';
import { PuzzleGenService } from './puzzle-gen.service';
import { PuzzleGenController } from './puzzle-gen.controller';
import { RedisNotificationProxyService } from './services/redis-notification-proxy.service';

@Module({
  imports: [NatsModule],
  providers: [PuzzleGenService, RedisNotificationProxyService],
  exports: [PuzzleGenService],
  controllers: [PuzzleGenController],
})
export class PuzzleGenModule {}
