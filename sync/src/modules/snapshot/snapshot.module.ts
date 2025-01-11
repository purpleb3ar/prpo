import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Module } from '@nestjs/common';
import { SnapshotService } from './snapshot.service';

@Module({
  imports: [RedisModule],
  providers: [SnapshotService],
  exports: [SnapshotService],
})
export class SnapshotModule {}
