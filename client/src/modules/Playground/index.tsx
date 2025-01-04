// List of puzzles
// A way to edit each, view each, delete each
// A way to create them

import { ModalType, useModal } from "../../app/modal";

const Playground: React.FC = () => {
  const { openModal } = useModal();

  const onClick = () => {
    openModal(ModalType.CREATE, {
      title: "Create new",
    });
  };

  return (
    <div>
      <button className="primary" onClick={onClick}>
        Open
      </button>
    </div>
  );
};

export default Playground;
