import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import appConfig from 'src/config/app.config';
import natsConfig from 'src/config/nats.config';
import mongoConfig from 'src/config/mongo.config';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from 'src/modules/health/health.module';
import { NatsModule } from 'src/modules/nats/nats.module';
import { PuzzleModule } from 'src/modules/puzzle/puzzle.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { SyncModule } from 'src/modules/sync/sync.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import redisConfig from 'src/config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, natsConfig, mongoConfig, redisConfig],
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

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get('mongo.uri'),
      }),
    }),

    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        config: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
        },
      }),
    }),

    NatsModule,
    HealthModule,

    AuthModule,
    PuzzleModule,
    SyncModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
