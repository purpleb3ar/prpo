import { useEffect, useRef, useState } from "react";
import Canvas from "./Canvas";

interface CanvasGridProps {
  columns: number | null;
  rows: number | null;
  image: File | null;
  scale: number | null;
  baseSize: number | null;
}

interface IImageData {
  xStart: number;
  yStart: number;
  renderWidth: number;
  renderHeight: number;
}

const CanvasGrid: React.FC<CanvasGridProps> = ({
  image,
  scale,
  columns,
  rows,
  baseSize,
}) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D>();
  const [canvasImage, setCanvasImage] = useState<HTMLImageElement>();
  const [imageData, setImageData] = useState<IImageData>();

  const createImageFromFile = async (
    image: File
  ): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();

      img.addEventListener("load", () => resolve(img));

      img.src = URL.createObjectURL(image);
    });
  };

  const fitImageOn = (
    ctx: CanvasRenderingContext2D,
    imageObj: HTMLImageElement
  ) => {
    const canvas = ctx.canvas;
    let imageAspectRatio = imageObj.width / imageObj.height;
    let canvasAspectRatio = canvas.width / canvas.height;
    let renderableHeight, renderableWidth, xStart, yStart;

    if (imageAspectRatio < canvasAspectRatio) {
      renderableHeight = canvas.height;
      renderableWidth = imageObj.width * (renderableHeight / imageObj.height);
      xStart = (canvas.width - renderableWidth) / 2;
      yStart = 0;
    } else if (imageAspectRatio > canvasAspectRatio) {
      renderableWidth = canvas.width;
      renderableHeight = imageObj.height * (renderableWidth / imageObj.width);
      xStart = 0;
      yStart = (canvas.height - renderableHeight) / 2;
    } else {
      renderableHeight = canvas.height;
      renderableWidth = canvas.width;
      xStart = 0;
      yStart = 0;
    }

    setImageData({
      xStart,
      yStart,
      renderHeight: renderableHeight,
      renderWidth: renderableWidth,
    });

    ctx.drawImage(imageObj, xStart, yStart, renderableWidth, renderableHeight);
  };

  const createPreviewFromImageData = (
    ctx: CanvasRenderingContext2D,
    columns: CanvasGridProps["columns"],
    rows: CanvasGridProps["rows"],
    baseSize: CanvasGridProps["baseSize"]
  ) => {
    const c = ctx.canvas;

    if (columns === null || rows === null || baseSize === null) {
      return null;
    }

    const { renderHeight, renderWidth, xStart, yStart } = imageData!;

    const increaseBy = baseSize * (c.height / canvasImage!.height);

    ctx.beginPath();

    for (let i = 0, x = xStart; i <= columns; i++, x += increaseBy) {
      ctx.moveTo(x, yStart);
      ctx.lineTo(x, renderHeight + yStart);
    }

    for (let i = 0, y = yStart; i <= rows; i++, y += increaseBy) {
      ctx.moveTo(xStart, y);
      ctx.lineTo(xStart + renderWidth, y);
    }

    ctx.strokeStyle = "#7b5eea";
    ctx.lineWidth = 2;

    ctx.stroke();
  };

  const setInternalResolution = (c: HTMLCanvasElement) => {
    const parent = c.parentElement!.getBoundingClientRect();

    c.width = parent.width * 2;
    c.height = parent.height * 2;
  };

  const onImage = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    setCanvasImage(img);
    setInternalResolution(ctx.canvas);
    fitImageOn(ctx, img);
  };

  const setDisplaySize = (c: HTMLCanvasElement) => {
    const parent = c.parentElement!.getBoundingClientRect();

    c.style.width = `${parent.width}px`;
    c.style.height = `${parent.height}px`;
  };

  const initializeCanvas = () => {
    const c = canvas.current!;

    const ctx = c.getContext("2d")!;
    setCtx(ctx);
    setDisplaySize(c);

    return ctx;
  };

  // This effect runs only when the stage renders
  // It prepares the canvas for rendering
  // initializes the context and
  // loads the image

  useEffect(() => {
    const ctx = initializeCanvas();
    createImageFromFile(image!).then((img) => onImage(ctx, img));
  }, []);

  // This effect redraws the preview grid when any of
  // its parameters change. It starts by clearing the canvas,
  // drawing the image and then redrawing the grid.

  useEffect(() => {
    if (ctx && canvasImage) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      fitImageOn(ctx, canvasImage);
      createPreviewFromImageData(ctx, columns, rows, baseSize);
    }
  }, [rows, columns, baseSize, ctx, canvasImage]);

  return (
    <div className="canvas-wrapper">
      <Canvas ref={canvas}></Canvas>
    </div>
  );
};

export default CanvasGrid;
