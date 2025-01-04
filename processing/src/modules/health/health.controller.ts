import { Controller, Get } from '@nestjs/common';
import { HealthCheckService } from '@nestjs/terminus';
import { NatsHealthIndicator } from './indicators/nats.health';
import { MinioHealthIndicator } from './indicators/minio.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { RedisClient } from 'src/app/common/types';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private nats: NatsHealthIndicator,
    private minio: MinioHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  check() {
    return this.health.check([
      () => this.nats.pingCheck('nats'),
      () => this.minio.pingCheck('minio'),
      () => this.redis.pingCheck(RedisClient.GENERAL_PURPOSE, 'redis-default'),
      () => this.redis.pingCheck(RedisClient.PUBSUB, 'redis-pubsub'),
    ]);
  }
}
