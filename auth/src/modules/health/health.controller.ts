import { Controller, Get, HttpCode } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { NatsHealthIndicator } from './indicator/nats.health';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private nats: NatsHealthIndicator,
  ) {}

  @ApiOperation({
    summary: 'Checks the readiness of the service',
    description:
      'This route performs various health checks to determine whether the service is ready to handle requests.\n\nThe following checks are performed: \n\nWhether the `mongodb` instance is accessible.\n\nWhether the `nats` instance can receive events.',
  })
  @ApiResponse({
    status: 200,
    description: 'The service is healthy and ready to handle requests',
  })
  @ApiResponse({
    status: 503,
    description: 'The service is not healthy and unable to handle requests',
  })
  @Get('/readyz')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb', { timeout: 1500 }),
      () => this.nats.pingCheck('nats'),
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
