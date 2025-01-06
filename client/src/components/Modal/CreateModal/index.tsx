import "./index.css";
import { X, Check, PuzzleIcon, ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import CanvasGrid from "./Preview";
import { Puzzle } from "../../../modules/Home/components/PuzzleList";
import { toast } from "react-toastify";

interface SettingsModalProps {
  closeModal: () => void;
  onSuccess: (puzzle: Puzzle) => void;
}

const ensureErrorMessage = (errorResponse: any) => {
  if (errorResponse.message) {
    return Array.isArray(errorResponse.message)
      ? errorResponse.message[0]
      : errorResponse.message;
  }

  return "Something went wrong";
};

const CREATE_PUZZLE_URL = "http://localhost:9001/puzzles";

const CreateModal: React.FC<SettingsModalProps> = ({
  onSuccess,
  closeModal,
}) => {
  const [title, setTitle] = useState<string>("");
  const [rows, setRows] = useState<number>();
  const [columns, setColumns] = useState<number>();
  const [size, setSize] = useState<number>();
  const [image, setImage] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFileChooser = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    setImage(files[0]);
  };

  const savePuzzle = async () => {
    if (!rows || !columns || !size || !image) {
      return;
    }

    const formData = new FormData();

    formData.set("title", title);
    formData.set("rows", rows.toString());
    formData.set("columns", columns.toString());
    formData.set("size", size.toString());
    formData.set("visibility", visibility);
    formData.set("image", image);

    const response = await fetch(CREATE_PUZZLE_URL, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      onSuccess(data);
      toast.success(
        `Puzzle '${title} successfully created. Awaiting generation`
      );
      closeModal();
    } else {
      toast.error(ensureErrorMessage(data));
    }
  };

  const ensureNumeric = (value: any) => {
    if (Number.isNaN(value)) {
      return undefined;
    }

    return value;
  };

  return (
    <div className="create-modal">
      <div className="file-chooser">
        <input
          type="file"
          multiple
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
      <div className="modal-header">
        <div className="modal-title">
          <span>
            <PuzzleIcon size={28}></PuzzleIcon>
          </span>
          <div className="modal-title-container">Create puzzle</div>
        </div>
        <div className="modal-x" onClick={() => closeModal()}>
          <X size={28}></X>
        </div>
      </div>
      <div className="modal-divider"></div>
      <div className="modal-body">
        <input
          type="text"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter puzzle title"
        />
        <div className="puzzle-specs-area">
          <input
            type="number"
            value={ensureNumeric(size)}
            onChange={(e) => setSize(e.target.valueAsNumber)}
            name="size"
            placeholder="Enter size"
          />
          <input
            type="number"
            value={ensureNumeric(rows)}
            onChange={(e) => setRows(e.target.valueAsNumber)}
            name="rows"
            placeholder="Enter rows"
          ></input>
          <input
            type="number"
            value={ensureNumeric(columns)}
            onChange={(e) => setColumns(e.target.valueAsNumber)}
            name="columns"
            placeholder="Enter columns"
          />
        </div>

        {image === null && (
          <div className="image-prompt" onClick={() => openFileChooser()}>
            <ImageIcon size={32}></ImageIcon>
            <span>Upload image</span>
          </div>
        )}

        {image !== null && (
          <div className="preview-area">
            <CanvasGrid
              baseSize={size || null}
              columns={columns || null}
              rows={rows || null}
              image={image}
              scale={1}
            ></CanvasGrid>
          </div>
        )}

        <div className="mt10">
          <select
            name="visibility"
            className="dropdown"
            onChange={(e) => setVisibility(e.target.value)}
            value={visibility}
          >
            <option value="" disabled hidden>
              Select visbility
            </option>
            <option value="invite-only" id="">
              Invite Only
            </option>
            <option value="public" id="">
              Public
            </option>
            <option value="private" id="">
              Private
            </option>
          </select>
          {visibility === "public" && (
            <div className="warning">
              <span>Note</span>: Public puzzles cannot be deleted
            </div>
          )}
        </div>
      </div>
      <div className="modal-action-bar">
        <button
          className="primary model-action-buttons"
          onClick={() => savePuzzle()}
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

export default CreateModal;
