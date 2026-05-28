import { useCallback, useEffect, useId, useRef } from "react";

// TODO: actions/keybindings-store is part of the actions subsystem (not yet ported).
// This stub matches the openOverlay/closeOverlay surface used by useOverlayOpenChange.
// When keybindings-store lands, replace these no-ops with the real store hook.
function useKeybindingsStore(): {
  openOverlay: (id: string) => void;
  closeOverlay: (id: string) => void;
} {
  return {
    openOverlay: () => {},
    closeOverlay: () => {},
  };
}

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
