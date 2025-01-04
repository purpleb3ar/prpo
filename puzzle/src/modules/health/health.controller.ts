import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { NatsHealthIndicator } from './indicators/nats.health';
import { MinioHealthIndicator } from './indicators/minio.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private nats: NatsHealthIndicator,
    private minio: MinioHealthIndicator,
  ) {}

  @Get()
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb', { timeout: 1500 }),
      () => this.nats.pingCheck('nats'),
      () => this.minio.pingCheck('minio'),
    ]);
  }
}
