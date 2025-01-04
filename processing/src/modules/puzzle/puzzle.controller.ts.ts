import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { Subjects } from '../nats/events/subjects';
import { PuzzleCreatedEvent } from '../nats/events/puzzle-created.event';
import { NatsStreamingContext } from '@nestjs-plugins/nestjs-nats-streaming-transport';
import { PuzzleGenService } from '../puzzle-gen/puzzle-gen.service';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Controller()
export class PuzzleController {
  constructor(
    @InjectPinoLogger(PuzzleController.name)
    private logger: PinoLogger,
    private puzzleGenService: PuzzleGenService,
  ) {}

  async mockWork(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  @EventPattern(Subjects.PuzzleCreated)
  async puzzleCreatedHandler(
    @Payload() data: PuzzleCreatedEvent['data'],
    @Ctx() { message }: NatsStreamingContext,
  ) {
    const now = performance.now();
    await this.puzzleGenService.generateFromEvent(data);
    const elapsed = performance.now() - now;

    this.logger.info('Job processing took: ' + elapsed + ' ms');

    message.ack();
  }
}
