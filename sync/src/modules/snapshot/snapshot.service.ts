import { RedisService } from '@liaoliaots/nestjs-redis';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action } from './actions/action';
import { Snapshot } from './snapshot';
import * as fs from 'node:fs/promises';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

interface ISnapshot extends Record<string, string> {
  snapshotData: string;
  lastMessageId: string;
  //   connectionsMade: string;
}

// -------------|
//            snapshot
//                       |----------------

// O(1) append entries (user produces actions - append)
// O(k) read single entry (where k = length of timestamp)
// O(nk) read n entries (where n = len(range(min, max)))

// generate snapshot
// no snapshot => consider all entries from min to max
//                create snapshot, save last entry id
// snapshot exists => consider all entries from prev snapshot last entry id to max
//                    override prev Snapshot, save new last entry id

const snashotLuaLib = `#!lua name=snapshot_lib
local function incr_or_reset(keys, args)
    local actionCount = redis.call("INCR", keys[1])
    if actionCount >= tonumber(args[1]) then
        redis.call("SET", keys[1], 0)
        return actionCount
    else
        return actionCount
    end
end

redis.register_function('incr_or_reset', incr_or_reset)
`;

@Injectable()
export class SnapshotService implements OnModuleInit {
  private snapshotThreshold = 50;

  private static FROM_START = '-';
  private static TO_END = '+';
  private static DATA_KEY = 'a';
  private static AUTO_GENERATE_ID = '*';
  private static DATA_INDEX = 1;

  constructor(
    @InjectPinoLogger(SnapshotService.name)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    this.logger.info('Loading Lua library');
    const client = this.redisService.getOrThrow();
    await client.function('LOAD', 'REPLACE', snashotLuaLib);
  }

  // we have to track three things:
  // - first is the action log as a redis stream (puzzle:${puzzleId}:actions)
  // - second is the number of actions since last snapshot (puzzle:${puzzleId}:actionCount)
  // - third is the latest snapshot as a hashmap (puzzle:${puzzleId}:snapshot)
  // - fourth is the connection count (puzzle:${puzzleId}:connectionsMade)

  private snapshotKey(roomId: string) {
    return `puzzle:${roomId}:snapshot`;
  }

  private actionsKey(roomId: string) {
    return `puzzle:${roomId}:actions`;
  }

  private actionCountKey(roomId: string) {
    return `puzzle:${roomId}:actionCount`;
  }

  private connectionsMadeKey(roomId: string) {
    return `puzzle:${roomId}:connectionsMade`;
  }

  public async recordAction(roomId: string, action: Action) {
    const client = this.redisService.getOrThrow();

    const actionsKey = this.actionsKey(roomId);
    const actionCountKey = this.actionCountKey(roomId);

    // Append action to the action log
    const messageId = await client.xadd(
      actionsKey,
      SnapshotService.AUTO_GENERATE_ID,
      SnapshotService.DATA_KEY,
      action.toString(),
    );

    const actionCount = await client.fcall(
      'incr_or_reset',
      1,
      actionCountKey,
      this.snapshotThreshold,
    );

    if (actionCount === this.snapshotThreshold) {
      console.log('Creating snapshot');
      await this.createSnapshot(roomId);
    }

    return messageId;
  }

  public async streamAllActions(roomId: string) {
    const client = this.redisService.getOrThrow();

    const actionsKey = this.actionsKey(roomId);

    const messages = await client.xrange(
      actionsKey,
      SnapshotService.FROM_START,
      SnapshotService.TO_END,
    );

    const len = messages.length;
    const actions: string[] = new Array(len);

    for (let i = 0; i < len; i++) {
      const [_, data] = messages[i];
      actions[i] = data[SnapshotService.DATA_INDEX];
    }

    return actions;
  }

  public async getLatestState(roomId: string) {
    const client = this.redisService.getOrThrow();

    const snapshotKey = this.snapshotKey(roomId);
    const actionsKey = this.actionsKey(roomId);

    const previousSnapshotData = (await client.hgetall(
      snapshotKey,
    )) as ISnapshot;

    const lastMessageId =
      previousSnapshotData.lastMessageId || SnapshotService.FROM_START;

    const previousSnapshot = previousSnapshotData.snapshotData
      ? JSON.parse(previousSnapshotData.snapshotData)
      : null;

    const messages = await client.xrange(
      actionsKey,
      lastMessageId,
      SnapshotService.TO_END,
    );

    if (messages.length === 0 && previousSnapshot === null) {
      return null;
    }

    const derivedSnapshot = new Snapshot(previousSnapshot);

    // -1 because the code xrange's "start" argument is inclusive
    // which means that the message with the lastMessageId will also
    // be included
    if (messages.length - 1 === 0) {
      return derivedSnapshot;
    }

    for (const [_, data] of messages) {
      const action = Action.fromString(data[SnapshotService.DATA_INDEX]);
      derivedSnapshot.apply(action);
    }

    derivedSnapshot.setLastMessageId(messages[messages.length - 1][0]);

    return derivedSnapshot;
  }

  public async createSnapshot(roomId: string) {
    const client = this.redisService.getOrThrow();

    const snapshotKey = this.snapshotKey(roomId);
    const snapshot = await this.getLatestState(roomId);

    const data = {
      lastMessageId: snapshot.lastMessageId,
      snapshotData: snapshot.stringify(),
    } as ISnapshot;

    return client.hset(snapshotKey, data);
  }

  public async incrementConnectionsMade(roomId: string, count: number) {
    const client = this.redisService.getOrThrow();
    const key = this.connectionsMadeKey(roomId);
    return client.incrby(key, count);
  }

  public async getConnectionsMade(sessionId: string) {
    const client = this.redisService.getOrThrow();
    const key = this.connectionsMadeKey(sessionId);
    const count = await client.get(key);
    return parseInt(count, 10) || 0;
  }
}
