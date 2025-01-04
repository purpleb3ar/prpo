import { RedisService } from '@liaoliaots/nestjs-redis';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { map, Observable, Subject } from 'rxjs';
import { RedisClient } from 'src/app/common/types';

export interface EventData {
  data: string;
}

@Injectable()
export class RedisNotificationProxyService
  implements OnModuleInit, OnModuleDestroy
{
  private eventSubjects: Map<string, Subject<EventData>> = new Map();

  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    const client = this.redisService.getOrThrow(RedisClient.PUBSUB);
    const channelName = this.configService.get<string>('redis.channel');

    client.subscribe(channelName);
    client.on('message', this.forward);
  }

  onModuleDestroy() {
    const client = this.redisService.getOrThrow(RedisClient.PUBSUB);
    client.unsubscribe();
    client.off('message', this.forward);
  }

  private forward = (_, message: string) => {
    const parsedMessage = JSON.parse(message);
    const puzzleId = parsedMessage.puzzleId;

    console.log(parsedMessage);
    const eventSubject = this.eventSubjects.get(puzzleId);
    console.log(eventSubject);

    if (!eventSubject) {
      return;
    }

    eventSubject.next({
      data: message,
    });

    eventSubject.complete();
    this.eventSubjects.delete(puzzleId);
  };

  public getObservable(puzzleId: string): Observable<{ data: EventData }> {
    console.log('New client interested in', puzzleId);
    const eventSubject = new Subject<EventData>();
    this.eventSubjects.set(puzzleId, eventSubject);

    return eventSubject.asObservable().pipe(
      map((data) => ({
        data,
      })),
    );
  }
}
