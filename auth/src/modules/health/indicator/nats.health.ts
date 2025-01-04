import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { Publisher } from '@nestjs-plugins/nestjs-nats-streaming-transport';

@Injectable()
export class NatsHealthIndicator extends HealthIndicator {
  constructor(private readonly publisher: Publisher) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    if (!this.publisher) {
      throw new HealthCheckError(
        'nats check failed',
        this.getStatus(key, false, { message: 'missing client instance' }),
      );
    }

    try {
      await this.publishHealthCheck();
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'nats check failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }

  private async publishHealthCheck(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.publisher.emit('_health_check', 'check').subscribe(
        () => {
          resolve();
        },
        (err) => {
          reject(err);
        },
      );
    });
  }
}
