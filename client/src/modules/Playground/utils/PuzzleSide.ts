export enum Direction {
  LEFT = "left",
  RIGHT = "right",
  TOP = "top",
  BOTTOM = "bottom",
}

export default class Side {
  private side: Direction;
  private oppositeSide: Direction;
  private sideIndex: number;

  constructor(side: Direction, oppositeSide: Direction, sideIndex: number) {
    this.side = side;
    this.oppositeSide = oppositeSide;
    this.sideIndex = sideIndex;
  }

  equals(s: Side) {
    if (s instanceof Side) {
      return this.side === s.side;
    }

    return this.side === s;
  }

  index() {
    return this.sideIndex;
  }

  toString() {
    return this.side;
  }

  opposite() {
    return this.oppositeSide;
  }
}
