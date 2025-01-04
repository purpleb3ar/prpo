import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Puzzle, PuzzleSchema } from './schemas/puzzle.schema';
import { NatsModule } from '../nats/nats.module';
import { PuzzleController } from './puzzle.controller';
import { PuzzleService } from './puzzle.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Puzzle.name,
        schema: PuzzleSchema,
      },
    ]),

    NatsModule,
  ],
  controllers: [PuzzleController],
  providers: [PuzzleService],
  exports: [PuzzleService],
})
export class PuzzleModule {}
