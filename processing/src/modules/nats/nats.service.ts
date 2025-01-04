import { Publisher } from '@nestjs-plugins/nestjs-nats-streaming-transport';
import { Injectable } from '@nestjs/common';
import { Subjects } from './events/subjects';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

interface Event {
  subject: Subjects;
  data: any;
}

@Injectable()
export class NatsService {
  constructor(
    @InjectPinoLogger(NatsService.name)
    private logger: PinoLogger,
    private publisher: Publisher,
  ) {}

  public publish<T extends Event>(subject: T['subject'], data: T['data']) {
    this.logger.info(`Publishing event '${subject}'`);
    this.publisher.emit(subject, data);
  }
}
