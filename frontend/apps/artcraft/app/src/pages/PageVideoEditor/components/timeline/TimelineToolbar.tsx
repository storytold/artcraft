import {
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faMagnet,
  faRotateLeft,
  faRotateRight,
  faScissors,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { Tooltip } from "@storyteller/ui-tooltip";
import { useVideoEditor } from "../../hooks/useVideoEditor";
import { useTimelineUIStore } from "../../stores/timeline-store";

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function TimelineToolbar({ onZoomIn, onZoomOut }: Props) {
  const editor = useVideoEditor();
  const { snappingEnabled, toggleSnapping } = useTimelineUIStore();
  const canUndo = editor.command.canUndo();
  const canRedo = editor.command.canRedo();
  const hasSelection = editor.selection.getSelectedElements().length > 0;

  const handleDelete = () => {
    const selected = editor.selection.getSelectedElements();
    if (selected.length > 0) {
      editor.timeline.deleteElements({ elements: selected });
      editor.selection.clearSelection();
    }
  };

  return (
    <div className="flex h-9 items-center gap-1 border-b border-ui-panel-border bg-ui-panel px-2">
      {/* Undo / Redo */}
      <Tooltip content="Undo (Ctrl+Z)" position="top" delay={300}>
        <Button
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => editor.command.undo()}
          disabled={!canUndo}
        >
          <FontAwesomeIcon icon={faRotateLeft} className="text-xs" />
        </Button>
      </Tooltip>
      <Tooltip content="Redo (Ctrl+Shift+Z)" position="top" delay={300}>
        <Button
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => editor.command.redo()}
          disabled={!canRedo}
        >
          <FontAwesomeIcon icon={faRotateRight} className="text-xs" />
        </Button>
      </Tooltip>

      <div className="mx-1 h-4 w-px bg-ui-panel-border" />

      {/* Split */}
      <Tooltip content="Split at playhead" position="top" delay={300}>
        <Button variant="ghost" className="h-7 w-7 p-0" disabled={!hasSelection}>
          <FontAwesomeIcon icon={faScissors} className="text-xs" />
        </Button>
      </Tooltip>

      {/* Delete */}
      <Tooltip content="Delete selected" position="top" delay={300}>
        <Button
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={handleDelete}
          disabled={!hasSelection}
        >
          <FontAwesomeIcon icon={faTrash} className="text-xs" />
        </Button>
      </Tooltip>

      <div className="mx-1 h-4 w-px bg-ui-panel-border" />

      {/* Snap toggle */}
      <Tooltip
        content={snappingEnabled ? "Snapping on" : "Snapping off"}
        position="top"
        delay={300}
      >
        <Button
          variant="ghost"
          className={`h-7 w-7 p-0 ${snappingEnabled ? "text-primary" : "text-base-fg/40"}`}
          onClick={toggleSnapping}
        >
          <FontAwesomeIcon icon={faMagnet} className="text-xs" />
        </Button>
      </Tooltip>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Zoom controls */}
      <Tooltip content="Zoom out" position="top" delay={300}>
        <Button variant="ghost" className="h-7 w-7 p-0" onClick={onZoomOut}>
          <FontAwesomeIcon icon={faMagnifyingGlassMinus} className="text-xs" />
        </Button>
      </Tooltip>
      <Tooltip content="Zoom in" position="top" delay={300}>
        <Button variant="ghost" className="h-7 w-7 p-0" onClick={onZoomIn}>
          <FontAwesomeIcon icon={faMagnifyingGlassPlus} className="text-xs" />
        </Button>
      </Tooltip>
    </div>
  );
}
