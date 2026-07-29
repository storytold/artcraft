import {
  faMousePointer,
  faDrawPolygon,
  faObjectGroup,
  faObjectUngroup,
  faGripVertical,
  faTableCells,
  faDiagramProject,
  faRotateLeft,
  faRotateRight,
  faTrash,
  faPlus,
  faImages,
  faArrowUpFromBracket,
  faText,
  faMagnet,
} from "@fortawesome/pro-solid-svg-icons";
import { ButtonIconSelect } from "@storyteller/ui-button-icon-select";
import { PopoverMenu } from "@storyteller/ui-popover";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  FloatingToolbar,
  FloatingToolbarButton,
  FloatingToolbarDivider,
} from "./FloatingToolbar";
import { useMoodboardStore } from "./MoodboardStore";
import { Tool } from "./types";
import { MOD, fmtShortcut } from "./overlays/shortcuts";
import { computeFitToGridPatches } from "./layout/fitToGrid";
import { computeAABB } from "./layout/geometry";
import { computePackPatches } from "./layout/packCollage";
import { clusterByProximity } from "./layout/clusterProximity";

const MODES: Array<{
  value: Tool;
  icon: typeof faMousePointer;
  tooltip: string;
}> = [
  { value: "select", icon: faMousePointer, tooltip: "Select (V)" },
  { value: "lasso", icon: faDrawPolygon, tooltip: "Lasso (L)" },
  { value: "text", icon: faText, tooltip: "Text (T)" },
];

interface Props {
  onUploadClick: () => void;
  onGalleryClick: () => void;
}

export const MoodboardToolbar = ({ onUploadClick, onGalleryClick }: Props) => {
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
  const snapEnabled = useMoodboardStore((s) => s.snapEnabled);
  const toggleSnap = useMoodboardStore((s) => s.toggleSnap);

  const handleFitToGrid = () => {
    if (selectedIds.size === 0) return;
    const targetNodes = Array.from(selectedIds)
      .map((id) => nodes[id])
      .filter(Boolean);
    applyLayoutPatches(computeFitToGridPatches(targetNodes, gridSpacing));
  };

  const handlePackCollage = () => {
    const ids = selectedIds.size > 0 ? Array.from(selectedIds) : rootOrder;
    const targetNodes = ids
      .map((id) => nodes[id])
      .filter((n) => n && n.parentId === null);
    if (targetNodes.length < 2) return;
    const aabb = computeAABB(targetNodes);
    if (!aabb) return;
    applyLayoutPatches(computePackPatches(targetNodes, aabb));
  };

  const handleAutoGroup = () => {
    const ids = selectedIds.size > 0 ? Array.from(selectedIds) : rootOrder;
    const targetNodes = ids
      .map((id) => nodes[id])
      .filter((n) => n && n.parentId === null);
    if (targetNodes.length < 2) return;
    const clusters = clusterByProximity(targetNodes);
    const clusterIds = clusters.map((c) => c.map((n) => n.id));
    groupClusters(clusterIds);
  };

  const handleAddAction = (action: string) => {
    if (action === "upload") onUploadClick();
    else if (action === "library") onGalleryClick();
  };

  return (
    <FloatingToolbar>
      <Tooltip
        content="Add an image"
        position="bottom"
        delay={300}
        closeOnClick
      >
        <PopoverMenu
          mode="button"
          position="bottom"
          panelTitle="Add an image"
          items={[
            {
              label: "Upload Image",
              selected: false,
              icon: (
                <FontAwesomeIcon
                  icon={faArrowUpFromBracket}
                  className="h-4 w-4"
                />
              ),
              action: "upload",
            },
            {
              label: "Pick from Library",
              selected: false,
              icon: <FontAwesomeIcon icon={faImages} className="h-4 w-4" />,
              action: "library",
            },
          ]}
          onPanelAction={handleAddAction}
          showIconsInList
          buttonClassName="h-9 w-9 rounded-[10px] border-transparent bg-primary/90 text-lg text-white hover:bg-primary/70"
          triggerIcon={<FontAwesomeIcon icon={faPlus} className="text-xl" />}
        />
      </Tooltip>

      <FloatingToolbarDivider />

      <ButtonIconSelect
        options={MODES}
        onOptionChange={(value) => setTool(value as Tool)}
        selectedOption={tool}
      />

      <FloatingToolbarDivider />

      <FloatingToolbarButton
        icon={faObjectGroup}
        label={`Group (${fmtShortcut([MOD, "G"])})`}
        onClick={() => group()}
        disabled={selectedIds.size < 2}
        tooltipDelay={100}
      />
      <FloatingToolbarButton
        icon={faObjectUngroup}
        label={`Ungroup (${fmtShortcut([MOD, "Shift", "G"])})`}
        onClick={() => ungroup()}
        disabled={selectedIds.size === 0}
        tooltipDelay={100}
      />

      <FloatingToolbarDivider />

      <FloatingToolbarButton
        icon={faTableCells}
        label="Fit to grid"
        onClick={handleFitToGrid}
        disabled={selectedIds.size === 0}
        tooltipDelay={100}
      />
      <FloatingToolbarButton
        icon={faGripVertical}
        label="Pack collage"
        onClick={handlePackCollage}
        tooltipDelay={100}
      />
      <FloatingToolbarButton
        icon={faDiagramProject}
        label="Auto-group by proximity"
        onClick={handleAutoGroup}
        tooltipDelay={100}
      />
      <FloatingToolbarButton
        icon={faMagnet}
        label={snapEnabled ? "Snapping on" : "Snapping off"}
        active={snapEnabled}
        onClick={toggleSnap}
        tooltipDelay={100}
      />

      <FloatingToolbarDivider />

      <FloatingToolbarButton
        icon={faRotateLeft}
        label={`Undo (${fmtShortcut([MOD, "Z"])})`}
        onClick={undo}
        tooltipDelay={100}
      />
      <FloatingToolbarButton
        icon={faRotateRight}
        label={`Redo (${fmtShortcut([MOD, "Shift", "Z"])})`}
        onClick={redo}
        tooltipDelay={100}
      />
      <FloatingToolbarButton
        icon={faTrash}
        label="Delete (Del)"
        onClick={deleteSelected}
        disabled={selectedIds.size === 0}
        tooltipDelay={100}
      />
    </FloatingToolbar>
  );
};
