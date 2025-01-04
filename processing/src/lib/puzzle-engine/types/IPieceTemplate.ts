import { Side } from './ESide';

export interface PieceTemplate {
  clipPath: Path2D;
  sides: string;
  opposite: (i: number) => Side;
}
