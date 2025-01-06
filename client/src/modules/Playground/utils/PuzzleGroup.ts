import { Puzzle } from "./Puzzle";
import { EventType, Position, PuzzleManager } from "./PuzzleManager";

export interface PuzzleGroupAttrs {
  id: number;
  position: Position;
}

export class PuzzleGroup {
  private id: number;
  private position: Position | null;
  private puzzles: Map<number, Puzzle>;
  private manager: PuzzleManager;

  public DOMContainer: HTMLElement | null;

  static new(
    manager: PuzzleManager,
    attrs: PuzzleGroupAttrs,
    opts: { fresh: boolean }
  ) {
    return new PuzzleGroup(manager, attrs, opts.fresh);
  }

  constructor(manager: PuzzleManager, attrs: PuzzleGroupAttrs, fresh: boolean) {
    this.id = attrs.id;
    this.position = attrs.position;
    this.manager = manager;

    this.puzzles = new Map();
    this.DOMContainer = null;

    if (fresh) {
      this.manager.sendEvent(EventType.GROUP_CREATE, this.getData());
    }
  }

  lock(_: string) {
    // TODO: show user
  }

  unlock() {}

  getId() {
    return this.id;
  }

  getData() {
    const { x, y } = this.position!;
    return {
      x: x,
      y: y,
      id: this.id,
    };
  }

  node() {
    if (this.DOMContainer === null) {
      return this.createDOMContainer();
    }

    return this.DOMContainer;
  }

  setPosition(pos: Position) {
    this.position = pos;
    return this;
  }

  getPosition() {
    return this.position!;
  }

  getPuzzle(id: number) {
    return this.puzzles.get(id);
  }

  hasPuzzle(id: number) {
    return this.puzzles.has(id);
  }

  removePuzzle(id: number) {
    this.puzzles.delete(id);
  }

  createDOMContainer() {
    const { x, y } = this.position!;

    const div = document.createElement("div");
    div.setAttribute("class", "group");

    div.style.position = "absolute";
    div.style.transform = `translate(${x}px, ${y}px)`;

    for (const [_, v] of this.puzzles.entries()) {
      div.append(v.node());
    }

    this.DOMContainer = div;

    return div;
  }

  add(...v: Puzzle[]) {
    for (const puzzle of v) {
      this.puzzles.set(puzzle.getId(), puzzle);
      puzzle.joinGroup(this, true);
    }
  }

  addPuzzle(v: Puzzle) {
    this.puzzles.set(v.getId(), v);
    v.joinGroup(this, false);
  }

  merge(piece: Puzzle) {
    const queue = piece.getNeighbourPieces().filter(({ piece }) => !!piece);

    const excludeList = new Set([piece.getId()]);

    const { originalSize } = this.manager.getPuzzleMetadata()!;

    while (queue.length > 0) {
      const { piece, side } = queue.shift()!;

      if (!piece) {
        continue;
      }

      if (Puzzle.SIDES.LEFT.equals(side)) {
        const right = piece.getNeighbourAtSide(Puzzle.SIDES.RIGHT);

        if (right) {
          const { x, y } = right.getPosition()!;

          piece.adjustPosition(x - originalSize, y);
        }
      }

      if (Puzzle.SIDES.RIGHT.equals(side)) {
        const left = piece.getNeighbourAtSide(Puzzle.SIDES.LEFT);

        if (left) {
          const { x, y } = left.getPosition()!;

          piece.adjustPosition(x + originalSize, y);
        }
      }

      if (Puzzle.SIDES.TOP.equals(side)) {
        const bottom = piece.getNeighbourAtSide(Puzzle.SIDES.BOTTOM);

        if (bottom) {
          const { x, y } = bottom.getPosition()!;
          piece.adjustPosition(x, y - originalSize);
        }
      }

      if (Puzzle.SIDES.BOTTOM.equals(side)) {
        const top = piece.getNeighbourAtSide(Puzzle.SIDES.TOP);

        if (top) {
          const { x, y } = top.getPosition()!;

          piece.adjustPosition(x, y + originalSize);
        }
      }

      const toEnqueue = piece.getNeighbourPieces();

      for (let i = 0; i < toEnqueue.length; i++) {
        const { piece } = toEnqueue[i];

        if (!piece || excludeList.has(piece.getId())) {
          continue;
        }

        queue.push(toEnqueue[i]);
        excludeList.add(piece.getId());
      }
    }

    if (piece.group) {
      for (const puzzle of piece.group.puzzles.values()) {
        this.puzzles.set(puzzle.getId(), puzzle);
        puzzle.joinGroup(this, true);
      }
    }
  }

  move(x: number, y: number) {
    this.DOMContainer!.style.transform = `translate(${x}px, ${y}px)`;

    this.setPosition({
      x,
      y,
    });
  }
}
