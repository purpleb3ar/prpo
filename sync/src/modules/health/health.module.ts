import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { NatsModule } from '../nats/nats.module';
import { RedisHealthIndicator } from './indicators/redis.health';
import { NatsHealthIndicator } from './indicators/nats.health';
import { RedisModule } from '@liaoliaots/nestjs-redis';

@Module({
  imports: [TerminusModule, NatsModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, NatsHealthIndicator],
})
export class HealthModule {}
