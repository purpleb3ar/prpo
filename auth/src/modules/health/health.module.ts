import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { NatsModule } from '../nats/nats.module';
import { NatsHealthIndicator } from './indicator/nats.health';

@Module({
  imports: [TerminusModule, NatsModule],
  controllers: [HealthController],
  providers: [NatsHealthIndicator],
})
export class HealthModule {}
