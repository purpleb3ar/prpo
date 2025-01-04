import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { LoggerErrorInterceptor, Logger } from 'nestjs-pino';
import { CustomStrategy } from '@nestjs/microservices';
import { Listener } from '@nestjs-plugins/nestjs-nats-streaming-transport';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.disable('x-powered-by');
  app.enable('trust proxy');

  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser());

  const frontendURL = configService.get('app.frontendURL');
  app.enableCors({
    credentials: true,
    origin: frontendURL,
    exposedHeaders: ['set-cookie'],
    allowedHeaders: ['content-type', 'cookie'],
    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE'],
  });

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
    }),
  );
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  app.useLogger(app.get(Logger));

  const port = configService.get<string>('app.http.port');
  const clusterId = configService.get<string>('nats.clusterId');
  const clientId = configService.get<string>('nats.clientId');
  const url = configService.get<string>('nats.url');
  const queueGroupName = configService.get<string>('nats.queueGroupName');

  const options: CustomStrategy = {
    strategy: new Listener(
      clusterId,
      clientId,
      queueGroupName,
      {
        url,
        reconnect: true,
        reconnectTimeWait: 2000,
      },
      {
        durableName: queueGroupName,
        manualAckMode: true,
        deliverAllAvailable: true,
        ackWait: 2000,
      },
    ),
  };
  app.connectMicroservice(options);

  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap();
