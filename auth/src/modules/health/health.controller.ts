import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { NatsHealthIndicator } from './indicator/nats.health';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private nats: NatsHealthIndicator,
  ) {}

  @ApiOperation({
    summary: 'Checks the health of the service',
    description:
      'This route performs various health checks to determine whether the service is healthy and ready to handle requests.\n\nThe following checks are performed: \n\nWhether the `mongodb` instance is accessible.\n\nWhether the `nats` instance can receive events.',
  })
  @ApiResponse({
    status: 200,
    description: 'The service is healthy and ready to handle requests',
  })
  @ApiResponse({
    status: 503,
    description: 'The service is not healthly and unable to handle requests',
  })
  @Get()
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb', { timeout: 1500 }),
      () => this.nats.pingCheck('nats'),
    ]);
  }
}
