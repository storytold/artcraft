import { useCallback, useEffect, useId, useRef } from "react";
import { useKeybindingsStore } from "../../actions/keybindings-store";

export function useOverlayOpenChange({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { openOverlay, closeOverlay } = useKeybindingsStore();
  const isTrackedRef = useRef(false);
  const isControlled = typeof open === "boolean";
  const overlayId = useId();

  useEffect(() => {
    if (!isControlled) return;

    if (open && !isTrackedRef.current) {
      openOverlay(overlayId);
      isTrackedRef.current = true;
      return;
    }

    if (!open && isTrackedRef.current) {
      closeOverlay(overlayId);
      isTrackedRef.current = false;
    }
  }, [closeOverlay, isControlled, open, openOverlay, overlayId]);

  useEffect(() => {
    return () => {
      if (!isTrackedRef.current) return;
      closeOverlay(overlayId);
      isTrackedRef.current = false;
    };
  }, [closeOverlay, overlayId]);

  return useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        if (nextOpen && !isTrackedRef.current) {
          openOverlay(overlayId);
          isTrackedRef.current = true;
        } else if (!nextOpen && isTrackedRef.current) {
          closeOverlay(overlayId);
          isTrackedRef.current = false;
        }
      }

      onOpenChange?.(nextOpen);
    },
    [closeOverlay, isControlled, onOpenChange, openOverlay, overlayId],
  );
}
