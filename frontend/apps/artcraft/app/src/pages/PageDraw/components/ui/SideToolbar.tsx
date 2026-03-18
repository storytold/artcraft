import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMousePointer,
  faTrash,
  faEyeDropper,
  faImage,
  faUndo,
  faRedo,
  faPaintBrush,
  faXmark,
  faTrashXmark,
  faEraser,
  faSendBack,
} from "@fortawesome/pro-solid-svg-icons";
import {
  faShapes,
  faCircle,
  faSquare,
  faTriangle,
  faDroplet,
} from "@fortawesome/pro-regular-svg-icons";
import "../../App.css";
import { HsvaColorPicker, HsvaColor } from "react-colorful";
import { hsvaToHex } from "@uiw/color-convert";
import SliderWithIndicator from "./SliderWithIndicator";
import { ActiveTool, useSceneStore } from "../../stores/SceneState";
import { Node } from "../../Node";
import { Tooltip } from "@storyteller/ui-tooltip";
import {
  showActionReminder,
  isActionReminderOpen,
} from "@storyteller/ui-action-reminder-modal";

const shapeIconBtn =
  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-white/10";

// Debounce function
function useDebounced<T extends (...args: A) => void, A extends unknown[]>(
  fn: T,
  ms = 75,
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: A) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), ms);
  };
}

export interface SideToolbarProps {
  onSelect: () => void;
  onActivateShapeTool: (shape: "rectangle" | "circle" | "triangle") => void;
  currentShape: "rectangle" | "circle" | "triangle" | null;
  onPaintBrush: (hex: string, size: number, opacity: number) => void;
  onCanvasBackground: (hex: string) => void;
  onUploadImage: () => void;
  activeToolId: ActiveTool;
  className?: string;
  supportsMaskTool?: boolean;
}

