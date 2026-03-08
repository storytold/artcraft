import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { VideoEditorCore } from "../core/EditorCore";

export function useVideoEditor(): VideoEditorCore {
  const editor = useMemo(() => VideoEditorCore.getInstance(), []);
  const versionRef = useRef(0);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handleChange = () => {
        versionRef.current += 1;
        onStoreChange();
      };
      const unsubs = [
        editor.playback.subscribe(handleChange),
        editor.timeline.subscribe(handleChange),
        editor.scenes.subscribe(handleChange),
        editor.project.subscribe(handleChange),
        editor.media.subscribe(handleChange),
        editor.renderer.subscribe(handleChange),
        editor.selection.subscribe(handleChange),
        editor.command.subscribe(handleChange),
      ];
      return () => unsubs.forEach((fn) => fn());
    },
    [editor],
  );

  const getSnapshot = useCallback(() => versionRef.current, []);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return editor;
}
