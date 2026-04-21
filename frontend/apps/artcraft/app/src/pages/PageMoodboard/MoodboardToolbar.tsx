import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMousePointer,
  faDrawPolygon,
  faTextHeight,
  faObjectGroup,
  faObjectUngroup,
  faGripVertical,
  faTableCells,
  faDiagramProject,
  faRotateLeft,
  faRotateRight,
  faTrash,
} from "@fortawesome/pro-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { useMoodboardStore } from "./MoodboardStore";
import { Tool } from "./types";
import { computeFitToGridPatches } from "./layout/fitToGrid";
import { computeAABB } from "./layout/geometry";
import { computePackPatches } from "./layout/packCollage";
import { clusterByProximity } from "./layout/clusterProximity";

const TOOLS: Array<{ id: Tool; icon: typeof faMousePointer; label: string }> = [
  { id: "select", icon: faMousePointer, label: "Select" },
  { id: "lasso", icon: faDrawPolygon, label: "Lasso" },
  { id: "text", icon: faTextHeight, label: "Text" },
];

export const MoodboardToolbar = () => {
  const tool = useMoodboardStore((s) => s.tool);
  const setTool = useMoodboardStore((s) => s.setTool);
  const group = useMoodboardStore((s) => s.group);
  const groupClusters = useMoodboardStore((s) => s.groupClusters);
  const ungroup = useMoodboardStore((s) => s.ungroup);
  const deleteSelected = useMoodboardStore((s) => s.deleteSelected);
  const undo = useMoodboardStore((s) => s.undo);
  const redo = useMoodboardStore((s) => s.redo);
  const applyLayoutPatches = useMoodboardStore((s) => s.applyLayoutPatches);
  const selectedIds = useMoodboardStore((s) => s.selectedIds);
  const nodes = useMoodboardStore((s) => s.nodes);
  const rootOrder = useMoodboardStore((s) => s.rootOrder);
  const gridSpacing = useMoodboardStore((s) => s.gridSpacing);

  const handleFitToGrid = () => {
    if (selectedIds.size === 0) return;
    const targetNodes = Array.from(selectedIds)
      .map((id) => nodes[id])
      .filter(Boolean);
    applyLayoutPatches(computeFitToGridPatches(targetNodes, gridSpacing));
  };

  const handlePackCollage = () => {
    const ids =
      selectedIds.size > 0 ? Array.from(selectedIds) : rootOrder;
    const targetNodes = ids
      .map((id) => nodes[id])
      .filter((n) => n && n.parentId === null);
    if (targetNodes.length < 2) return;
    const aabb = computeAABB(targetNodes);
    if (!aabb) return;
    applyLayoutPatches(computePackPatches(targetNodes, aabb));
  };

  const handleAutoGroup = () => {
    const ids =
      selectedIds.size > 0 ? Array.from(selectedIds) : rootOrder;
    const targetNodes = ids
      .map((id) => nodes[id])
      .filter((n) => n && n.parentId === null);
    if (targetNodes.length < 2) return;
    const clusters = clusterByProximity(targetNodes);
    const clusterIds = clusters.map((c) => c.map((n) => n.id));
    // One atomic store mutation: single history entry, selection ends on
    // the freshly-created groups so the user immediately sees their effect.
    groupClusters(clusterIds);
  };

  return (
    <div className="flex w-full items-center gap-2 border-b border-ui-panel-border bg-ui-modal/60 px-3 py-2 text-base-fg backdrop-blur">
      <div className="flex items-center gap-1">
        {TOOLS.map((t) => (
          <ToolbarButton
            key={t.id}
            icon={t.icon}
            label={t.label}
            active={tool === t.id}
            onClick={() => setTool(t.id)}
          />
        ))}
      </div>
      <Divider />
      <ToolbarButton
        icon={faObjectGroup}
        label="Group"
        onClick={() => group()}
        disabled={selectedIds.size < 2}
      />
      <ToolbarButton
        icon={faObjectUngroup}
        label="Ungroup"
        onClick={() => ungroup()}
        disabled={selectedIds.size === 0}
      />
      <Divider />
      <ToolbarButton
        icon={faTableCells}
        label="Fit to grid"
        onClick={handleFitToGrid}
        disabled={selectedIds.size === 0}
      />
      <ToolbarButton
        icon={faGripVertical}
        label="Pack collage"
        onClick={handlePackCollage}
      />
      <ToolbarButton
        icon={faDiagramProject}
        label="Auto-group by proximity"
        onClick={handleAutoGroup}
      />
      <div className="ml-auto flex items-center gap-1">
        <ToolbarButton icon={faRotateLeft} label="Undo" onClick={undo} />
        <ToolbarButton icon={faRotateRight} label="Redo" onClick={redo} />
        <ToolbarButton
          icon={faTrash}
          label="Delete"
          onClick={deleteSelected}
          disabled={selectedIds.size === 0}
        />
      </div>
    </div>
  );
};

interface ButtonProps {
  icon: typeof faMousePointer;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const ToolbarButton = ({ icon, label, active, disabled, onClick }: ButtonProps) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className={twMerge(
      "flex h-8 items-center gap-1.5 rounded-md px-2 text-xs transition-colors",
      "hover:bg-white/10",
      active ? "bg-white/15 text-white" : "text-white/70",
      disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent" : "",
    )}
  >
    <FontAwesomeIcon icon={icon} className="text-sm" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const Divider = () => <div className="h-5 w-px bg-white/10" />;
