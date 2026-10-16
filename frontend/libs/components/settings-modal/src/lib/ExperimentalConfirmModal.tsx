import { useTranslation } from "@storyteller/i18n";
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
  confirmText,
  cancelText,
  confirmVariant = "destructive",
}: Props) => {
  const { t } = useTranslation();
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
          {cancelText ?? t("Cancel")}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm}>
          {confirmText ?? t("Confirm")}
        </Button>
      </div>
    </Modal>
  );
};
