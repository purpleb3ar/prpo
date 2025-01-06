import PuzzleColliders from "./PuzzleCollider";
import { PuzzleGroup } from "./PuzzleGroup";
import { EventType, PieceSpec, Position, PuzzleManager } from "./PuzzleManager";
import Side, { Direction } from "./PuzzleSide";

export interface PuzzleAttrs {
  spriteURL: string;
  pieceData: PieceSpec;
}

export class Puzzle {
  private puzzleManager: PuzzleManager | null;
  private pieceData: PieceSpec;
  private spriteURL: string;
  private position: Position | null = null;

  private colliders: PuzzleColliders | null;
  private ready: boolean;
  private map!: HTMLElement;
  private imageNode: HTMLDivElement | null;
  public group: PuzzleGroup | null;

  static SIDES = {
    LEFT: new Side(Direction.LEFT, Direction.RIGHT, 3),
    TOP: new Side(Direction.TOP, Direction.BOTTOM, 0),
    BOTTOM: new Side(Direction.BOTTOM, Direction.TOP, 2),
    RIGHT: new Side(Direction.RIGHT, Direction.LEFT, 1),
  };

  static new(
    manager: PuzzleManager,
    attrs: PuzzleAttrs,
    opts: { fresh: boolean }
  ) {
    return new Puzzle(manager, attrs, opts.fresh);
  }

  constructor(
    manager: PuzzleManager,
    puzzleAttrs: PuzzleAttrs,
    fresh: boolean
  ) {
    this.puzzleManager = manager;
    this.pieceData = puzzleAttrs.pieceData;
    this.spriteURL = puzzleAttrs.spriteURL;

    this.colliders = null;
    this.imageNode = null;
    this.group = null;

    this.ready = false;

    if (fresh) {
      this.position = this.createInitialPosition();
      this.notifyCreated();
    }
  }

  setManager(manager: PuzzleManager) {
    this.puzzleManager = manager;
  }

  get manager() {
    if (this.puzzleManager) {
      return this.puzzleManager;
    }

    throw new Error("Manager missing. Can not proceed");
  }

  notifyCreated() {
    const { x, y } = this.position!;
    this.manager.sendEvent(EventType.PUZZLE_CREATE, {
      x,
      y,
      id: this.pieceData.idx,
    });
  }

  createInitialPosition() {
    const metadata = this.manager.getPuzzleMetadata()!;

    const x = Math.random() * (window.innerWidth - metadata.actualSize);
    const y = Math.random() * (window.innerHeight - metadata.actualSize);

    return {
      x: (x + 0.5) | 0,
      y: (y + 0.5) | 0,
    };
  }

  getData() {
    return {
      x: this.position!.x,
      y: this.position!.y,
      id: this.pieceData.idx,
    };
  }

  prepareForRender() {
    const { originalSize } = this.manager.getPuzzleMetadata()!;

    if (!this.ready) {
      this.imageNode = this.createImageNode();
      this.colliders = PuzzleColliders.create(originalSize / 3, originalSize);
      this.ready = true;
    }
  }

  toCheck() {
    const { numOfColumns } = this.manager.getPuzzleMetadata()!;

    return [
      {
        side: Puzzle.SIDES.LEFT,
        idx: this.pieceData.idx + 1,
      },
      {
        side: Puzzle.SIDES.RIGHT,
        idx: this.pieceData.idx - 1,
      },
      {
        side: Puzzle.SIDES.TOP,
        idx: this.pieceData.idx + numOfColumns,
      },
      {
        side: Puzzle.SIDES.BOTTOM,
        idx: this.pieceData.idx - numOfColumns,
      },
    ];
  }

  getCurrentState() {
    const gid = this.hasGroup() ? this.group!.getId() : null;
    const { x, y } = this.position!;

    return {
      x: x,
      y: y,
      gid,
      id: this.pieceData.idx,
    };
  }

  getAbsolutePosition() {
    const { x, y } = this.imageNode!.getBoundingClientRect();
    return {
      x,
      y,
    };
  }

