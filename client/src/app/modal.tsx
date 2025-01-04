import { createContext, ReactNode, useContext, useState } from "react";
import ModalBase from "../components/Modal";
import CreateModal from "../components/Modal/CreateModal";
import SettingsModal from "../components/Modal/SettingsModal";
import { EditModal } from "../components/Modal/EditModal";

export enum ModalType {
  CREATE,
  UPDATE,
  DELETE,
  SETTINGS,
}

const modalComponents: Record<ModalType, any> = {
  [ModalType.CREATE]: CreateModal,
  [ModalType.UPDATE]: EditModal,
  [ModalType.DELETE]: <div>Delete modal</div>,
  [ModalType.SETTINGS]: SettingsModal,
};

interface ModalContextType {
  type: ModalType | null;
  openModal(type: ModalType, props: object): void;
  closeModal(): void;
}

const ModalContext = createContext<ModalContextType | null>(null);

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modal, setModal] = useState<ModalType | null>(null);
  const [props, setProps] = useState<object>({});

  const openModal = async (type: ModalType, props: object) => {
    setModal(type);
    setProps(props);
  };

  const closeModal = async () => {
    setModal(null);
    setProps({});
  };

  const Modal = modal === null ? null : modalComponents[modal];

  return (
    <ModalContext.Provider value={{ type: modal, openModal, closeModal }}>
      {modal !== null && (
        <ModalBase onClose={closeModal} closeOnTap={true}>
          <Modal closeModal={closeModal} {...props}></Modal>
        </ModalBase>
      )}

      {children}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error("useModal must be used within an ModalProvider");
  }

  return context;
};
