import { TriangleAlertIcon } from "lucide-react";
import { useShallow } from "zustand/shallow";

import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { usePageSceneStore } from "@storyteller/ui-pagescene";
import { CopyErrorButton } from "./CopyErrorButton";

export function ErrorDialog() {
  const {
    showErrorDialog,
    errorDialogTitle,
    errorDialogMessage,
    setShowErrorDialog,
  } = usePageSceneStore(
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
      titleIconClassName="text-red-400"
      isOpen={showErrorDialog}
      onClose={() => setShowErrorDialog(false)}
      showClose={false}
    >
      <div>
        <div
          role="region"
          aria-label="Error details"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Keyboard users need to scroll long diagnostics.
          tabIndex={0}
          className="max-h-[50vh] select-text overflow-y-auto whitespace-pre-wrap break-words"
        >
          {errorDialogMessage}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <CopyErrorButton text={errorDialogMessage} />
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