const SideToolbar: React.FC<SideToolbarProps> = ({
  onSelect,
  onActivateShapeTool,
  currentShape,
  onPaintBrush,
  onCanvasBackground,
  onUploadImage,
  supportsMaskTool = false,
  activeToolId,
  className = "",
}) => {
  const store = useSceneStore();
  const [open, setOpen] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(16);
  const [brushHsva, setBrushHsva] = useState<HsvaColor>({
    h: 120,
    s: 100,
    v: 100,
    a: 1,
  });
  const [bgHsva, setBgHsva] = useState<HsvaColor>({
    h: 0,
    s: 0,
    v: 100,
    a: 1,
  });

  // Get selected nodes for shape color picker
  const selectedNodes =
    store.selectedNodeIds.length > 0
      ? store.drawNodes.filter((node) => store.selectedNodeIds.includes(node.id))
      : [];

  // Get only colorable nodes (shapes, not images or lines)
  const selectedColorableNodes = selectedNodes.filter(
    (node) => node.type !== "image" && node.type !== "line",
  ) as Node[];

  // Get first selected colorable node for color preview (when multiple selected, show first one's color)
  const firstSelectedColorableNode =
    selectedColorableNodes.length > 0 ? selectedColorableNodes[0] : null;

  // State for shape color picker
  const [shapeHsva, setShapeHsva] = useState<HsvaColor>({
    h: 240,
    s: 100,
    v: 70,
    a: 1,
  });

  // Update shape color picker when selection changes or store's shapeColor changes
  useEffect(() => {
    const colorToUse = firstSelectedColorableNode?.fill || store.shapeColor;

    if (colorToUse && colorToUse.startsWith("#")) {
      // Convert hex to HSVA (simplified - might want to change to proper converter later)
      const hex = colorToUse;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);

      // Convert RGB to HSV (simplified)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const v = max / 255;
      const s = max === 0 ? 0 : (max - min) / max;

      let h = 0;
      if (max !== min) {
        if (max === r) h = (60 * ((g - b) / (max - min)) + 360) % 360;
        else if (max === g) h = (60 * ((b - r) / (max - min)) + 120) % 360;
        else h = (60 * ((r - g) / (max - min)) + 240) % 360;
      }

      setShapeHsva({ h, s: s * 100, v: v * 100, a: 1 });
    }
  }, [firstSelectedColorableNode?.fill, store.shapeColor]);

  const sendPaint = useDebounced<
    (hex: string, size: number, opacity: number) => void,
    [string, number, number]
  >(onPaintBrush, 75);

  const sendBg = useDebounced<(hex: string) => void, [string]>(
    onCanvasBackground,
    75,
  );

  const sendShapeColor = useDebounced<(hex: string) => void, [string]>(
    (hex: string) => {
      store.setShapeColor(hex);

      selectedColorableNodes.forEach((node) => {
        store.updateNode(node.id, { fill: hex }, false);
      });

      if (selectedColorableNodes.length > 0) {
        store.saveState();
      }
    },
    75,
  );

  // Picker helper
  const makePicker = (
    hsva: HsvaColor,
    setHsva: React.Dispatch<React.SetStateAction<HsvaColor>>,
    sendHex: (hex: string) => void,
    extra?: React.ReactNode,
  ) => (
    <div className={`glass relative w-fit rounded-2xl p-4 shadow-lg`}>
      <button className="bg-zinc-700 text-zinc-300 hover:bg-zinc-600 absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full">
        <FontAwesomeIcon icon={faEyeDropper} size="sm" />
      </button>

      <HsvaColorPicker
        color={hsva}
        onChange={(c) => {
          setHsva(c);
          sendHex(hsvaToHex(c));
        }}
        className="brush-picker"
      />

      {extra}
    </div>
  );

  const BrushPopout = makePicker(
    brushHsva,
    setBrushHsva,
    (hex) => sendPaint(hex, brushSize, brushHsva.a),

    <>
      <div className="relative">
        <p className="mb-2 text-sm font-medium text-white">Brush Size</p>
        <SliderWithIndicator
          value={brushSize}
          onChange={(size) => {
            setBrushSize(size);
            sendPaint(hsvaToHex(brushHsva), size, brushHsva.a);
          }}
          min={1}
          max={64}
        />
      </div>
    </>,
  );

  const BgPopout = makePicker(bgHsva, setBgHsva, sendBg);
  const ShapePopout = makePicker(shapeHsva, setShapeHsva, sendShapeColor);

  // Tools
  const tools = [
    {
      id: "select",
      label: "Select & Move",
      icon: (
        <FontAwesomeIcon icon={faMousePointer} className="pl-0.5 text-lg" />
      ),
      onClick: () => {
        onSelect();
      },
    },
    { id: "separator-1", type: "separator" },
    {
      id: "add-shape",
      label: "Add Shape",
      icon: <FontAwesomeIcon icon={faShapes} className="h-5 w-5" />,
      onClick: () => {
        store.selectNode(null);
        if (!store.currentShape) {
          store.setCurrentShape("rectangle");
        }
        store.setActiveTool("shape");
      },
      popout: (
        <div className="flex items-center gap-1.5 rounded-full px-1.5 py-1.5 shadow-lg">
          {[faSquare, faCircle, faTriangle].map((faIcon, i) => (
            <button
              key={i}
              className={shapeIconBtn}
              onClick={() => {
                const shapes = ["rectangle", "circle", "triangle"] as const;
                onActivateShapeTool(shapes[i]);
                setOpen(null);
              }}
            >
              <FontAwesomeIcon icon={faIcon} className="h-5 w-5 text-white" />
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "upload",
      label: "Upload Image",
      icon: <FontAwesomeIcon icon={faImage} className="h-5 w-5" />,
      onClick: () => {
        onUploadImage();
      },
    },
    { id: "separator-2", type: "separator" },
    {
      id: "draw",
      label: "Brush",
      icon: null,
      onClick: () => {
        sendPaint(hsvaToHex(brushHsva), brushSize, brushHsva.a);
        store.setActiveTool("draw");
      },
      popout: BrushPopout,
    },
    {
      id: "inpaint",
      label: "Mask",
      icon: <FontAwesomeIcon icon={faSendBack} className="h-5 w-5" />,
      onClick: () => {
        store.setActiveTool("inpaint");
      },
    },
    {
      id: "erase",
      label: "Eraser",
      icon: <FontAwesomeIcon icon={faEraser} className="h-5 w-5" />,
      onClick: () => {
        store.setActiveTool("eraser");
      },
    },
    { id: "separator-3", type: "separator" },
    {
      id: "background",
      label: "Canvas Background",
      icon: (
        <div className="relative inline-flex h-5 w-5 items-center justify-center">
          <span
            className="absolute h-5 w-5 rounded-full border-2 border-white"
            style={{ backgroundColor: hsvaToHex(bgHsva) }}
          />
          <FontAwesomeIcon
            icon={faDroplet}
            className="relative h-2 w-2 text-white drop-shadow-sm"
            style={{
              filter: "drop-shadow(0 0 1px rgba(0,0,0,0.8))",
            }}
          />
        </div>
      ),
      popout: BgPopout,
    },
    {
      id: "undo",
      label: "Undo",
      icon: <FontAwesomeIcon icon={faUndo} className="h-5 w-5" />,
      onClick: () => {
        store.undo();
      },
    },
    {
      id: "redo",
      label: "Redo",
      icon: <FontAwesomeIcon icon={faRedo} className="h-5 w-5" />,
      onClick: () => {
        store.redo();
      },
    },
  ];

  const baseBtn =
    "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors border-2 border-transparent";

  // Reset canvas function with confirmation
  const handleResetCanvas = () => {
    showActionReminder({
      reminderType: "default",
      title: "Reset Canvas",
      primaryActionIcon: faTrashXmark,
      primaryActionBtnClassName: "bg-red hover:bg-red/80",
      message: (
        <p className="text-sm text-white/70">
          Are you sure you want to reset the canvas? This will clear all your
          work and cannot be undone.
        </p>
      ),
      primaryActionText: "Reset all",
      onPrimaryAction: () => {
        store.setNodes([]);
        store.drawNodes.filter((n) => n.type === "line").forEach((lineNode) => {
          store.removeLineNode(lineNode.id, false);
        });
        store.selectNode(null);
        store.copySelectedItems();
        store.saveState();
        isActionReminderOpen.value = false;
      },
    });
  };

  return (
    <aside
      className={`glass ml-4 flex flex-col items-center gap-3 rounded-xl p-1.5 shadow-lg ${className}`}
    >
      {/* Shape Color Picker - appears above toolbar when shape is selected */}
      {selectedColorableNodes.length > 0 && (
        <div className="glass absolute -top-14 left-1/2 -translate-x-1/2 rounded-xl border-2 border-primary/50 shadow-lg">
          <div className="relative">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-transparent text-white transition-colors hover:bg-white/10"
              onMouseEnter={() => setOpen("shape-color")}
            >
              <span
                className="inline-block h-5 w-5 rounded-full border-2 border-white"
                style={{ backgroundColor: firstSelectedColorableNode?.fill }}
              />
            </button>

            {open === "shape-color" && (
              <div
                onMouseLeave={() => setOpen(null)}
                className="absolute left-14 top-1/2 -translate-y-1/2 rounded-xl border border-[#404040] bg-[#303030] transition-all duration-200 ease-in-out"
              >
                {ShapePopout}
              </div>
            )}
          </div>
        </div>
      )}

      {tools.map((tool) => {

        if (tool.type === "separator") {
          return <div key={tool.id} className="my-1 h-px w-8 bg-white/15" />;
        }

        const { id, icon, onClick, popout, label } = tool;
        const active =
          id === activeToolId ||
          (id === "add-shape" && activeToolId === "shape");
        const btnStyle = active
          ? "bg-primary/30 border-2 !border-primary text-white"
          : (id === "inpaint" && !supportsMaskTool)
            ? "opacity-50 cursor-not-allowed hover:bg-transparent hover:border-transparent hover:text-white/50"
            : "hover:bg-white/10 text-white";

        let displayIcon = icon;
        if (id === "draw") {
          displayIcon = active ? (
            <span
              className="inline-block h-5 w-5 rounded-full border-2 border-white"
              style={{ backgroundColor: hsvaToHex(brushHsva) }}
            />
          ) : (
            <FontAwesomeIcon icon={faPaintBrush} className="h-5 w-5" />
          );
        }

        if (id === "add-shape" && activeToolId === "shape" && currentShape) {
          const shapeIcons = {
            rectangle: faSquare,
            circle: faCircle,
            triangle: faTriangle,
          } as const;
          displayIcon = (
            <FontAwesomeIcon
              icon={shapeIcons[currentShape]}
              className="h-5 w-5"
            />
          );
        }

        const tooltipLabel = (id === "inpaint" && !supportsMaskTool) ? label + " (Model unsupported)" : label;

        return (
          <div key={id} className="relative">
            {/* Hide tooltip for brush tool when active and popover is open */}
            {!(id === "draw" && active && open === id) && (
              <Tooltip
                content={tooltipLabel}
                position="right"
                closeOnClick={true}
                className="ms-1 rounded-md px-3 py-1"
                delay={100}
              >
                {popout ? (
                  <button
                    onClick={() => {
                      onClick?.();
                      if (id !== "draw" || !active) {
                        setOpen(open === id ? null : id);
                      }
                    }}
                    onMouseEnter={() => {
                      if (id === "draw" && active) {
                        setOpen(id);
                      }
                    }}
                    onMouseLeave={() => {
                      if (id === "draw" && active) {
                        setTimeout(() => {
                          const popoverElement = document.querySelector(
                            `[data-popover="${id}"]`,
                          );
                          if (
                            !popoverElement ||
                            !popoverElement.matches(":hover")
                          ) {
                            setOpen(null);
                          }
                        }, 200);
                      }
                    }}
                    className={`${baseBtn} ${btnStyle}`}
                  >
                    {displayIcon}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onClick?.();
                    }}
                    className={`${baseBtn} ${btnStyle}`}
                    disabled={id === "inpaint" && !supportsMaskTool}
                  >
                    {displayIcon}
                  </button>
                )}
              </Tooltip>
            )}

            {/* Render button without tooltip when brush is active and popover is open */}
            {id === "draw" && active && open === id && (
              <>
                {popout ? (
                  <button
                    onClick={() => {
                      onClick?.();
                      if (id !== "draw" || !active) {
                        setOpen(open === id ? null : id);
                      }
                    }}
                    onMouseEnter={() => {
                      if (id === "draw" && active) {
                        setOpen(id);
                      }
                    }}
                    onMouseLeave={() => {
                      if (id === "draw" && active) {
                        setTimeout(() => {
                          const popoverElement = document.querySelector(
                            `[data-popover="${id}"]`,
                          );
                          if (
                            !popoverElement ||
                            !popoverElement.matches(":hover")
                          ) {
                            setOpen(null);
                          }
                        }, 100);
                      }
                    }}
                    className={`${baseBtn} ${btnStyle}`}
                  >
                    {displayIcon}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onClick?.();
                    }}
                    className={`${baseBtn} ${btnStyle}`}
                  >
                    {displayIcon}
                  </button>
                )}
              </>
            )}

            {open === id && popout && (
              <div
                data-popover={id}
                onMouseEnter={() => {
                  if (id === "draw" && active) {
                    setOpen(id);
                  }
                }}
                onMouseLeave={() => {
                  setOpen(null);
                }}
                className="absolute left-14 top-1/2 -translate-y-1/2 rounded-xl border border-[#404040] bg-[#303030] transition-all duration-200 ease-in-out"
              >
                {popout}
              </div>
            )}
          </div>
        );
      })}

      {/* Reset canvas button */}
      <div className="glass absolute -bottom-14 left-1/2 -translate-x-1/2 rounded-xl border-2 border-red/50 shadow-lg hover:border-red/80">
        <div className="relative">
          <Tooltip
            content="Reset Canvas"
            position="right"
            closeOnClick={true}
            className="ms-1 rounded-md bg-red px-3 py-1"
            delay={100}
          >
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-transparent text-white transition-colors hover:bg-red/50"
              onClick={handleResetCanvas}
            >
              <FontAwesomeIcon icon={faXmark} className="h-5 w-5 text-xl" />
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
};

export default SideToolbar;
