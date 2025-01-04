import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { NatsModule } from '../nats/nats.module';
import { NatsHealthIndicator } from './indicators/nats.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { MinioHealthIndicator } from './indicators/minio.health';

@Module({
  imports: [TerminusModule, NatsModule],
  controllers: [HealthController],
  providers: [NatsHealthIndicator, RedisHealthIndicator, MinioHealthIndicator],
})
export class HealthModule {}
