import { useState } from "react";
import { Modal } from "@storyteller/ui-modal";
import { Button } from "@storyteller/ui-button";
import { twMerge } from "tailwind-merge";

interface BlankCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (width: number, height: number) => void;
}

interface ResolutionPreset {
  label: string;
  width: number;
  height: number;
}

const PRESETS: { group: string; items: ResolutionPreset[] }[] = [
  {
    group: "Square",
    items: [
      { label: "512 × 512", width: 512, height: 512 },
      { label: "768 × 768", width: 768, height: 768 },
      { label: "1024 × 1024", width: 1024, height: 1024 },
      { label: "1536 × 1536", width: 1536, height: 1536 },
    ],
  },
  {
    group: "Landscape",
    items: [
      { label: "HD  1280 × 720", width: 1280, height: 720 },
      { label: "Full HD  1920 × 1080", width: 1920, height: 1080 },
      { label: "QHD  2560 × 1440", width: 2560, height: 1440 },
    ],
  },
  {
    group: "Portrait",
    items: [
      { label: "720 × 1280", width: 720, height: 1280 },
      { label: "1080 × 1920", width: 1080, height: 1920 },
    ],
  },
];

export const BlankCanvasModal = ({
  isOpen,
  onClose,
  onConfirm,
}: BlankCanvasModalProps) => {
  const [selected, setSelected] = useState<ResolutionPreset | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected.width, selected.height);
    setSelected(null);
  };

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Choose Canvas Size"
      onClose={handleClose}
      width={560}
    >
      <div className="flex flex-col gap-5 p-1">
        {PRESETS.map((group) => (
          <div key={group.group}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-base-fg/50">
              {group.group}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.items.map((preset) => {
                const isSelected =
                  selected?.width === preset.width &&
                  selected?.height === preset.height;
                const maxW = 56;
                const maxH = 36;
                const scale = Math.min(maxW / preset.width, maxH / preset.height);
                const previewW = Math.round(preset.width * scale);
                const previewH = Math.round(preset.height * scale);

                return (
                  <button
                    key={`${preset.width}x${preset.height}`}
                    onClick={() => setSelected(preset)}
                    className={twMerge(
                      "flex flex-col items-center gap-2 rounded-xl border-2 bg-ui-panel px-4 py-3 text-sm font-medium text-base-fg transition-colors hover:border-primary/60",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-ui-panel-border",
                    )}
                  >
                    <div
                      className="rounded-sm border border-base-fg/20 bg-white"
                      style={{ width: previewW, height: previewH }}
                    />
                    <span className="whitespace-nowrap text-xs">
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-2 flex justify-end gap-3">
          <Button variant="action" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!selected}>
            Create Canvas
          </Button>
        </div>
      </div>
    </Modal>
  );
};
