import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { LoggerErrorInterceptor, Logger } from 'nestjs-pino';
import { CustomStrategy } from '@nestjs/microservices';
import { Listener } from '@nestjs-plugins/nestjs-nats-streaming-transport';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.enableShutdownHooks();

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: true,
    }),
  );
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  app.useLogger(app.get(Logger));

  app.disable('x-powered-by');
  app.enable('trust proxy');

  app.enableCors({
    origin: 'http://localhost:3000',
    allowedHeaders: ['Authorization'],
  });

  const port = configService.get<string>('app.http.port');
  const clusterId = configService.get<string>('nats.clusterId');
  const clientId = configService.get<string>('nats.clientId');
  const url = configService.get<string>('nats.url');
  const queueGroupName = configService.get<string>('nats.queueGroupName');
  console.log(port, clusterId, clientId, url, queueGroupName);
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
        // NOTE: we use the durable name of the puzzle service
        // in order to get the entire event history
        durableName: 'puzzle-service',
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
