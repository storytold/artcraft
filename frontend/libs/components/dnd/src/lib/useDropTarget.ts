import { RefObject, useEffect, useRef, useState } from "react";
import { dndCoordinator } from "./coordinator";
import { DragPayload, DropTargetRegistration, HighlightState, MediaKind } from "./types";

// Registers an element as a typed drop target and reports its live highlight
// state. Any field — an image-ref slot, a video-ref slot, a canvas — calls this
// to opt into the unified DnD system.
//
//   const ref = useRef<HTMLDivElement>(null);
//   const { isOver, isRejecting } = useDropTarget({
//     ref, accepts: ["image"], label: "Image Ref",
//     onDrop: (p) => attachReference(p),
//   });
//
// We register ONCE on mount and keep the registration's fields current in place
// each render (via a ref), so changing `accepts`/`onDrop` closures never churns
// the registry — the coordinator always reads the latest values at hit-test time.

let dropTargetCounter = 0;

export interface UseDropTargetOptions<T extends HTMLElement> {
  ref: RefObject<T | null>;
  accepts: MediaKind[];
  onDrop: (payload: DragPayload) => void | Promise<void>;
  label?: string;
  disabled?: boolean;
}

export interface UseDropTargetResult {
  isOver: boolean;
  isRejecting: boolean;
}

export function useDropTarget<T extends HTMLElement = HTMLElement>(
  opts: UseDropTargetOptions<T>,
): UseDropTargetResult {
  const { ref, accepts, onDrop, label, disabled } = opts;
  const [state, setState] = useState<HighlightState>(null);

  const idRef = useRef<string>("");
  if (!idRef.current) idRef.current = `dt-${++dropTargetCounter}`;

  const regRef = useRef<DropTargetRegistration>({
    id: idRef.current,
    getEl: () => ref.current,
    accepts,
    onDrop,
    label,
    disabled,
  });

  // Keep the registration fields live without re-registering.
  regRef.current.getEl = () => ref.current;
  regRef.current.accepts = accepts;
  regRef.current.onDrop = onDrop;
  regRef.current.label = label;
  regRef.current.disabled = disabled;

  useEffect(() => {
    const unregister = dndCoordinator.register(regRef.current, setState);
    return () => {
      unregister();
      setState(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOver: state === "accept", isRejecting: state === "reject" };
}
