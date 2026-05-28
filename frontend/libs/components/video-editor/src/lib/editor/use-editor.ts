import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { EditorCore } from "../core";

const SNAPSHOT_UNSET = Symbol("snapshotUnset");

function isShallowEqual({
  a,
  b,
}: {
  a: unknown;
  b: unknown;
}): boolean {
  if (Object.is(a, b)) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  return a.every((item, i) => Object.is(item, b[i]));
}

const subscribeNone = () => () => {};

export function useEditor(): EditorCore;
export function useEditor<T>(selector: (editor: EditorCore) => T): T;
export function useEditor<T>(
  selector?: (editor: EditorCore) => T,
): EditorCore | T {
  const editor = useMemo(() => EditorCore.getInstance(), []);
  const snapshotCacheRef = useRef<T | typeof SNAPSHOT_UNSET>(SNAPSHOT_UNSET);

  const subscribeAll = useCallback(
    (onChange: () => void) => {
      const unsubscribers = [
        editor.playback.subscribe(onChange),
        editor.timeline.subscribe(onChange),
        editor.scenes.subscribe(onChange),
        editor.project.subscribe(onChange),
        editor.media.subscribe(onChange),
        editor.renderer.subscribe(onChange),
        editor.selection.subscribe(onChange),
        editor.clipboard.subscribe(onChange),
        editor.diagnostics.subscribe(onChange),
      ];
      return () => {
        unsubscribers.forEach((unsubscribe) => {
          unsubscribe();
        });
      };
    },
    [editor],
  );

  const getSnapshot = useCallback((): EditorCore | T => {
    if (!selector) {
      return editor;
    }

    const next = selector(editor);
    if (
      snapshotCacheRef.current !== SNAPSHOT_UNSET &&
      isShallowEqual({
        a: snapshotCacheRef.current,
        b: next,
      })
    ) {
      return snapshotCacheRef.current;
    }

    snapshotCacheRef.current = next;
    return next;
  }, [editor, selector]);

  return useSyncExternalStore(
    selector ? subscribeAll : subscribeNone,
    getSnapshot,
    getSnapshot,
  );
}
