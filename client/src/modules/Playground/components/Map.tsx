import React from "react";
import { PuzzleManager } from "../utils/PuzzleManager";

interface OwnProps {
  puzzleManager: PuzzleManager;
}

interface MapState {
  translateX: number;
  translateY: number;
  isPanning: boolean;
  startX: number;
  startY: number;
}

export class Map extends React.Component<OwnProps, MapState> {
  private readonly mapRef: React.RefObject<HTMLDivElement>;

  constructor(props: OwnProps) {
    super(props);
    this.mapRef = React.createRef();

    this.state = {
      translateX: 0,
      translateY: 0,
      isPanning: false,
      startX: 0,
      startY: 0,
    };

    this.onContextMenu = this.onContextMenu.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  getMap() {
    return this.mapRef.current!;
  }

  onContextMenu(e: MouseEvent) {
    e.preventDefault();

    const startX = e.clientX - this.state.translateX;
    const startY = e.clientY - this.state.translateY;

    this.setState({
      startY,
      startX,
      isPanning: true,
    });

    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);
  }

  onMouseDown(e: MouseEvent) {
    console.log("window mouse down", e.target);
  }

  onMouseMove(e: MouseEvent) {
    if (this.state.isPanning === false) {
      return;
    }

    this.moveCamera(e.clientX, e.clientY);
  }

  moveCamera = (x: number, y: number) => {
    this.setState({
      translateX: x - this.state.startX,
      translateY: y - this.state.startY,
    });
  };

  onMouseUp() {
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);

    this.setState({
      isPanning: false,
    });
  }

  componentDidMount() {
    this.props.puzzleManager.setContainer(this.getMap());
    this.props.puzzleManager.renderPuzzlePieces();

    window.addEventListener("mousemove", this.props.puzzleManager.onMouseMove);
    window.addEventListener("mouseup", this.props.puzzleManager.onMouseUp);
    window.addEventListener("mousedown", this.props.puzzleManager.onMouseDown);
    window.addEventListener("contextmenu", this.onContextMenu);
  }

  componentWillUnmount(): void {
    window.removeEventListener(
      "mousemove",
      this.props.puzzleManager.onMouseMove
    );
    window.removeEventListener("mouseup", this.props.puzzleManager.onMouseUp);
    window.removeEventListener("contextmenu", this.onContextMenu);
    window.removeEventListener(
      "mousedown",
      this.props.puzzleManager.onMouseDown
    );
  }

  render() {
    const { translateY, translateX } = this.state;
    const transform = `translate(${translateX}px, ${translateY}px)`;

    return (
      <div
        style={{ transform: `${transform}` }}
        id="map"
        className="map"
        ref={this.mapRef}
      ></div>
    );
  }
}
