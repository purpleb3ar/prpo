import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Puzzle, PuzzleSchema } from './schemas/puzzle.schema';
import { NatsModule } from '../nats/nats.module';
import { PuzzleController } from './puzzle.controller';
import { PuzzleService } from './puzzle.service';
import { InviteKeyService } from './services/invite-key.service';

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
  providers: [PuzzleService, InviteKeyService],
  exports: [PuzzleService],
})
export class PuzzleModule {}
