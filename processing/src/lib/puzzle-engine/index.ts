import ArcGenerator from './helpers/ArcGenerator';
import { PuzzleGrid } from './helpers/PuzzleGrid';
import Puzzlesheet from './helpers/PuzzleSheet';
import { Side } from './types/ESide';
import { PieceTemplate } from './types/IPieceTemplate';
import { PuzzlePiece } from './types/IPuzzlePiece';
import { SegmentIndexPair } from './types/TSegmentIndexPair';
import { Canvas, Image, Path2D } from 'skia-canvas';

export interface PuzzleEngineOpts {
  image: Image | Canvas;
  size: number;
  rows: number;
  columns: number;
  scale?: number;
}

export default class PuzzleEngine {
  private image!: PuzzleEngineOpts['image'];
  private rows!: PuzzleEngineOpts['rows'];
  private columns!: PuzzleEngineOpts['columns'];
  private scale!: PuzzleEngineOpts['scale'];
  private size!: PuzzleEngineOpts['size'];
  private spritesheet!: Puzzlesheet;
  private allPieceTemplates: PieceTemplate[];

  private done!: boolean;

  constructor(options: PuzzleEngineOpts) {
    this.initializeOptions(options);
    this.allPieceTemplates = this.generateAllPossiblePieceTemplates();
  }

  private generateAllPossiblePieceTemplates() {
    const possibleSides = [Side.EDGE, Side.SOCKET, Side.KEY];

    const stringLength = 4;

    const allPuzzlePieceConfigurations = this.allPossibleCombinations(
      possibleSides,
      stringLength,
    );

    return allPuzzlePieceConfigurations.map((pC) => {
      return this.createPieceTemplate(pC);
    });
  }

  private allPossibleCombinations(
    input: Side[],
    length: number,
    curstr: string = '',
  ) {
    if (curstr.length == length) return [curstr];

    let res: string[] = [];

    for (let i = 0; i < input.length; i++) {
      res = [
        ...res,
        ...this.allPossibleCombinations(input, length, curstr + input[i]),
      ];
    }

    return res;
  }

  // private clipManual(ctx: SKRSContext2D, clipPath: Path2D) {
  //   ctx.beginPath();

  //   console.log(clipPath.ops_);
  // }

  private createPieceTemplate(sideConfig: string): PieceTemplate {
    return {
      clipPath: this.createPieceClipPath(sideConfig),
      sides: sideConfig,
      opposite: function (idx: number) {
        return sideConfig[(idx + 2) % 4] as Side;
      },
    };
  }

  private createPieceClipPath(sides: string) {
    const size = this.size;
    const [t, r, b, l] = sides;

    const oneThird = size / 3;
    const oneHalf = size / 2;
    const x = oneThird / 2;
    const y = oneThird / 2;

    const clipPath = new Path2D();

    clipPath.moveTo(x, y);

    if (t === Side.EDGE) {
      clipPath.lineTo(x + size, y);
    } else if (t === Side.KEY || t === Side.SOCKET) {
      clipPath.lineTo(x + oneThird, y);

      const rotation = t === Side.SOCKET;
      ArcGenerator.topArc(clipPath, x + oneHalf, y, oneThird / 2, rotation);

      clipPath.lineTo(x + size, y);
    }

    if (r === Side.EDGE) {
      clipPath.lineTo(x + size, y + size);
    }

    if (r === Side.KEY || r === Side.SOCKET) {
      clipPath.lineTo(x + size, y + oneThird);
      const rotation = r === Side.SOCKET;

      ArcGenerator.rightArc(
        clipPath,
        x + size,
        y + oneHalf,
        oneThird / 2,
        rotation,
      );

      clipPath.lineTo(x + size, y + size);
    }

    if (b === Side.EDGE) {
      clipPath.lineTo(x, y + size);
    }

    if (b === Side.KEY || b === Side.SOCKET) {
      clipPath.lineTo(x + oneThird + oneThird, y + size);

      const rotation = b === Side.SOCKET;

      ArcGenerator.bottomArc(
        clipPath,
        x + oneHalf,
        y + size,
        oneThird / 2,
        rotation,
      );

      clipPath.lineTo(x, y + size);
    }

    if (l === Side.EDGE) {
      clipPath.lineTo(x, y);
    }

    if (l === Side.KEY || l === Side.SOCKET) {
      clipPath.lineTo(x, y + oneThird + oneThird);
      const rotation = l === Side.SOCKET;

      ArcGenerator.leftArc(clipPath, x, y + oneHalf, oneThird / 2, rotation);

      clipPath.lineTo(x, y);
    }

    return clipPath;
  }

