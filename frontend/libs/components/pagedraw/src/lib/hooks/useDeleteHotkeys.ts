import { useEffect, useCallback } from "react";

interface DeleteHotkeysProps {
  onDelete: () => void;
  target?: Document | HTMLElement;
}

export const useDeleteHotkeys = ({
  onDelete,
  target = document,
}: DeleteHotkeysProps): void => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if the event target is an input field or contentEditable element
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.getAttribute("role") === "textbox"
      ) {
        return; // Don't prevent default for input fields
      }

      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isDelete =
        event.key === "Delete" ||
        event.key === "Backspace" ||
        (isMac && event.metaKey && event.key === "Backspace");

      if (isDelete) {
        event.preventDefault();
        console.log("Delete action triggered");
        onDelete();
      }
    },
    [onDelete],
  );

  useEffect(() => {
    const currentTarget = target || document;
    currentTarget.addEventListener("keydown", handleKeyDown as EventListener);

    return () => {
      currentTarget.removeEventListener(
        "keydown",
        handleKeyDown as EventListener,
      );
    };
  }, [handleKeyDown, target]);
};
