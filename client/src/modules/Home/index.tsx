import "./index.css";
import { ModalType, useModal } from "../../app/modal";
import {
  Plus,
  Puzzle as PuzzlePiece,
  LogOut,
  Settings2,
  User2,
} from "lucide-react";
import { useAuth } from "../../app/auth";
import PuzzleList, { Puzzle } from "./components/PuzzleList";
import { useEffect, useState } from "react";

// const GET_PUZZLES_ROUTE = "http://localhost:9001/puzzles";
const GET_PUZZLES_ROUTE = "https://prpo.purplebear.io/puzzles";

const Home: React.FC = () => {
  const { openModal } = useModal();
  const { user, logout } = useAuth();
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [filter, setFilter] = useState("owned");

  const getPuzzles = async () => {
    const routeSuffix = filter === "public" ? "/public" : "";

    const url = `${GET_PUZZLES_ROUTE}${routeSuffix}`;

    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const puzzles = await response.json();
      setPuzzles(puzzles);
    } else {
      console.log("aww");
    }
  };

  useEffect(() => {
    getPuzzles();
  }, [filter]);

  const updatePuzzle = (id: string, updated: Puzzle) => {
    const newPuzzles = puzzles.map((puzzle) => {
      if (puzzle.id === id) {
        return updated;
      }

      return puzzle;
    });

    setPuzzles(newPuzzles);
  };

  const addPuzzle = (puzzle: Puzzle) => {
    setPuzzles([puzzle, ...puzzles]);
  };

  const removePuzzle = (id: string) => {
    setPuzzles(puzzles.filter((puzzle) => puzzle.id !== id));
  };

  const onSettingsClick = () => {
    openModal(ModalType.SETTINGS, {});
  };

  const onNewClick = () => {
    openModal(ModalType.CREATE, {
      onSuccess: addPuzzle,
    });
  };

  const onLogoutClick = () => {
    logout();
  };

  return (
    <div className="main-container">
      <div className="top-bar">
        <div className="title">
          <PuzzlePiece></PuzzlePiece>
          <select
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="public">Public</option>
            <option value="owned">Owned</option>
          </select>
        </div>
        {/* <div className="user-data">{user?.username}</div> */}
        <div className="button-area">
          <button className="primary add-button" onClick={() => onNewClick()}>
            Create
            <Plus></Plus>
          </button>
        </div>
      </div>
      <div className="puzzle-area">
        <PuzzleList
          removePuzzle={removePuzzle}
          updatePuzzle={updatePuzzle}
          puzzles={puzzles}
        ></PuzzleList>
      </div>
      <div className="bottom-bar">
        <div className="user-info">
          <button className="terciary">
            <User2 size={30}></User2>
            {user?.username}
          </button>
        </div>
        <div className="bottom-bar-button-area">
          <button
            className="secondary bottom-bar-button"
            onClick={() => onLogoutClick()}
          >
            <LogOut size={20}></LogOut>
          </button>
          <button
            className="secondary bottom-bar-button"
            onClick={() => onSettingsClick()}
          >
            <Settings2 size={20}></Settings2>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
