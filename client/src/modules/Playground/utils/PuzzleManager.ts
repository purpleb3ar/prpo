import { Puzzle, PuzzleAttrs } from "./Puzzle";
import { PuzzleGroup, PuzzleGroupAttrs } from "./PuzzleGroup";

export interface GroupState {
  x: number;
  y: number;
  gid: number;
}

export interface PieceState {
  x: number;
  y: number;
  id: number;
  gid: number;
}

export interface PuzzleState {
  groups: { [key: string]: GroupState };
  pieces: { [key: string]: PieceState };
}

interface PuzzleMetadata {
  numOfColumns: number;
  numOfRows: number;
  actualSize: number;
  originalSize: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface PuzzleSpec {
  requestedPieceSize: number;
  pieceSizeAfterGeneration: number;
  numberOfRows: number;
  numberOfColumns: number;
  pieces: PieceSpec[];
}

export interface PieceSpec {
  idx: number;
  sides: string;
  row: number;
  column: number;
}

export interface RestoreAttrs {
  lastGroupId: number;
}

export enum EventType {
  PUZZLE_CREATE = "puzzle-create",
  PUZZLE_MOVE = "puzzle-move",
  GROUP_MOVE = "group-move",
  GROUP_CREATE = "group-create",
  PUZZLE_JOIN_GROUP = "puzzle-join-group",
  PROGRESS = "puzzle-progress",
  DONE = "puzzle-done",
}

interface Lock {
  username: string;
}

export type EventHandlerFn = (t: EventType, d: any) => void;

export class PuzzleManager {
  private propagateEvents: boolean = true;

  private selectedPieceId: number | null = null;
  private puzzleMetadata: PuzzleMetadata | null = null;
  private mouseDownContext: {
    start: Position;
    translate: Position;
  };
  private pieces: Puzzle[];
  private groups: PuzzleGroup[];

  private nPiecesConnected: number = 1;
  private lastGroupId: number = 0;
  private locks = new Map<number, Lock>();

  public container: HTMLElement | null;

  private eventHandlerFn: EventHandlerFn | null;
  private audio: HTMLAudioElement;

  constructor() {
    this.container = null;
    this.pieces = [];
    this.groups = [];
    this.mouseDownContext = {
      start: {
        x: 0,
        y: 0,
      },
      translate: {
        x: 0,
        y: 0,
      },
    };
    this.eventHandlerFn = null;
    this.audio = this.createSFX();
  }

  private buildObjects(spec: PuzzleSpec, spriteURL: string, isNew: boolean) {
    const pieces = [];

    for (const { idx, sides } of spec.pieces) {
      const row = Math.floor(idx / spec.numberOfColumns);
      const column = idx % spec.numberOfColumns;

      const attrs = {
        spriteURL,
        pieceData: {
          sides,
          idx,
          row,
          column,
        },
      } as PuzzleAttrs;

      pieces.push(
        Puzzle.new(this, attrs, {
          fresh: isNew,
        })
      );
    }

    return pieces;
  }

  public handlePuzzleMove = (data: any) => {
    const { x, y, id } = data;
    this.pieces[id].adjustPosition(x, y);
  };

  public handleGroupMove = (data: any) => {
    const { x, y, id } = data;
    this.groups[id].move(x, y);
  };

  public handleGroupCreated = (data: any) => {
    const { x, y, id } = data;
    this.lastGroupId = id;

    const group = this.createPuzzleGroupAt(
      {
        x,
        y,
      },
      false
    );

    this.container?.appendChild(group.node());
    this.groups.push(group);
  };

  public handlePuzzleJoin = (data: any) => {
    const { x, y, id, gid } = data;

    const group = this.groups[gid];
    const piece = this.pieces[id];

    group.addPuzzle(piece);
    piece.adjustPosition(x, y);
  };

  public addLock(pieceId: number, username: string) {
    if (this.locks.has(pieceId)) {
      return;
    }

    this.pieces[pieceId].lock(username);

    this.locks.set(pieceId, {
      username,
    });
  }

  public removeLock(pieceId: number) {
    if (this.locks.has(pieceId)) {
      this.pieces[pieceId].unlock();
      this.locks.delete(pieceId);
    }
  }

