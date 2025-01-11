import { Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import appConfig from 'src/config/app.config';
import natsConfig from 'src/config/nats.config';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from 'src/modules/health/health.module';
import { Publisher } from '@nestjs-plugins/nestjs-nats-streaming-transport';
import { NatsModule } from 'src/modules/nats/nats.module';
import { NestMinioModule } from 'nestjs-minio';
import minioConfig from 'src/config/minio.config';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import redisConfig from 'src/config/redis.config';
import { PuzzleGenModule } from 'src/modules/puzzle-gen/puzzle-gen.module';
import { PuzzleModule } from 'src/modules/puzzle/puzzle.module';
import { RedisClient } from './common/types';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, natsConfig, redisConfig, minioConfig],
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
      expandVariables: true,
    }),

    LoggerModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        return {
          pinoHttp: {
            timestamp: true,
            quietReqLogger: true,
            name: config.get<string>('app.appName'),
            customProps: () => ({
              context: 'HTTP',
            }),
            transport: {
              level: 'debug',
              target: 'pino-pretty',
              options: {
                singleLine: true,
              },
            },
          },
        };
      },
      inject: [ConfigService],
    }),

    NestMinioModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        endPoint: config.get<string>('minio.host'),
        accessKey: config.get<string>('minio.accessKey'),
        secretKey: config.get<string>('minio.secretKey'),
        port: config.get<number>('minio.port'),
        useSSL: false,
      }),
    }),

    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        config: [
          {
            namespace: RedisClient.GENERAL_PURPOSE,
            host: config.get<string>('redis.host'),
            port: config.get<number>('redis.port'),
            db: 0,
          },
          {
            namespace: RedisClient.PUBSUB,
            host: config.get<string>('redis.host'),
            port: config.get<number>('redis.port'),
            db: 0,
          },
        ],
      }),
    }),

    NatsModule,
    HealthModule,

    PuzzleGenModule,
    PuzzleModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule implements OnApplicationShutdown {
  constructor(private publisher: Publisher) {}

  async onApplicationShutdown(signal?: string) {
    this.publisher.close();
  }
}
