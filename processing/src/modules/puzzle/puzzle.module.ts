import { Module } from '@nestjs/common';
import { NatsModule } from '../nats/nats.module';
import { PuzzleController } from './puzzle.controller.ts';
import { PuzzleGenModule } from '../puzzle-gen/puzzle-gen.module';

@Module({
  imports: [NatsModule, PuzzleGenModule],
  providers: [],
  exports: [],
  controllers: [PuzzleController],
})
export class PuzzleModule {}
