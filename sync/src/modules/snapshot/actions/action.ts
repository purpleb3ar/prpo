import { Snapshot } from '../snapshot';
import { GroupCreate } from './group-create.action';
import { GroupMove } from './group-move.action';
import { PuzzleCreate } from './puzzle-create.action';
import { PuzzleJoinGroup } from './puzzle-join-group.action';
import { PuzzleMove } from './puzzle-move.action';

export enum EAction {
  PUZZLE_CREATE_ACTION = 0,
  PUZZLE_MOVE_ACTION,
  PUZZLE_JOIN_ACTION,
  GROUP_MOVE_ACTION,
  GROUP_CREATE_ACTION,
}

export abstract class Action {
  abstract action: EAction;
  abstract toString(): string;
  abstract accept(snapshot: Snapshot): void;

  static fromString(actionStr: string): Action {
    const actionParts = actionStr.split(',').map((e) => parseInt(e, 10));

    const data = {
      id: actionParts[1],
      x: actionParts[2],
      y: actionParts[3],
      gid: actionParts[4],
    };

    switch (actionParts[0]) {
      case EAction.PUZZLE_CREATE_ACTION:
        return new PuzzleCreate(data);
      case EAction.PUZZLE_JOIN_ACTION:
        return new PuzzleJoinGroup(data);
      case EAction.GROUP_CREATE_ACTION:
        return new GroupCreate(data);
      case EAction.GROUP_MOVE_ACTION:
        return new GroupMove(data);
      case EAction.PUZZLE_MOVE_ACTION:
        return new PuzzleMove(data);
    }
  }
}
