import { Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import appConfig from 'src/config/app.config';
import natsConfig from 'src/config/nats.config';
import mongoConfig from 'src/config/mongo.config';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from 'src/modules/health/health.module';
import { Publisher } from '@nestjs-plugins/nestjs-nats-streaming-transport';
import { NatsModule } from 'src/modules/nats/nats.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { UserModule } from 'src/modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, natsConfig, mongoConfig],
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

    NatsModule,
    HealthModule,

    UserModule,
    AuthModule,
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
