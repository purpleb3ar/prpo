import { Snapshot } from '../snapshot';
import { Action, EAction } from './action';

export class PuzzleCreate implements Action {
  public readonly action = EAction.PUZZLE_CREATE_ACTION;

  public readonly id: number;
  public readonly x: number;
  public readonly y: number;

  constructor(data: any) {
    this.id = data.id;
    this.x = data.x;
    this.y = data.y;
  }

  public toString(): string {
    return `${this.action},${this.id},${this.x},${this.y}`;
  }

  public accept(snapshot: Snapshot): void {
    snapshot.applyPuzzleCreate(this);
  }
}
