import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { NatsHealthIndicator } from './indicator/nats.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private nats: NatsHealthIndicator,
  ) {}

  @Get()
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb', { timeout: 1500 }),
      () => this.nats.pingCheck('nats'),
    ]);
  }
}
