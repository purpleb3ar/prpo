import { RedisService } from '@liaoliaots/nestjs-redis';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { NestMinioService } from 'nestjs-minio';
import { PuzzleCreatedEvent } from '../nats/events/puzzle-created.event';
import { NatsService } from '../nats/nats.service';
import PuzzleEngine from '../../lib/puzzle-engine';
import { ConfigService } from '@nestjs/config';
import { PuzzleProcessingDoneEvent } from '../nats/events/puzzle-processing-done.event';
import { Subjects } from '../nats/events/subjects';
import { PuzzleProcessingStartedEvent } from '../nats/events/puzzle-processing-started.event';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { loadImage } from 'skia-canvas';
import { RedisClient } from 'src/app/common/types';

@Injectable()
export class PuzzleGenService implements OnModuleInit {
  private bucketName: string;
  private notificationChannelName: string;

  constructor(
    @InjectPinoLogger(PuzzleGenService.name)
    private logger: PinoLogger,
    private minioService: NestMinioService,
    private redisService: RedisService,
    private natsService: NatsService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.bucketName = this.configService.get<string>('minio.bucketName');
    this.notificationChannelName =
      this.configService.get<string>('redis.channel');
  }

  private async streamToBuffer(stream) {
    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  private async notifyDone(id: string) {
    const pubsub = this.redisService.getOrNil(RedisClient.GENERAL_PURPOSE);

    const message = {
      puzzleId: id,
    };

    pubsub.publish(this.notificationChannelName, JSON.stringify(message));
  }

  async generateFromEvent(data: PuzzleCreatedEvent['data']) {
    const { id, rows, columns, size, objectNames } = data;
    const { specification, thumbnail, spritesheet } = objectNames;

    this.logger.info("Received 'puzzle:created' event. Generating puzzle");

    this.natsService.publish<PuzzleProcessingStartedEvent>(
      Subjects.PuzzleProcessingStarted,
      {
        id,
      },
    );

    const minioClient = this.minioService.getMinio();

    const sourceImageBuffer = await this.streamToBuffer(
      await minioClient.getObject(this.bucketName, thumbnail),
    );

    this.logger.info('Loaded source image from object storage');

    const engine = new PuzzleEngine({
      columns,
      rows,
      size,
      scale: 1,
      image: await loadImage(sourceImageBuffer),
    });

    this.logger.info('Initialized puzzle engine');

    const spec = engine.generatePuzzle();

    this.logger.info('Spec is generated');

    const spritesheetBuffer = await engine.getPuzzlesheet();

    this.logger.info('Puzzle successfully generated.');

    const specificationJSON = JSON.stringify(spec);

    this.logger.info('Stored specification to object storage');

    await minioClient.putObject(
      this.bucketName,
      specification,
      specificationJSON,
      specificationJSON.length,
      {
        'Content-Type': 'application/json',
      },
    );
    this.logger.info('Stored spritesheet to object storage');

    await minioClient.putObject(
      this.bucketName,
      spritesheet,
      spritesheetBuffer,
      sourceImageBuffer.length,
      {
        'Content-Type': 'image/webp',
      },
    );

    this.natsService.publish<PuzzleProcessingDoneEvent>(
      Subjects.PuzzleProcessingDone,
      {
        id,
      },
    );

    this.notifyDone(id);
  }
}
