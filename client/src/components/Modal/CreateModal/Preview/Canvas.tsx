import React from "react";

const ForwardRefCanvas = React.forwardRef((_, ref) => {
  // @ts-ignore
  return <canvas ref={ref}></canvas>;
});

const Canvas = React.memo(ForwardRefCanvas);

export default Canvas;
