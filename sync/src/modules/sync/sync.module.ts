import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PuzzleModule } from '../puzzle/puzzle.module';
import { SyncGateway } from './sync.gateway';
import { SnapshotModule } from '../snapshot/snapshot.module';

@Module({
  imports: [AuthModule, PuzzleModule, SnapshotModule],
  controllers: [],
  providers: [SyncGateway],
})
export class SyncModule {}
