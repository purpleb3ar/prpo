import { useNavigate } from "react-router-dom";
import {
  CirclePlay,
  Delete,
  Edit2,
  PuzzleIcon,
  Ruler,
  Trash2,
  User,
} from "lucide-react";
import { useAuth } from "../../../app/auth";
import { DNA, Grid } from "react-loader-spinner";
import { memo, useEffect } from "react";
import { ModalType, useModal } from "../../../app/modal";

export enum Visibility {
  Public = "public",
  InviteOnly = "invite-only",
  Private = "public",
}

export enum State {
  Created = "created",
  Processing = "processing",
  Done = "done",
}

export interface Puzzle {
  id: string;
  rows: number;
  columns: number;
  size: number;
  title: string;
  visibility: Visibility;
  status: State;
  owner: {
    id: string;
    username: string;
  };
}

interface PuzzleListProps {
  puzzles: Puzzle[];
  removePuzzle: (id: string) => void;
  updatePuzzle: (id: string, updated: Puzzle) => void;
}

interface PuzzleProps {
  puzzle: Puzzle;
  onClickDelete: (id: string) => void;
  onClickUpdate: (id: string, updated: Puzzle) => void;
  onClickPlay: (id: string) => void;
}

const EVENT_SOURCE_URL = "http://localhost:9002/puzzle-gen/progress";
const PUZZLE_SERVICE_API = "http://localhost:9001/puzzles";

const PuzzleItem: React.FC<PuzzleProps> = ({
  puzzle,
  onClickUpdate,
  onClickPlay,
}) => {
  const { user } = useAuth();
  const { openModal } = useModal();
  // here we need to check state
  // and show a loader if state is not done
  // and also connect to progress
  const isOwner = user!.id === puzzle.owner.id;
  const isReady = puzzle.status === State.Done;

  const thumbnailURL = `${PUZZLE_SERVICE_API}/${puzzle.id}/thumbnail`;

  useEffect(() => {
    if (puzzle.status === State.Done) return;

    const url = `${EVENT_SOURCE_URL}/${puzzle.id}`;
    const eventSource = new EventSource(url);

    const handleEvent = () => {
      onClickUpdate(puzzle.id, {
        ...puzzle,
        status: State.Done,
      });

      eventSource.close();
    };

    eventSource.addEventListener("message", handleEvent);

    return () => {
      eventSource.close();
      console.log("Event source closed in cleanup");
    };
  }, [puzzle.status]);

  const handleUpdateClick = () => {
    openModal(ModalType.UPDATE, {
      puzzleId: puzzle.id,
      onSuccess: onClickUpdate,
    });
  };

  return (
    <div className="puzzle-item">
      <div className="puzzle-item-overview">
        {!isReady && (
          <Grid color={"#7b5eea"} visible={true} height={40} width={40}></Grid>
        )}
        {isReady && (
          <img className="puzzle-item-thumbnail" src={thumbnailURL} alt="" />
        )}
        <div className="puzzle-item-title">{puzzle.title}</div>
      </div>

      <div className="puzzle-item-metadata">
        <div className="puzzle-metadata-item">
          <div className="puzzle-metadata-item-icon">
            <PuzzleIcon size={24}></PuzzleIcon>
          </div>
          {puzzle.rows * puzzle.columns}
        </div>
        <div className="puzzle-metadata-item">
          <div className="puzzle-metadata-item-icon">
            <Ruler size={24}></Ruler>
          </div>
          {puzzle.size}
        </div>
        <div className="puzzle-metadata-item">
          <div className="puzzle-metadata-item-icon">
            <User size={24}></User>
          </div>
          {puzzle.owner.username}
        </div>
      </div>
      <div className="puzzle-item-play">
        {isOwner && (
          <button className="action-button-secondary action-button">
            <Trash2 size={20}></Trash2>
          </button>
        )}
        {isOwner && (
          <button
            onClick={() => handleUpdateClick()}
            className="action-button-secondary action-button"
          >
            <Edit2 size={20}></Edit2>
          </button>
        )}
        <button
          className="primary action-button ml10"
          onClick={() => onClickPlay(puzzle.id)}
        >
          <CirclePlay></CirclePlay>
          Play
        </button>
      </div>
    </div>
  );
};

const PuzzleList: React.FC<PuzzleListProps> = ({
  puzzles,
  removePuzzle,
  updatePuzzle,
}) => {
  const navigate = useNavigate();

  const handleDelete = (id: string) => {
    removePuzzle(id);
  };

  const handleUpdate = (id: string, puzzle: Puzzle) => {
    updatePuzzle(id, puzzle);
  };

  const handlePlay = (id: string) => {
    const navigateURL = `/playground/${id}`;
    navigate(navigateURL);
  };

  return (
    <div className="puzzle-list">
      {puzzles.map((puzzle) => (
        <PuzzleItem
          key={puzzle.id}
          onClickPlay={handlePlay}
          onClickDelete={handleDelete}
          onClickUpdate={handleUpdate}
          puzzle={puzzle}
        ></PuzzleItem>
      ))}
    </div>
  );
};

export default PuzzleList;
