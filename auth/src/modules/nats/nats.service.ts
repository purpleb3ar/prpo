import { Publisher } from '@nestjs-plugins/nestjs-nats-streaming-transport';
import { Injectable } from '@nestjs/common';
import { Subjects } from './events/subjects';

interface Event {
  subject: Subjects;
  data: any;
}

@Injectable()
export class NatsService {
  constructor(private publisher: Publisher) {}

  public publish<T extends Event>(subject: T['subject'], data: T['data']) {
    this.publisher.emit(subject, data);
  }
}
