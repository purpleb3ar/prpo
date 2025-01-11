import { Action } from './actions/action';
import { GroupCreate } from './actions/group-create.action';
import { GroupMove } from './actions/group-move.action';
import { PuzzleCreate } from './actions/puzzle-create.action';
import { PuzzleJoinGroup } from './actions/puzzle-join-group.action';
import { PuzzleMove } from './actions/puzzle-move.action';

// TODO: remove unnecessary gid = null when no group, simply remove prop (gid)
// to optimize snapshot size

export interface IPiece {
  x: number;
  y: number;
  gid: number | null;
}

export interface IGroup {
  x: number;
  y: number;
}

export type TPieces = { [key: number]: IPiece };
export type TGroups = { [key: number]: IGroup };

export class Snapshot {
  public readonly pieces: TPieces;
  public readonly groups: TGroups;
  public lastMessageId: string;

  constructor(initialState: Snapshot | null) {
    this.pieces = initialState !== null ? initialState.pieces : {};
    this.groups = initialState !== null ? initialState.groups : {};
  }

  public setLastMessageId(id: string) {
    this.lastMessageId = id;
  }

  public apply(action: Action) {
    action.accept(this);
  }

  public applyGroupMove(action: GroupMove) {
    this.groups[action.id].x = action.x;
    this.groups[action.id].y = action.y;
  }

  public applyPuzzleMove(action: PuzzleMove) {
    this.pieces[action.id].x = action.x;
    this.pieces[action.id].y = action.y;
  }

  public applyGroupCreate(action: GroupCreate) {
    this.groups[action.id] = {
      x: action.x,
      y: action.y,
    };
  }

  public applyPuzzleJoinGroup(action: PuzzleJoinGroup) {
    this.pieces[action.id].gid = action.gid;
    this.pieces[action.id].x = action.x;
    this.pieces[action.id].y = action.y;
  }

  public applyPuzzleCreate(action: PuzzleCreate) {
    this.pieces[action.id] = {
      x: action.x,
      y: action.y,
      gid: null,
    };
  }

  stringify() {
    return JSON.stringify({
      pieces: this.pieces,
      groups: this.groups,
    });
  }
}
