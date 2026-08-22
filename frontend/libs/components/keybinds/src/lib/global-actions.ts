import { useEffect } from "react";
import { useResolvedKeybinds } from "./useResolvedKeybinds";
import { ACTIONS } from "./registry";
import { isEventFromEditableElement } from "./matcher";
import type { ActionId } from "./types";

// The "global" surface is a TRIGGER layer, not a behavior layer. Features own
// their app-level behavior (sidebar open state, a future privacy-blur store,
// …) and register it here by action id; the global keybind dispatcher merely
// invokes whatever is registered when the bound key fires. Consequences:
//
//   - A binding with no registered handler is inert — hosts that lack a
//     feature simply never register it (the desktop app has no webapp
//     sidebar, so Ctrl+B does nothing there).
//   - Adding a global shortcut for a new feature = one ActionDef + one
//     BASE_BINDINGS entry in this lib, plus a useGlobalAction call wherever
//     the feature's state lives. No keyboard code in the feature itself.

const handlers = new Map<ActionId, () => void>();

/** Register the behavior for a global action. Returns an unregister fn.
 *  Last registration wins; unregistering only removes your own handler. */
export function registerGlobalAction(
  id: ActionId,
  handler: () => void,
): () => void {
  handlers.set(id, handler);
  return () => {
    if (handlers.get(id) === handler) handlers.delete(id);
  };
}

/** React helper: register `handler` for `id` while the component is mounted.
 *  Pass a stable (useCallback) handler to avoid re-registration churn. */
export function useGlobalAction(id: ActionId, handler: () => void): void {
  useEffect(() => registerGlobalAction(id, handler), [id, handler]);
}

/** The global dispatcher. Mount ONCE at the app shell.
 *
 *  Listens on `window` in the CAPTURE phase deliberately: the modal system
 *  swallows keydowns at document level while a modal is open, and window
 *  capture runs before that — so global actions (sidebar, a future privacy
 *  blur) keep working over open modals. A matched-and-handled event is
 *  stopped so per-surface listeners never double-consume it. */
export function useGlobalKeybinds(): void {
  const { matchAction } = useResolvedKeybinds();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const id = matchAction(e, "global");
      if (!id) return;
      const def = ACTIONS[id];
      if (!def) return;
      if (!def.allowInEditable && isEventFromEditableElement(e)) return;
      const run = handlers.get(id);
      if (!run) return; // no feature registered on this host — stay inert
      if (def.preventDefault) e.preventDefault();
      e.stopPropagation();
      run();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [matchAction]);
}