  overlap(r1: Position, r2: Position) {
    const { originalSize } = this.manager.getPuzzleMetadata()!;
    const zoneSize = originalSize / 3;

    return (
      r1.x < r2.x + zoneSize &&
      r1.x + zoneSize > r2.x &&
      r1.y < r2.y + zoneSize &&
      r1.y + zoneSize > r2.y
    );
  }

  intersectsAtSide(side: Side, piece: Puzzle) {
    const currentPiece = this.colliders!.get(
      side.toString(),
      this.getAbsolutePosition()
    );
    const checkPiece = piece.colliders!.get(
      side.opposite(),
      piece.getAbsolutePosition()
    );

    return this.overlap(currentPiece, checkPiece);
  }

  connect(v: Puzzle, at: Side) {
    const container = this.map;
    const { originalSize } = this.manager.getPuzzleMetadata()!;
    const { x, y } = this.position!;

    if (!this.hasGroup() && !v.hasGroup()) {
      const group = this.manager.createPuzzleGroupAt(this.position!, true);
      this.adjustPosition(0, 0);

      if (Puzzle.SIDES.LEFT.equals(at)) {
        v.adjustPosition(-originalSize, 0);
      }

      if (Puzzle.SIDES.RIGHT.equals(at)) {
        v.adjustPosition(originalSize, 0);
      }

      if (Puzzle.SIDES.BOTTOM.equals(at)) {
        v.adjustPosition(0, originalSize);
      }

      if (Puzzle.SIDES.TOP.equals(at)) {
        v.adjustPosition(0, -originalSize);
      }

      container.appendChild(group.createDOMContainer());

      return group.add(this, v);
    }

    if (this.hasGroup() && !v.hasGroup()) {
      if (Puzzle.SIDES.LEFT.equals(at)) {
        v.adjustPosition(x - originalSize, y);
      }

      if (Puzzle.SIDES.RIGHT.equals(at)) {
        v.adjustPosition(x + originalSize, y);
      }

      if (Puzzle.SIDES.BOTTOM.equals(at)) {
        v.adjustPosition(x, y + originalSize);
      }

      if (Puzzle.SIDES.TOP.equals(at)) {
        v.adjustPosition(x, y - originalSize);
      }

      return this.group!.add(v);
    }

    if (!this.hasGroup() && v.hasGroup()) {
      const { x: vx, y: vy } = v.position!;

      if (Puzzle.SIDES.LEFT.equals(at)) {
        this.adjustPosition(vx + originalSize, vy);
      }

      if (Puzzle.SIDES.RIGHT.equals(at)) {
        this.adjustPosition(vx - originalSize, vy);
      }

      if (Puzzle.SIDES.BOTTOM.equals(at)) {
        this.adjustPosition(vx, vy - originalSize);
      }

      if (Puzzle.SIDES.TOP.equals(at)) {
        this.adjustPosition(vx, vy + originalSize);
      }

      return v.group!.add(this);
    }

    if (this.hasGroup() && v.hasGroup()) {
      if (Puzzle.SIDES.LEFT.equals(at)) {
        v.adjustPosition(x - originalSize, y);
      }

      if (Puzzle.SIDES.RIGHT.equals(at)) {
        v.adjustPosition(x + originalSize, y);
      }

      if (Puzzle.SIDES.TOP.equals(at)) {
        v.adjustPosition(x, y - originalSize);
      }

      if (Puzzle.SIDES.BOTTOM.equals(at)) {
        v.adjustPosition(x, y + originalSize);
      }

      return this.group!.merge(v);
    }
  }

  lock(username: string) {
    if (this.hasGroup()) {
      this.group!.lock(username);
    }

    // TODO
  }

  unlock() {
    if (this.hasGroup()) {
      this.group!.unlock();
    }
  }

  liftUp() {
    const node = this.hasGroup() ? this.group!.DOMContainer! : this.imageNode!;
    node.classList.add("dragging");
  }

