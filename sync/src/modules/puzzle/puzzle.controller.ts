import { Controller } from '@nestjs/common';
import { PuzzleService } from './puzzle.service';
import { Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { Subjects } from '../nats/events/subjects';
import { NatsStreamingContext } from '@nestjs-plugins/nestjs-nats-streaming-transport';
import { PuzzleCreatedEvent } from '../nats/events/puzzle-created.event';
import { PuzzleUpdatedEvent } from '../nats/events/puzzle-updated.event';

@Controller('puzzles')
export class PuzzleController {
  constructor(private puzzleService: PuzzleService) {}

  @EventPattern(Subjects.PuzzleCreated)
  async puzzleCreatedHandler(
    @Payload() data: PuzzleCreatedEvent['data'],
    @Ctx() { message }: NatsStreamingContext,
  ) {
    const ack = await this.puzzleService.createPuzzle(data);

    if (ack) {
      message.ack();
    }
  }

  @EventPattern(Subjects.PuzzleUpdated)
  async puzzleUpdatedHandler(
    @Payload() data: PuzzleUpdatedEvent['data'],
    @Ctx() { message }: NatsStreamingContext,
  ) {
    const ack = await this.puzzleService.updatePuzzle(data);
    if (ack) {
      message.ack();
    }
  }
}
