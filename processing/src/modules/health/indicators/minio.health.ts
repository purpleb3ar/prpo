import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { NestMinioService } from 'nestjs-minio';
import { Client } from 'minio';

@Injectable()
export class MinioHealthIndicator extends HealthIndicator {
  constructor(private minioService: NestMinioService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const client = this.minioService.getMinio();

    if (!client) {
      throw new HealthCheckError(
        'minio check failed',
        this.getStatus(key, false, { message: 'missing client instance' }),
      );
    }

    try {
      await this.publishHealthCheck(client);
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'minio check failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }

  private async publishHealthCheck(client: Client): Promise<void> {
    await client.listBuckets();
  }
}