  liftDown() {
    let node = this.hasGroup() ? this.group!.DOMContainer! : this.imageNode!;
    node.classList.remove("dragging");
  }

  hasGroup() {
    return this.group !== null;
  }

  getPosition() {
    return this.position!;
  }

  getNeighbourAtSide(side: Side) {
    const { sides, idx } = this.pieceData;
    const { numOfColumns } = this.manager.getPuzzleMetadata()!;
    /**
     * Checks whether the puzzle whose neihbour we are trying
     * to find, actually has a neighbour at the desired side
     *
     * If the side value at given side index is e (EDGE) that means
     * that the puzzle has no neighbour at that side, so we return nothing
     */

    if (sides[side.index()] === "e") {
      return null;
    }

    /**
     * At this point, we can be sure that the puzzle
     * CAN have a neighbour.
     *
     * Based on the given side we return the neighbour puzzle index
     * at that side.
     *
     * We are only interested in puzzle neighbours that are within the
     * same puzzle group.
     */

    if (Puzzle.SIDES.LEFT.equals(side)) {
      return this.group!.getPuzzle(idx - 1);
    }

    if (Puzzle.SIDES.RIGHT.equals(side)) {
      return this.group!.getPuzzle(idx + 1);
    }

    if (Puzzle.SIDES.TOP.equals(side)) {
      return this.group!.getPuzzle(idx - numOfColumns);
    }

    if (Puzzle.SIDES.BOTTOM.equals(side)) {
      return this.group!.getPuzzle(idx + numOfColumns);
    }

    return null;
  }

  /**
   * Gets all neighbour pieces for this puzzle piece.
   */

  getNeighbourPieces() {
    return Object.values(Puzzle.SIDES).map((v) => ({
      side: v,
      piece: this.getNeighbourAtSide(v),
    }));
  }

  joinGroup(group: PuzzleGroup, emit: boolean) {
    const { x, y } = this.position!;
    this.group = group;

    if (this.group.DOMContainer) {
      this.group.DOMContainer.appendChild(this.node());
    }

    if (emit) {
      this.manager.sendEvent(EventType.PUZZLE_JOIN_GROUP, {
        id: this.pieceData.idx,
        x,
        y,
        gid: group.getId(),
      });
    }
    // We need event batching asap
  }

  adjustPosition(x: number, y: number) {
    const node = this.node()!;

    node.style.transform = `translate(${x}px, ${y}px)`;

    this.setPosition({ x, y });
  }

  setMap(map: HTMLElement) {
    this.map = map;
  }

  resetGroup() {
    if (this.hasGroup()) {
      this.group!.removePuzzle(this.getId());
      this.group = null;
    }
  }

  createImageNode() {
    const { actualSize } = this.manager.getPuzzleMetadata()!;
    const { row, column } = this.pieceData;
    const { x, y } = this.position!;

    const imageElement = document.createElement("div");
    imageElement.setAttribute("class", "puzzle-piece");
    const id = this.getId();
    imageElement.setAttribute("data-id", id.toString());

    const offsetX = column * actualSize;
    const offsetY = row * actualSize;

    imageElement.style.width = `${actualSize}px`;
    imageElement.style.height = `${actualSize}px`;
    imageElement.style.backgroundImage = `url(${this.spriteURL})`;
    imageElement.style.backgroundRepeat = "no-repeat";
    imageElement.style.backgroundPosition = `-${offsetX}px -${offsetY}px`;
    imageElement.style.position = "absolute";
    // imageElement.style.top = `${y}px`;
    // imageElement.style.left = `${x}px`;
    imageElement.style.transform = `translate(${x}px, ${y}px)`;

    return imageElement;
  }

  move(x: number, y: number) {
    if (this.hasGroup()) {
      return this.group!.move(x, y);
    }

    this.adjustPosition(x, y);
  }

  setPosition(pos: Position) {
    this.position = pos;
  }

  node() {
    if (this.ready === false) {
      this.prepareForRender();
    }

    return this.imageNode!;
  }

  getId() {
    return this.pieceData.idx;
  }
}
