import "./index.css";

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Puzzle } from "../Home/components/PuzzleList";
import { io, Socket } from "socket.io-client";
import { PuzzleEvent } from "./events";
import {
  EventType,
  PieceSpec,
  PuzzleManager,
  PuzzleSpec,
  PuzzleState,
} from "./utils/PuzzleManager";
import Viewport from "./components/Viewport";
import { Map } from "./components/Map";
import { toast } from "react-toastify";
import { Repeat1Icon } from "lucide-react";

const FETCH_DETAILS_URL = "http://localhost:9001/puzzles";
const SOCKET_URL = "http://localhost:9003";

interface PieceAttrs {
  actualSize: number;
  row: number;
  column: number;
  idx: number;
  sides: string;
  size: number;
}

interface ProgressData {
  solved: boolean;
  state: PuzzleState | null;
}

type Specification = PieceAttrs[];

const Playground: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [haveDetails, setHaveDetails] = useState<boolean>(false);
  const [manager, setManager] = useState<PuzzleManager | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [isSolved, setSolved] = useState<boolean>(false);
  const [isReplay, setReplay] = useState<boolean>(false);

  const [puzzleDetails, setPuzzleDetails] = useState<Puzzle | null>(null);
  const [specification, setSpecification] = useState<PuzzleSpec | null>(null);
  const [spritesheetURL, setSpritesheetURL] = useState<string | null>("");

  const fetchPuzzle = async (id?: string) => {
    if (!id) {
      return navigate("/app");
    }

    const details = await fetchDetails(id);

    if (details === null) {
      return navigate("/app");
    }

    const [spec, spritesheet] = await Promise.all([
      fetchSpecification(id, details),
      fetchSpritesheet(id),
    ]);

    if (spec === null || spritesheet === null) {
      return navigate("/app");
    }

    setSpecification(spec);
    setPuzzleDetails(details);
    setSpritesheetURL(spritesheet);
    setHaveDetails(true);
  };

  const fetchDetails = async (id: string) => {
    const url = `${FETCH_DETAILS_URL}/${id}`;

    const response = await fetch(url, {
      credentials: "include",
      method: "GET",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  };

  const fetchSpecification = async (id: string, details: Puzzle) => {
    const url = `${FETCH_DETAILS_URL}/${id}/specification`;
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const spec = (await response.json()) as Specification;
    const { actualSize, size } = spec[0];

    const pieces: PieceSpec[] = spec.map((spec) => ({
      column: spec.column,
      row: spec.row,
      idx: spec.idx,
      sides: spec.sides,
    }));

    const puzzleSpec = {
      numberOfColumns: details.columns,
      numberOfRows: details.rows,
      requestedPieceSize: size,
      pieceSizeAfterGeneration: actualSize,
      pieces,
    } as PuzzleSpec;

    return puzzleSpec;
  };

  const fetchSpritesheet = async (id: string) => {
    const url = `${FETCH_DETAILS_URL}/${id}/spritesheet`;
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };

  const onGameEvent = (event: EventType, data: any) => {
    if (!socket) {
      return;
    }

    if (event === EventType.PUZZLE_CREATE) {
      return socket.emit(PuzzleEvent.ClientCreatePiece, data);
    }

    if (event === EventType.PUZZLE_MOVE) {
      return socket.emit(PuzzleEvent.ClientMovePiece, data);
    }

    if (event === EventType.GROUP_MOVE) {
      return socket.emit(PuzzleEvent.ClientMoveGroup, data);
    }

    if (event === EventType.GROUP_CREATE) {
      return socket.emit(PuzzleEvent.ClientCreateGroup, data);
    }

    if (event === EventType.PUZZLE_JOIN_GROUP) {
      return socket.emit(PuzzleEvent.ClientJoinPiece, data);
    }

    if (event === EventType.PROGRESS) {
      return socket.emit(PuzzleEvent.ClientProgress, data);
    }
  };

  const handleSolved = () => {
    toast.success(`You've solved the puzzle`);
    setSolved(true);
  };

  const onProgress = (data: ProgressData) => {
    if (!puzzleDetails || !specification || !spritesheetURL) {
      return;
    }

    setProgress(data);
  };

  const handleReplayClick = () => {
    if (!socket || !isSolved) {
      return;
    }

    socket.emit(PuzzleEvent.ClientRequestActions);
    setReplay(true);
  };

  const handleReplay = async (data: any) => {
    await manager!.replay(data);
    setReplay(false);
  };

  useEffect(() => {
    if (!socket || !manager) {
      return;
    }

    socket.on(PuzzleEvent.ServerResponseActions, handleReplay);
  }, [manager]);

  useEffect(() => {
    if (manager) {
      return;
    }

    if (!progress || !socket || !specification || !spritesheetURL) {
      return;
    }

    const { state, solved } = progress;

    const newManager = new PuzzleManager();
    newManager.onEvent(onGameEvent);
    newManager.createSandbox(specification, state, spritesheetURL);

    socket.on(PuzzleEvent.ServerPieceMoved, newManager.handlePuzzleMove);
    socket.on(PuzzleEvent.ServerGroupMoved, newManager.handleGroupMove);
    socket.on(PuzzleEvent.ServerGroupCreated, newManager.handleGroupCreated);
    socket.on(PuzzleEvent.ServerPieceJoined, newManager.handlePuzzleJoin);
    socket.on(PuzzleEvent.ServerPuzzleSolved, handleSolved);

    setManager(newManager);
    setSolved(solved);
  }, [progress, socket]);

  useEffect(() => {
    fetchPuzzle(id);
  }, []);

  useEffect(() => {
    if (haveDetails === false || socket !== null) return;

    const newSocket = io(SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
      path: "/socket.io",
      transports: ["websocket"],
      query: {
        room: id,
      },
    });

    newSocket.on(PuzzleEvent.ServerPuzzleState, onProgress);

    newSocket.on("connect", () => {
      setSocket(newSocket);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [haveDetails]);

  if (!manager && !isSolved) {
    return <div>Loading data</div>;
  }

  if (isSolved && !isReplay) {
    return (
      <div className="solved">
        <div>Puzzle is solved. Congrats! 🥳🥳🥳🥳</div>
        <div>
          <button className="primary" onClick={() => handleReplayClick()}>
            <Repeat1Icon></Repeat1Icon>
            Replay
          </button>
        </div>
      </div>
    );
  }

  return (
    <Viewport>
      <Map puzzleManager={manager!}></Map>
    </Viewport>
  );
};

export default Playground;
