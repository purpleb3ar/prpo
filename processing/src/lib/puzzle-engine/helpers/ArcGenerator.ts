import { Path2D } from "skia-canvas";

export default class ArcGenerator {
  static topArc(p: Path2D, x: number, y: number, r: number, c: boolean) {
    p.arc(x, y, r, Math.PI, Math.PI * 2, c);
  }

  static rightArc(p: Path2D, x: number, y: number, r: number, c: boolean) {
    p.arc(x, y, r, (Math.PI / 2) * 3, Math.PI / 2, c);
  }

  static bottomArc(p: Path2D, x: number, y: number, r: number, c: boolean) {
    p.arc(x, y, r, 0, Math.PI, c);
  }

  static leftArc(p: Path2D, x: number, y: number, r: number, c: boolean) {
    p.arc(x, y, r, Math.PI / 2, (Math.PI / 2) * 3, c);
  }
}
