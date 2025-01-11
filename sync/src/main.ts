import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { LoggerErrorInterceptor, Logger } from 'nestjs-pino';
import { CustomStrategy } from '@nestjs/microservices';
import { Listener } from '@nestjs-plugins/nestjs-nats-streaming-transport';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.disable('x-powered-by');
  app.enable('trust proxy');

  const configService = app.get(ConfigService);

  app.use(helmet());

  const frontendURL = configService.get('app.frontendURL');
  app.enableCors({
    credentials: true,
    origin: frontendURL,
    allowedHeaders: ['content-type', 'cookie'],
    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE'],
  });

  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: true,
      errorHttpStatusCode: 422,
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
        durableName: 'puzzle-depl',
        manualAckMode: true,
        deliverAllAvailable: true,
        ackWait: 2000,
      },
    ),
  };
  app.connectMicroservice(options);

  await app.startAllMicroservices();

  const config = new DocumentBuilder()
    .setTitle('Sync Service API')
    .setDescription(
      'Service in charge puzzle event synchronization, progress tracking and room management',
    )
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(port);
}
bootstrap();
