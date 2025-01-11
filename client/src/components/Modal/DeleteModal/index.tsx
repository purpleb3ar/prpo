import { toast } from "react-toastify";
import { useAuth } from "../../../app/auth";
import "./index.css";
import { Check, Trash2Icon } from "lucide-react";

const ensureErrorMessage = (errorResponse: any) => {
  if (errorResponse.message) {
    return Array.isArray(errorResponse.message)
      ? errorResponse.message[0]
      : errorResponse.message;
  }

  return "Something went wrong";
};

interface DeleteModalProps {
  closeModal: () => void;
  onSuccess: (id: string) => void;
  title: string;
  puzzleId: string;
  ownerId: string;
}

// const DELETE_ROUTE = "http://localhost:9001/puzzles";
// const REMOVE_COLLABORATOR = "http://localhost:9001/puzzles";

const DELETE_ROUTE = "https://prpo.purplebear.io/puzzles";
const REMOVE_COLLABORATOR = "https://prpo.purplebear.io/puzzles";

const DeleteModal: React.FC<DeleteModalProps> = ({
  closeModal,
  onSuccess,
  puzzleId,
  ownerId,
  title,
}) => {
  const { user } = useAuth();
  const isOwner = ownerId === user!.id;

  const modalTitle = isOwner
    ? `Delete puzzle - ${title}`
    : `Stop collaborating - ${title}`;

  const prompt = isOwner
    ? `Are you sure you want to delete the puzzle?`
    : `Are you sure you want to stop collaborating on this puzzle?`;

  const handleDeleteClick = async () => {
    const url = isOwner
      ? `${DELETE_ROUTE}/${puzzleId}`
      : `${REMOVE_COLLABORATOR}/${puzzleId}/collaborator/${user!.id}`;

    const response = await fetch(url, {
      method: "DELETE",
      credentials: "include",
    });

    if (response.ok) {
      toast.success("Puzzle successfully removed.");
      onSuccess(puzzleId);
      closeModal();
    } else {
      const errorResponse = await response.json();
      toast.error(ensureErrorMessage(errorResponse));
    }
  };

  return (
    <div className="create-modal">
      <div className="modal-header">
        <div className="modal-title">
          <span>
            <Trash2Icon size={28}></Trash2Icon>
          </span>
          <div className="modal-title-container">{modalTitle}</div>
        </div>
      </div>
      <div className="modal-divider"></div>
      <div className="modal-body">
        <div className="delete-prompt">{prompt}</div>
      </div>
      <div className="modal-action-bar">
        <button
          className="primary model-action-buttons"
          onClick={() => handleDeleteClick()}
        >
          <Check size={22}></Check>
          Delete
        </button>
        <button
          onClick={() => closeModal()}
          className="secondary model-action-buttons"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DeleteModal;
