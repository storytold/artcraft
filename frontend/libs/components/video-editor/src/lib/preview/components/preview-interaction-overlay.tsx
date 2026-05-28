import { useState } from "react";
import { usePreviewViewport } from "./preview-viewport";
import { usePreviewInteraction } from "../hooks/use-preview-interaction";
import type { SnapLine } from "../preview-snap";
import { TransformHandles } from "./transform-handles";
import { MaskHandles } from "./mask-handles";
import { SnapGuides } from "./snap-guides";
import { TextEditOverlay } from "./text-edit-overlay";
// TODO: usePropertiesStore is exported from
// opencut-classic/apps/web/src/components/editor/panels/properties/stores/properties-store.ts
// and tracks which property panel tab is active per element type. The
// PropertiesPanel itself isn't ported yet, so we fall back to never treating
// the preview as in mask mode here. Hosts that have already ported the
// properties panel can replace this with the real selector.
import { useEditor } from "../../editor/use-editor";

export function PreviewInteractionOverlay() {
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  const editor = useEditor();
  const viewport = usePreviewViewport();
  const selectedElements = useEditor((e) => e.selection.getSelectedElements());
  // TODO(properties-store): wire to the real `usePropertiesStore` once the
  // properties panel lands. For now `isMaskMode` is always false, which keeps
  // the transform-handle path active even when the selected element type
  // would otherwise show mask handles.
  const activeTabPerType: Record<string, string | undefined> = {};

  const selectedRef =
    selectedElements.length === 1 ? selectedElements[0] : null;
  const activeTrack = selectedRef
    ? editor.timeline.getTrackById({ trackId: selectedRef.trackId })
    : null;
  const activeElement =
    activeTrack?.elements.find(
      (element) => element.id === selectedRef?.elementId,
    ) ?? null;
  const isMaskMode = activeElement
    ? activeTabPerType[activeElement.type] === "masks"
    : false;

  const {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onDoubleClick,
    editingText,
    commitTextEdit,
  } = usePreviewInteraction({
    onSnapLinesChange: setSnapLines,
    isMaskMode,
  });

  const handlePointerDown = (event: React.PointerEvent) => {
    if (viewport.handlePanPointerDown({ event })) {
      return;
    }

    onPointerDown(event);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (viewport.handlePanPointerMove({ event })) {
      return;
    }

    onPointerMove(event);
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    if (viewport.handlePanPointerUp({ event })) {
      return;
    }

    onPointerUp(event);
  };

  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0 pointer-events-auto"
        role="application"
        aria-label="Preview canvas"
        style={{
          cursor: viewport.isPanning
            ? "grabbing"
            : viewport.canPan
              ? "default"
              : undefined,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={onDoubleClick}
        onDragStart={(e) => e.preventDefault()}
      />
      {editingText ? (
        <TextEditOverlay
          trackId={editingText.trackId}
          elementId={editingText.elementId}
          element={editingText.element}
          onCommit={commitTextEdit}
        />
      ) : isMaskMode ? (
        <MaskHandles onSnapLinesChange={setSnapLines} />
      ) : (
        <TransformHandles onSnapLinesChange={setSnapLines} />
      )}
      <SnapGuides lines={snapLines} />
    </div>
  );
}
