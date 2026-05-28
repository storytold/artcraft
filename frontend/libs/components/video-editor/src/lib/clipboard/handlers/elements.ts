import { PasteCommand } from "../../commands/timeline";
import type { ClipboardHandler } from "../types";

export const ElementsClipboardHandler = {
  type: "elements",

  canCopy({ selectedElements }) {
    return selectedElements.length > 0;
  },

  copy({ editor, selectedElements }) {
    if (selectedElements.length === 0) {
      return null;
    }

    const results = editor.timeline.getElementsWithTracks({
      elements: selectedElements,
    });
    const items = results.map(({ track, element }) => {
      const { id: _elementId, ...elementWithoutId } = element;
      return {
        trackId: track.id,
        trackType: track.type,
        element: elementWithoutId,
      };
    });

    if (items.length === 0) {
      return null;
    }

    return {
      type: "elements",
      items,
    };
  },

  paste({ entry, context }) {
    if (entry.items.length === 0) {
      return null;
    }

    return new PasteCommand({
      time: context.time,
      clipboardItems: entry.items,
    });
  },
} satisfies ClipboardHandler<"elements">;
