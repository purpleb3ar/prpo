import "./index.css";
import {
  Check,
  Clipboard,
  Edit2Icon,
  PlusIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import {
  Puzzle,
  Visibility,
} from "../../../modules/Home/components/PuzzleList";
import { useEffect, useMemo, useState } from "react";
import { ThreeDots } from "react-loader-spinner";
import { toast } from "react-toastify";

const ensureErrorMessage = (errorResponse: any) => {
  if (errorResponse.message) {
    return Array.isArray(errorResponse.message)
      ? errorResponse.message[0]
      : errorResponse.message;
  }

  return "Something went wrong";
};

interface EditModalProps {
  closeModal: () => void;
  onSuccess: (id: string, puzzle: Puzzle) => void;
  puzzleId: string;
}

interface Collaborator {
  username: string;
  id: string;
}

interface PuzzleDetailed extends Puzzle {
  collaborators: Collaborator[];
  visibility: Visibility;
  inviteKey?: string;
}

interface CollaboratorProps {
  collaborator: Collaborator;
  toRemove: string[];
  markAsDeleted: (id: string) => void;
  unmarkAsDeleted: (id: string) => void;
}

const Collaborator: React.FC<CollaboratorProps> = ({
  collaborator,
  toRemove,
  markAsDeleted,
  unmarkAsDeleted,
}) => {
  const id = collaborator.id;
  const isMarked = toRemove.includes(id);

  const handleDeleteClick = () => {
    if (isMarked) {
      unmarkAsDeleted(id);
    } else {
      markAsDeleted(id);
    }
  };

  return (
    <div className="collaborator-item">
      <UserIcon size={20}></UserIcon>
      <span>{collaborator.username}</span>
      <span className="collaborator-item-x" onClick={() => handleDeleteClick()}>
        {isMarked && <PlusIcon size={20}></PlusIcon>}
        {!isMarked && <XIcon size={20}></XIcon>}
      </span>
    </div>
  );
};

// const GET_SINGLE_URL = "http://localhost:9001/puzzles";
// const UPDATE_SINGLE_URL = "http://localhost:9001/puzzles";
// const REMOVE_COLLABORATOR = "http://localhost:9001/puzzles";

const GET_SINGLE_URL = "https://prpo.purplebear.io/puzzles";
const UPDATE_SINGLE_URL = "https://prpo.purplebear.io/puzzles";
const REMOVE_COLLABORATOR = "https://prpo.purplebear.io/puzzles";

export const EditModal: React.FC<EditModalProps> = ({
  closeModal,
  onSuccess,
  puzzleId,
}) => {
  const [puzzle, setPuzzle] = useState<PuzzleDetailed | null>(null);
  const [toRemove, setToRemove] = useState<string[]>([]);
  const [showCollaborators, setShowCollaborators] = useState<boolean>(false);

  const removeCollaborators = async () => {
    for await (const cid of toRemove) {
      await deleteCollaborator(cid);
    }
  };

  const deleteCollaborator = async (id: string) => {
    if (!puzzle) {
      return;
    }

    const url = `${REMOVE_COLLABORATOR}/${puzzle.id}/collaborator/${id}`;

    await fetch(url, {
      credentials: "include",
      method: "DELETE",
    });
  };

  const fetchSingle = async () => {
    const url = `${GET_SINGLE_URL}/${puzzleId}`;
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const puzzle = await response.json();
      setPuzzle(puzzle);
    } else {
      closeModal();
    }
  };

  const markCollaboratorAsDeleted = (id: string) => {
    if (!puzzle) {
      return;
    }

    setToRemove([...toRemove, id]);
  };

  const unmarkCollaboratorAsDeleted = (id: string) => {
    const newToRemove = toRemove.filter((cid) => cid !== id);
    setToRemove(newToRemove);
  };

  const collaborators = useMemo(() => {
    return puzzle?.collaborators.map((c) => {
      return (
        <Collaborator
          key={c.id}
          toRemove={toRemove}
          unmarkAsDeleted={unmarkCollaboratorAsDeleted}
          markAsDeleted={markCollaboratorAsDeleted}
          collaborator={c}
        ></Collaborator>
      );
    });
  }, [puzzle?.collaborators, toRemove]);

  const handleSave = async () => {
    if (!puzzle) {
      return;
    }

    if (toRemove.length > 0) {
      await removeCollaborators();
    }

    const url = `${UPDATE_SINGLE_URL}/${puzzle.id}`;
    const response = await fetch(url, {
      method: "PUT",
      credentials: "include",
      body: JSON.stringify({
        title: puzzle.title,
        visibility: puzzle.visibility,
        updateInviteKey: true,
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    if (response.ok) {
      toast.success("Puzzle was successfully updated");

      const updatedPuzzle = await response.json();
      const newCollaborators = puzzle.collaborators.filter(
        (c) => !toRemove.includes(c.id)
      );

      setPuzzle({
        ...puzzle,
        inviteKey: updatedPuzzle.inviteKey,
        title: updatedPuzzle.title,
        visibility: updatedPuzzle.visibility,
        collaborators: newCollaborators,
      });

      onSuccess(puzzle.id, {
        columns: puzzle.columns,
        id: puzzle.id,
        owner: puzzle.owner,
        rows: puzzle.rows,
        size: puzzle.size,
        title: updatedPuzzle.title,
        status: puzzle.status,
        visibility: updatedPuzzle.visibility,
      });
    } else {
      const errorResponse = await response.json();
      toast.error(ensureErrorMessage(errorResponse));
    }
  };

  const handleChange = (
    ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const name = ev.target.name as keyof PuzzleDetailed;
    setPuzzle({
      ...puzzle!,
      [name]: ev.target.value,
    });
  };

  const copyToClipboard = async () => {
    if (!puzzle || !puzzle.inviteKey) {
      return;
    }

    await navigator.clipboard.writeText(puzzle.inviteKey);

    toast.success(`Copied invite key to clipboard`);
  };

  useEffect(() => {
    fetchSingle();
  }, [puzzleId]);

  const showButtonText = `${showCollaborators ? "Hide" : "Show"} collaborators`;

  return (
    <div className="edit-modal">
      <div className="modal-header">
        <div className="modal-title">
          <span>
            <Edit2Icon size={28}></Edit2Icon>
          </span>
          <div className="modal-title-container">Edit puzzle</div>
        </div>
        <div className="modal-x" onClick={() => closeModal()}>
          <XIcon size={28}></XIcon>
        </div>
      </div>
      <div className="modal-divider"></div>
      {puzzle === null && (
        <div className="modal-loader">
          <ThreeDots
            visible={true}
            radius={9}
            color="#7b5eea"
            width={64}
            height={64}
          ></ThreeDots>
          Loading puzzle data
        </div>
      )}
      {puzzle !== null && (
        <div className="modal-body gap">
          <div className="row">
            <input
              type="text"
              name="title"
              onChange={(e) => handleChange(e)}
              placeholder="Enter title"
              value={puzzle.title}
            />
            <select
              className="dropdown"
              name="visibility"
              value={puzzle.visibility}
              onChange={(e) => handleChange(e)}
            >
              <option value="invite-only">Invite-Only</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          {puzzle.visibility === Visibility.InviteOnly && (
            <div className="row">
              <input
                type="text"
                name="invite-key"
                value={puzzle.inviteKey || ""}
                placeholder="Save to get invite key"
                readOnly
              />
              <span className="copy-icon" onClick={() => copyToClipboard()}>
                <Clipboard size={28}></Clipboard>
              </span>
            </div>
          )}
          <div
            className="show-collaborators"
            onClick={() => setShowCollaborators(!showCollaborators)}
          >
            {showButtonText}
          </div>
          {showCollaborators && (
            <div className="collaborator-list">{collaborators}</div>
          )}
        </div>
      )}
      <div className="modal-action-bar">
        <button
          className="primary model-action-buttons"
          onClick={() => handleSave()}
        >
          <Check size={22}></Check>
          Save
        </button>
        <button
          className="secondary model-action-buttons"
          onClick={() => closeModal()}
        >
          Close
        </button>
      </div>
    </div>
  );
};
