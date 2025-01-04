import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const client = this.redisService.getOrNil();

    if (!client) {
      throw new HealthCheckError(
        'redis check failed',
        this.getStatus(key, false, { message: 'missing client instance' }),
      );
    }

    try {
      await this.publishHealthCheck(client);
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        error.message,
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }

  private async publishHealthCheck(client: Redis): Promise<void> {
    return new Promise((resolve, reject) => {
      client.ping((err) => {
        if (err) {
          reject(err);
        }

        resolve();
      });
    });
  }
}
