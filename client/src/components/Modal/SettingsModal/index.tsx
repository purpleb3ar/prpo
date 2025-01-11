import { useEffect, useState } from "react";
import { useAuth } from "../../../app/auth";
import { Settings2, X, Check } from "lucide-react";
import { toast } from "react-toastify";

// const UPDATE_PROFILE_ROUTE = "http://localhost:9000/users";
const UPDATE_PROFILE_ROUTE = "https://prpo.purplebear.io/users";

interface SettingsModalProps {
  closeModal: () => void;
}

const ensureErrorMessage = (errorResponse: any) => {
  if (errorResponse.message) {
    return Array.isArray(errorResponse.message)
      ? errorResponse.message[0]
      : errorResponse.message;
  }

  return "Something went wrong";
};

const SettingsModal: React.FC<SettingsModalProps> = ({ closeModal }) => {
  const { user, checkAuth } = useAuth();
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    setUsername(user!.username);
  }, []);

  const updateProfile = async () => {
    const response = await fetch(UPDATE_PROFILE_ROUTE, {
      method: "PUT",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        username,
      }),
    });

    if (response.ok) {
      await checkAuth();
      toast.success("username updated successfully");
      closeModal();
    } else {
      const err = await response.json();
      toast.error(ensureErrorMessage(err));
    }
  };

  return (
    <div className="settings-modal">
      <div className="modal-header">
        <div className="modal-title">
          <span>
            <Settings2 size={28}></Settings2>
          </span>
          Settings
        </div>
        <div className="modal-x" onClick={() => closeModal()}>
          <X size={28}></X>
        </div>
      </div>
      <div className="modal-divider"></div>
      <div className="modal-body">
        <input
          type="text"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
        />
      </div>
      <div className="modal-action-bar">
        <button
          className="primary model-action-buttons"
          onClick={() => updateProfile()}
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

export default SettingsModal;