  private initializeOptions(opts: PuzzleEngineOpts) {
    if (typeof opts.image === 'undefined') {
      throw new Error(
        'Image was not provided in options (missing `image` property)',
      );
    }

    this.image = opts.image;
    this.size = opts.size;
    this.rows = opts.rows;
    this.columns = opts.columns;
    this.scale = opts.scale;
    this.done = false;

    const projectedPieceSize = this.size + (this.size / 6) * 2;

    this.spritesheet = Puzzlesheet.create({
      w: this.columns * projectedPieceSize,
      h: this.rows * projectedPieceSize,
      size: projectedPieceSize,
    });

    if (this.scale) {
      this.scaleImage(this.scale);
    }
  }

  private scaleImage(scale: number) {
    const imageW = this.image.width as number;
    const imageH = this.image.height as number;

    const c = new Canvas(scale * imageW, scale * imageH);

    const ctx = c.getContext('2d');

    if (!ctx) {
      throw new Error('Context 2D missing');
    }

    ctx.scale(scale, scale);
    ctx.drawImage(this.image, 0, 0, imageW, imageH);

    this.image = c;
  }

  private getAdjacentSegmentIndexPairs(row: number, column: number) {
    return [
      [row - 1, column],
      [row, column + 1],
      [row + 1, column],
      [row, column - 1],
    ];
  }

  private _generateSideConfig(
    adjacentSegmentsIndexPairs: number[][],
    grid: PuzzleGrid,
  ) {
    return adjacentSegmentsIndexPairs.map((indexPair, i) => {
      const side: Side = grid.isOutOfBounds(indexPair)
        ? Side.EDGE
        : grid.isPopulated(indexPair)
          ? grid.getSegment(indexPair).opposite(i)
          : Side.X;

      if (side === Side.KEY) {
        return Side.SOCKET;
      }

      if (side === Side.SOCKET) {
        return Side.KEY;
      }

      return side;
    });
  }

  private matchSides(s1: string, s2: string) {
    for (let i = 0; i < s1.length; i++) {
      const doesNotMatch = s1[i] !== s2[i] && s1[i] !== Side.X;
      const edgeOnX = s1[i] === Side.X && s2[i] === Side.EDGE;

      if (doesNotMatch || edgeOnX) {
        return false;
      }
    }

    return true;
  }

  private randomPiece(allPieces: PieceTemplate[]) {
    return allPieces[Math.floor(Math.random() * allPieces.length)];
  }

  private createPuzzlePiece(piece: PieceTemplate, [r, c]: SegmentIndexPair) {
    const size = this.size;
    const keySize = size / 6;

    const cnv = new Canvas(size + keySize * 2, size + keySize * 2);
    const ct = cnv.getContext('2d')!;

    ct.clip(piece.clipPath);

    ct.drawImage(
      this.image,
      size * c,
      size * r,
      cnv.width,
      cnv.height,
      0,
      0,
      cnv.width,
      cnv.height,
    );

    this.spritesheet.addImage(ct.getImageData(0, 0, cnv.width, cnv.height));

    return {
      actualSize: cnv.width,
      row: r,
      column: c,
      sides: piece.sides,
      idx: r * this.columns + c,
      size: this.size,
    };
  }

  public generatePuzzle() {
    const rows = this.rows;
    const columns = this.columns;

    const grid = PuzzleGrid.create(rows, columns);

    const puzzles: PuzzlePiece[] = [];

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        const proximitySegments = this.getAdjacentSegmentIndexPairs(i, j);

        const sides = this._generateSideConfig(proximitySegments, grid);

        const possiblePieces = this.allPieceTemplates.filter((piece) => {
          return this.matchSides(sides.join(''), piece.sides);
        });

        const piece = this.randomPiece(possiblePieces);

        grid.populateSegment([i, j], piece);

        puzzles.push(this.createPuzzlePiece(piece, [i, j]));
      }
    }

    this.done = true;

    return puzzles;
  }

  public getPuzzlesheet() {
    if (!this.done) {
      throw new Error('The puzzle generation is not done yet');
    }
    return this.spritesheet.toBuffer();
  }
}
