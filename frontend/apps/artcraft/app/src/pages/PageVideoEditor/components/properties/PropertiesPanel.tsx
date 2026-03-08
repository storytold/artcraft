import { useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSliders } from "@fortawesome/pro-solid-svg-icons";
import { useVideoEditor } from "../../hooks/useVideoEditor";
import type { TimelineElement, VisualElement } from "../../types";

export function PropertiesPanel() {
  const editor = useVideoEditor();
  const selected = editor.selection.getSelectedElements();

  const selectedElement = useMemo((): {
    element: TimelineElement;
    trackId: string;
  } | null => {
    if (selected.length !== 1) return null;
    const { trackId, elementId } = selected[0];
    const track = editor.timeline.getTrackById({ trackId });
    if (!track) return null;
    const element = track.elements.find((e) => e.id === elementId);
    if (!element) return null;
    return { element, trackId };
  }, [selected, editor]);

  const updateField = useCallback(
    (updates: Partial<TimelineElement>) => {
      if (!selectedElement) return;
      editor.timeline.updateElement({
        trackId: selectedElement.trackId,
        elementId: selectedElement.element.id,
        updates,
      });
    },
    [editor, selectedElement],
  );

  if (!selectedElement) {
    return (
      <div className="flex h-full w-[260px] shrink-0 flex-col items-center justify-center border-l border-ui-panel-border bg-ui-panel">
        <FontAwesomeIcon
          icon={faSliders}
          className="mb-2 text-2xl text-base-fg/15"
        />
        <span className="text-xs text-base-fg/30">
          Select a clip to edit properties
        </span>
      </div>
    );
  }

  const { element } = selectedElement;

  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col overflow-y-auto border-l border-ui-panel-border bg-ui-panel">
      {/* Header */}
      <div className="border-b border-ui-panel-border px-3 py-2">
        <h3 className="text-xs font-medium text-base-fg/70">Properties</h3>
        <span className="text-[10px] text-base-fg/40">
          {element.type.charAt(0).toUpperCase() + element.type.slice(1)} —{" "}
          {element.name}
        </span>
      </div>

      <div className="space-y-3 p-3">
        {/* Name */}
        <FieldGroup label="Name">
          <input
            type="text"
            className="w-full rounded border border-ui-panel-border bg-ui-background px-2 py-1 text-xs text-base-fg outline-none focus:border-primary"
            value={element.name}
            onChange={(e) => updateField({ name: e.target.value })}
          />
        </FieldGroup>

        {/* Transform (for visual elements) */}
        {"transform" in element && (
          <>
            <FieldGroup label="Position">
              <div className="grid grid-cols-2 gap-1.5">
                <NumberInput
                  label="X"
                  value={(element as VisualElement).transform.position.x}
                  onChange={(x) =>
                    updateField({
                      transform: {
                        ...(element as VisualElement).transform,
                        position: {
                          ...(element as VisualElement).transform.position,
                          x,
                        },
                      },
                    } as any)
                  }
                />
                <NumberInput
                  label="Y"
                  value={(element as VisualElement).transform.position.y}
                  onChange={(y) =>
                    updateField({
                      transform: {
                        ...(element as VisualElement).transform,
                        position: {
                          ...(element as VisualElement).transform.position,
                          y,
                        },
                      },
                    } as any)
                  }
                />
              </div>
            </FieldGroup>

            <FieldGroup label="Scale & Rotation">
              <div className="grid grid-cols-2 gap-1.5">
                <NumberInput
                  label="Scale"
                  value={(element as VisualElement).transform.scale}
                  step={0.1}
                  min={0.01}
                  onChange={(scale) =>
                    updateField({
                      transform: {
                        ...(element as VisualElement).transform,
                        scale,
                      },
                    } as any)
                  }
                />
                <NumberInput
                  label="Rot°"
                  value={(element as VisualElement).transform.rotate}
                  onChange={(rotate) =>
                    updateField({
                      transform: {
                        ...(element as VisualElement).transform,
                        rotate,
                      },
                    } as any)
                  }
                />
              </div>
            </FieldGroup>
          </>
        )}

        {/* Opacity */}
        {"opacity" in element && (
          <FieldGroup label="Opacity">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              className="w-full accent-primary"
              value={(element as VisualElement).opacity}
              onChange={(e) =>
                updateField({ opacity: parseFloat(e.target.value) } as any)
              }
            />
            <span className="text-[10px] text-base-fg/40">
              {Math.round((element as VisualElement).opacity * 100)}%
            </span>
          </FieldGroup>
        )}

        {/* Volume (audio) */}
        {"volume" in element && (
          <FieldGroup label="Volume">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              className="w-full accent-primary"
              value={(element as any).volume}
              onChange={(e) =>
                updateField({ volume: parseFloat(e.target.value) } as any)
              }
            />
            <span className="text-[10px] text-base-fg/40">
              {Math.round((element as any).volume * 100)}%
            </span>
          </FieldGroup>
        )}

        {/* Text content */}
        {element.type === "text" && (
          <>
            <FieldGroup label="Content">
              <textarea
                className="w-full resize-none rounded border border-ui-panel-border bg-ui-background px-2 py-1 text-xs text-base-fg outline-none focus:border-primary"
                rows={3}
                value={element.content}
                onChange={(e) => updateField({ content: e.target.value } as any)}
              />
            </FieldGroup>

            <FieldGroup label="Font">
              <div className="grid grid-cols-2 gap-1.5">
                <select
                  className="rounded border border-ui-panel-border bg-ui-background px-1 py-1 text-xs text-base-fg outline-none"
                  value={element.fontFamily}
                  onChange={(e) =>
                    updateField({ fontFamily: e.target.value } as any)
                  }
                >
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                </select>
                <NumberInput
                  label="Size"
                  value={element.fontSize}
                  min={8}
                  max={200}
                  onChange={(fontSize) =>
                    updateField({ fontSize } as any)
                  }
                />
              </div>
            </FieldGroup>

            <FieldGroup label="Color">
              <input
                type="color"
                className="h-7 w-full cursor-pointer rounded border border-ui-panel-border"
                value={element.color}
                onChange={(e) => updateField({ color: e.target.value } as any)}
              />
            </FieldGroup>

            <FieldGroup label="Align">
              <div className="flex gap-1">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    className={`flex-1 rounded px-2 py-1 text-xs ${element.textAlign === align ? "bg-primary text-white" : "bg-ui-background text-base-fg/60 hover:bg-ui-controls/30"}`}
                    onClick={() =>
                      updateField({ textAlign: align } as any)
                    }
                  >
                    {align.charAt(0).toUpperCase() + align.slice(1)}
                  </button>
                ))}
              </div>
            </FieldGroup>
          </>
        )}

        {/* Timing */}
        <FieldGroup label="Timing">
          <div className="grid grid-cols-2 gap-1.5">
            <NumberInput
              label="Start"
              value={parseFloat(element.startTime.toFixed(2))}
              step={0.1}
              min={0}
              onChange={(startTime) => updateField({ startTime })}
            />
            <NumberInput
              label="Duration"
              value={parseFloat(element.duration.toFixed(2))}
              step={0.1}
              min={0.1}
              onChange={(duration) => updateField({ duration })}
            />
          </div>
        </FieldGroup>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-base-fg/40">
        {label}
      </label>
      {children}
    </div>
  );
}

function NumberInput({
  label,
  value,
  step = 1,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-6 text-[10px] text-base-fg/40">{label}</span>
      <input
        type="number"
        className="w-full rounded border border-ui-panel-border bg-ui-background px-1.5 py-0.5 text-xs text-base-fg outline-none focus:border-primary"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
      />
    </div>
  );
}