  private applyProgress(puzzles: Puzzle[], progress: PuzzleState) {
    const { pieces: pieceProgress, groups: groupProgress } = progress;
    const groups = new Map<number, PuzzleGroup>();

    let lastGroupId = -1;

    console.log(groupProgress);

    for (const [groupIdStr, group] of Object.entries(groupProgress)) {
      const groupId = parseInt(groupIdStr, 10);

      const attrs = {
        id: groupId,
        position: {
          x: group.x,
          y: group.y,
        },
      } as PuzzleGroupAttrs;

      groups.set(
        groupId,
        PuzzleGroup.new(this, attrs, {
          fresh: false,
        })
      );

      lastGroupId = Math.max(lastGroupId, groupId);
    }

    this.groups = [...groups.values()];

    this.restoreState({
      lastGroupId: lastGroupId + 1,
    });

    this.disableEventPropagation();

    for (let i = 0; i < puzzles.length; i++) {
      const puzzlePiece = puzzles[i];
      if (!pieceProgress[i]) {
        continue;
      }

      const { x, y, gid } = pieceProgress[i];

      puzzlePiece.setPosition({
        x,
        y,
      });

      const group = groups.get(gid);

      if (group) {
        group.add(puzzlePiece);
      }
    }

    this.enableEventPropagation();

    return puzzles;
  }

  async createSandbox(
    spec: PuzzleSpec,
    state: PuzzleState | null,
    spriteURL: string
  ) {
    this.puzzleMetadata = {
      numOfRows: spec.numberOfRows,
      numOfColumns: spec.numberOfColumns,
      originalSize: spec.requestedPieceSize,
      actualSize: spec.pieceSizeAfterGeneration,
    };

    const isNew = state === null;

    const pieces = this.buildObjects(spec, spriteURL, isNew);

    if (!isNew) {
      this.applyProgress(pieces, state!);
    }

    this.pieces = pieces;
  }

  createSFX() {
    const audio = new Audio("/snap.mp3");
    audio.volume = 0.3;
    return audio;
  }

  setContainer(container: HTMLElement) {
    this.container = container;
  }

  onEvent(fn: EventHandlerFn) {
    this.eventHandlerFn = fn;
  }

  enableEventPropagation() {
    this.propagateEvents = true;
  }

  disableEventPropagation() {
    this.propagateEvents = false;
  }

  getNumPieces() {
    return this.puzzleMetadata!.numOfRows * this.puzzleMetadata!.numOfColumns;
  }

  restoreState(state: RestoreAttrs) {
    this.lastGroupId = state.lastGroupId;
  }

  createPuzzleGroupAt(position: Position, fresh: boolean) {
    const attrs = {
      id: this.lastGroupId++,
      position,
    } as PuzzleGroupAttrs;

    const group = PuzzleGroup.new(this, attrs, {
      fresh,
    });

    return group;
  }

  increaseProgressBy(nPieces: number) {
    this.nPiecesConnected = this.nPiecesConnected + nPieces;
    return this.nPiecesConnected;
  }

  getSelectedPiece() {
    if (this.selectedPieceId === null) {
      return null;
    }

    return this.pieces[this.selectedPieceId];
  }

  resetSelectedPiece() {
    this.selectedPieceId = null;
  }

  getPuzzleMetadata() {
    return this.puzzleMetadata;
  }

  sendEvent(eventType: EventType, eventData: any) {
    if (this.eventHandlerFn && this.propagateEvents === true) {
      this.eventHandlerFn(eventType, eventData);
    }
  }

  renderPuzzlePieces() {
    if (!this.container) {
      throw new Error("Cannot render without container");
    }

    for (const group of this.groups) {
      this.container.appendChild(group.node());
    }

    // const layerGroup = new LayerGroup(0);

    for (const piece of this.pieces) {
      piece.prepareForRender();
      piece.setMap(this.container);

      if (!piece.hasGroup()) {
        this.container.appendChild(piece.node());
      }

      // const container = piece.node()!;
      // container.addEventListener("mousedown", (e: MouseEvent) =>
      //   this.onNodeMouseDown(piece, e)
      // );

      // layerGroup.add(piece);
    }

    // layerGroup.attach(this.container);
  }

