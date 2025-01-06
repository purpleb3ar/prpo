import { Position } from "./PuzzleManager";
import { Direction } from "./PuzzleSide";

interface SideCollider {
  get: (v: Position) => Position;
}

export default class PuzzleColliders {
  private top!: SideCollider;
  private bottom!: SideCollider;
  private right!: SideCollider;
  private left!: SideCollider;

  constructor(zoneSize: number, pieceSize: number) {
    this[Direction.TOP] = this.createCollider(pieceSize / 3 + zoneSize / 2, 0);
    this[Direction.RIGHT] = this.createCollider(
      pieceSize,
      pieceSize / 3 + zoneSize / 2
    );
    this[Direction.BOTTOM] = this.createCollider(
      pieceSize / 3 + zoneSize / 2,
      pieceSize
    );
    this[Direction.LEFT] = this.createCollider(0, pieceSize / 3 + zoneSize / 2);
  }

  static create(zoneSide: number, pieceSize: number) {
    return new PuzzleColliders(zoneSide, pieceSize);
  }

  createCollider(offsetX: number, offsetY: number) {
    return {
      get(v: Position) {
        return {
          x: v.x + offsetX,
          y: v.y + offsetY,
        };
      },
    };
  }

  get(side: Direction, position: Position) {
    const collider = this[side];

    return collider.get(position);
  }
}
