import { Controller, Get, HttpCode } from '@nestjs/common';
import { HealthCheckService } from '@nestjs/terminus';
import { NatsHealthIndicator } from './indicators/nats.health';
import { MinioHealthIndicator } from './indicators/minio.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { RedisClient } from 'src/app/common/types';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private nats: NatsHealthIndicator,
    private minio: MinioHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @ApiOperation({
    summary: 'Checks the readiness of the service',
    description:
      'This route performs various health checks to determine whether the service is ready to handle requests.\n\nThe following checks are performed: \n\nWhether the `nats` instance can receive events.\n\nWhether the `minio` instance can return a list of all buckets.\n\nWhether the `redis` instance responds to the `PING` request.',
  })
  @ApiResponse({
    status: 200,
    description: 'The service is healthy and ready to handle requests',
  })
  @ApiResponse({
    status: 503,
    description: 'The service is not healthly and unable to handle requests',
  })
  @Get('/readyz')
  check() {
    return this.health.check([
      () => this.nats.pingCheck('nats'),
      () => this.minio.pingCheck('minio'),
      () => this.redis.pingCheck(RedisClient.GENERAL_PURPOSE, 'redis-default'),
      () => this.redis.pingCheck(RedisClient.PUBSUB, 'redis-pubsub'),
    ]);
  }

  @ApiOperation({
    summary: 'Checks the liveness of the service',
    description:
      'This route is called by `kubernetes` liveness probe to determine whether the container is live. Simply being able to response is a sign of liveness and as such no other healtchecks are performed.',
  })
  @ApiResponse({
    status: 200,
    description: 'The service is live.',
  })
  @Get('/livez')
  @HttpCode(200)
  checkLiveness() {
    return this.health.check([]);
  }
}
