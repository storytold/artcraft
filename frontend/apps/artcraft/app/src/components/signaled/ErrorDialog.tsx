import { TriangleAlertIcon } from "lucide-react";
import { useShallow } from "zustand/shallow";

import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { usePageSceneStore } from "@storyteller/ui-pagescene";

export function ErrorDialog() {
  const { showErrorDialog, errorDialogTitle, errorDialogMessage, setShowErrorDialog } =
    usePageSceneStore(
      useShallow((s) => ({
        showErrorDialog: s.showErrorDialog,
        errorDialogTitle: s.errorDialogTitle,
        errorDialogMessage: s.errorDialogMessage,
        setShowErrorDialog: s.setShowErrorDialog,
      })),
    );

  return (
    <Modal
      title={errorDialogTitle}
      titleIcon={TriangleAlertIcon}
      titleIconClassName="text-brand-primary"
      isOpen={showErrorDialog}
      onClose={() => setShowErrorDialog(false)}
      showClose={false}
    >
      <div>
        {errorDialogMessage}
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => setShowErrorDialog(false)}
            variant="secondary"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
