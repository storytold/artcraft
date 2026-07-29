import { useEffect } from "react";
import Konva from "konva";
import { addCanvasImageFromFile } from "../addCanvasImageFile";
import type { MoodboardAdapter } from "../../adapter";

// Listens for paste events while the moodboard page is mounted. For each
// image entry on the clipboard, immediately drops a blob-URL image onto the
// canvas at the viewport center, then asynchronously uploads it and writes
// the returned media token back onto the node (see addCanvasImageFromFile).
export const usePasteHandler = (
  adapter: MoodboardAdapter,
  active: boolean,
  stageRef: React.RefObject<Konva.Stage | null>,
) => {
  useEffect(() => {
    if (!active) return undefined;

    const handler = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea/i.test(target.tagName)) return;
      if (target && target.isContentEditable) return;

      const items = e.clipboardData?.items;
      if (!items) return;
      const fileItems: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind === "file" && it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) fileItems.push(f);
        }
      }
      if (fileItems.length === 0) return;
      e.preventDefault();

      const stage = stageRef.current;
      const center = stage
        ? { x: stage.width() / 2, y: stage.height() / 2 }
        : { x: 400, y: 400 };

      for (const file of fileItems) {
        await addCanvasImageFromFile({ file, position: center, adapter });
      }
    };

    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [adapter, active, stageRef]);
};
