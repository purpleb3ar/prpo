import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PuzzleModule } from '../puzzle/puzzle.module';
import { SyncGateway } from './sync.gateway';

@Module({
  imports: [AuthModule, PuzzleModule],
  controllers: [],
  providers: [SyncGateway],
})
export class SyncModule {}
