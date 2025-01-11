import { Snapshot } from '../snapshot';
import { Action, EAction } from './action';

export class PuzzleJoinGroup implements Action {
  public readonly action = EAction.PUZZLE_JOIN_ACTION;

  public readonly gid: number;
  public readonly id: number;
  public readonly x: number;
  public readonly y: number;

  constructor(data: any) {
    this.gid = data.gid;
    this.id = data.id;
    this.x = data.x;
    this.y = data.y;
  }

  public toString() {
    return `${this.action},${this.id},${this.x},${this.y},${this.gid}`;
  }

  public accept(snapshot: Snapshot) {
    snapshot.applyPuzzleJoinGroup(this);
  }
}
