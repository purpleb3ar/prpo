import { Canvas, CanvasRenderingContext2D, ImageData } from 'skia-canvas';

export interface PuzzlesheetOpts {
  w: number;
  h: number;
  size: number;
}

export default class Puzzlesheet {
  private readonly offscreenCanvas: Canvas;
  private readonly offscreenCanvasContext: CanvasRenderingContext2D;
  private readonly maxWidth: number;
  private readonly maxHeight: number;
  private readonly elementSize: number;

  private prevX: number;
  private currentRow: number;

  constructor(o: PuzzlesheetOpts) {
    this.offscreenCanvas = new Canvas(o.w, o.h);
    const ctx = this.offscreenCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('Context 2D not available.');
    }

    this.offscreenCanvasContext = ctx;

    this.prevX = 0;

    this.maxWidth = o.w;
    this.maxHeight = o.h;

    this.currentRow = 0;

    this.elementSize = o.size;
  }

  static create(o: PuzzlesheetOpts) {
    return new Puzzlesheet(o);
  }

  nextRow() {
    this.currentRow += 1;
    this.prevX = 0;
  }

  _drawImage(data: ImageData, x: number, y: number) {
    this.offscreenCanvasContext.putImageData(data, x, y);
    this.prevX = x + this.elementSize;

    if (this.prevX >= this.maxWidth) {
      this.nextRow();
    }

    if (this.currentRow * this.elementSize > this.maxHeight) {
      throw new Error('The spritesheet is at capacity');
    }
  }

  addImage(imageData: ImageData) {
    this._drawImage(imageData, this.prevX, this.elementSize * this.currentRow);
  }

  toBuffer() {
    return this.offscreenCanvas.toBuffer('webp', {
      quality: 0.5,
    });
  }
}
