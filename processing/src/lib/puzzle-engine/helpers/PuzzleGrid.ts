import { PieceTemplate } from '../types/IPieceTemplate';
import { Grid } from '../types/TGrid';
import { SegmentIndexPair } from '../types/TSegmentIndexPair';

export class PuzzleGrid {
  private readonly grid: Grid;
  private readonly columns: number;
  private readonly rows: number;

  constructor(r: number, c: number) {
    this.rows = r;
    this.columns = c;
    this.grid = this.createGrid(r, c);
  }

  static create(r: number, c: number) {
    return new PuzzleGrid(r, c);
  }

  private createGrid(r: number, c: number) {
    const grid: Grid = [];

    for (let i = 0; i < r; i++) {
      grid[i] = new Array(c);
    }

    return grid;
  }

  public getSegment([r, c]: SegmentIndexPair) {
    return this.grid[r][c];
  }

  public isPopulated(indexPair: SegmentIndexPair) {
    return !!this.getSegment(indexPair);
  }

  public populateSegment([r, c]: SegmentIndexPair, v: PieceTemplate) {
    if (!this.isPopulated([r, c])) {
      this.grid[r][c] = v;
    }
  }

  public isOutOfBounds([r, c]: number[]) {
    return r < 0 || r > this.rows - 1 || c < 0 || c > this.columns - 1;
  }
}
