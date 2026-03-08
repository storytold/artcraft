import { useCallback } from "react";
import type { VideoEditorCore } from "../../../core/EditorCore";

export function useElementSelection(editor: VideoEditorCore) {
  const handleSelect = useCallback(
    (
      e: React.MouseEvent,
      elementId: string,
      trackId: string,
    ) => {
      const current = editor.selection.getSelectedElements();
      if (e.shiftKey) {
        const already = current.some(
          (el) => el.elementId === elementId && el.trackId === trackId,
        );
        if (already) {
          editor.selection.setSelectedElements({
            elements: current.filter(
              (el) =>
                !(el.elementId === elementId && el.trackId === trackId),
            ),
          });
        } else {
          editor.selection.setSelectedElements({
            elements: [...current, { trackId, elementId }],
          });
        }
      } else {
        editor.selection.setSelectedElements({
          elements: [{ trackId, elementId }],
        });
      }
    },
    [editor],
  );

  const handleDeselectAll = useCallback(() => {
    editor.selection.clearSelection();
  }, [editor]);

  return { handleSelect, handleDeselectAll };
}
