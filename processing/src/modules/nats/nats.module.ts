import { NatsStreamingTransport } from '@nestjs-plugins/nestjs-nats-streaming-transport';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NatsService } from './nats.service';

@Module({
  imports: [
    NatsStreamingTransport.registerAsync({
      useFactory: (config: ConfigService) => ({
        clusterId: config.get<string>('nats.clusterId'),
        clientId: config.get<string>('nats.clientId'),
        connectOptions: {
          reconnect: true,
          reconnectTimeWait: 1000,
          url: config.get<string>('nats.url'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [NatsStreamingTransport, NatsService],
  providers: [NatsService],
})
export class NatsModule {}
