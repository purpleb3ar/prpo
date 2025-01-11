import { Snapshot } from '../snapshot';
import { Action, EAction } from './action';

export class GroupCreate implements Action {
  public readonly action = EAction.GROUP_CREATE_ACTION;

  public readonly x: number;
  public readonly y: number;
  public readonly id: number;

  constructor(data: any) {
    this.x = data.x;
    this.y = data.y;
    this.id = data.id;
  }

  public toString() {
    return `${this.action},${this.id},${this.x},${this.y}`;
  }

  public accept(snapshot: Snapshot): void {
    snapshot.applyGroupCreate(this);
  }
}