  matchAndConnect = () => {
    const selectedPiece = this.getSelectedPiece()!;
    const potentitalMatches = selectedPiece.toCheck();

    let increaseBy = 0;

    // Consider
    // Currently we only check if the puzzle being
    // dragged can be connected.
    // But if the dragged puzzle is part of a group
    // maybe we could check
    // if any of the border puzzles could be matched

    for (const { side, idx } of potentitalMatches) {
      const checkAgainst = this.pieces[idx];

      if (
        !checkAgainst ||
        (checkAgainst.hasGroup() &&
          selectedPiece.hasGroup() &&
          selectedPiece.group!.getId() === checkAgainst.group!.getId())
      ) {
        continue;
      }

      const matches = checkAgainst.intersectsAtSide(side, selectedPiece);

      if (matches) {
        checkAgainst.connect(selectedPiece, side);
        increaseBy++;
      }
    }

    this.resetSelectedPiece();
    return increaseBy;
  };

  onMouseDown = (e: MouseEvent) => {
    e.preventDefault();

    if (e.button == 2) {
      return;
    }

    const pieceContainer = e.target as HTMLDivElement;

    const id = pieceContainer.getAttribute("data-id");
    if (id) {
      const nodeId = parseInt(id, 10);
      this.selectedPieceId = nodeId;
      this.onNodeMouseDown(this.pieces[nodeId], e);
    }
  };

  onNodeMouseDown = (piece: Puzzle, e: MouseEvent) => {
    const posX = (e.clientX + 0.5) | 0;
    const posY = (e.clientY + 0.5) | 0;

    piece.liftUp();

    const { x, y } = piece.hasGroup()
      ? piece.group!.getPosition()
      : piece.getPosition();

    this.mouseDownContext.translate.x = x;
    this.mouseDownContext.translate.y = y;
    this.mouseDownContext.start.x = posX;
    this.mouseDownContext.start.y = posY;
  };

  onMouseMove = (e: MouseEvent) => {
    e.preventDefault();
    const selectedPiece = this.getSelectedPiece();

    if (selectedPiece === null) {
      return null;
    }

    requestAnimationFrame(() => {
      const { x: startX, y: startY } = this.mouseDownContext.start;
      const { x: translateX, y: translateY } = this.mouseDownContext.translate;

      const deltaX = ((e.clientX + 0.5) | 0) - startX;
      const deltaY = ((e.clientY + 0.5) | 0) - startY;

      const destX = translateX + deltaX;
      const destY = translateY + deltaY;

      return selectedPiece.move(destX, destY);
    });
  };

  private delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  public async replay(replayData: string[]) {
    this.disableEventPropagation();

    for (const piece of this.pieces) {
      piece.resetGroup();
    }

    const groups: Map<number, PuzzleGroup> = new Map();

    for (const actionData of replayData) {
      const [action, id, x, y, gid] = actionData
        .split(",")
        .map((value) => Number.parseInt(value, 10));

      const piece = this.pieces[id];

      switch (action) {
        case 0:
        case 1:
          piece.adjustPosition(x, y);
          break;
        case 4: {
          const group = this.createPuzzleGroupAt({ x, y }, false);
          groups.set(id, group);
          this.container!.appendChild(group.node());
          break;
        }
        case 2: {
          const group = groups.get(gid);

          group!.addPuzzle(piece);
          piece.adjustPosition(x, y);
          break;
        }
        case 3: {
          const group = groups.get(id);
          group!.move(x, y);
          break;
        }
      }

      await this.delay(50);
    }

    this.enableEventPropagation();
  }

  onMouseUp = () => {
    const selectedPiece = this.getSelectedPiece();

    if (selectedPiece == null) {
      return null;
    }

    selectedPiece.liftDown();

    const eventType = selectedPiece.hasGroup()
      ? EventType.GROUP_MOVE
      : EventType.PUZZLE_MOVE;

    const eventData = selectedPiece.hasGroup()
      ? selectedPiece.group?.getData()
      : selectedPiece.getData();

    this.sendEvent(eventType, eventData);

    const progressMade = this.matchAndConnect();

    // if (newProgress === this.getNumPieces()) {
    //   return this.sendEvent(EventType.DONE, { done: true });
    // }

    if (progressMade > 0) {
      this.audio.play();
      this.sendEvent(EventType.PROGRESS, { progress: progressMade });
    }
  };
}
