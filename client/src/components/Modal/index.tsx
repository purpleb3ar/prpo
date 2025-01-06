import { memo, MouseEventHandler, ReactNode } from "react";
import "./index.css";
import ReactDOM from "react-dom";

interface ModalBaseProps {
  children: ReactNode;
  onClose: () => void;
  closeOnTap: boolean;
}

const ModalBase: React.FC<ModalBaseProps> = memo(
  ({ children, closeOnTap, onClose }) => {
    const root = document.getElementById("modal-root")!;

    if (!root) {
      throw new Error("Modal root not found. Cannot render modal.");
    }

    const handleInsideClick: MouseEventHandler<HTMLDivElement> = (event) => {
      if (closeOnTap) {
        event.stopPropagation();
      }
    };

    const handleClickOutside: MouseEventHandler<HTMLDivElement> = () => {
      onClose();
    };

    return ReactDOM.createPortal(
      <div className={`modal modal-show`} onClick={handleClickOutside}>
        <div className="modal-panel" onClick={handleInsideClick}>
          {children}
        </div>
      </div>,
      root
    );
  }
);

export default ModalBase;
