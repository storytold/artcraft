import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "secondary" | "destructive" | "ghost" | "action";
}

export const ExperimentalConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  text,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "destructive",
}: Props) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="max-w-md"
      showClose={false}
    >
      <div className="text-sm text-base-fg">{text}</div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};
