import { Modal } from "@storyteller/ui-modal";
import { faPlus, faTrashAlt } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PopoverItem } from "@storyteller/ui-popover";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { Label } from "@storyteller/ui-label";
import { Tooltip } from "@storyteller/ui-tooltip";
import { SliderV2 } from "@storyteller/ui-sliderv2";
import { useState, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { Signal } from "@preact/signals-react";

interface ExtendedPopoverItem extends PopoverItem {
  id: string;
  focalLength: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
}

interface CameraSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cameras: ExtendedPopoverItem[];
  onCameraNameChange: (id: string, newName: string) => void;
  onCameraFocalLengthChange: (id: string, value: number) => void;
  onAddCamera: () => void;
  selectedCameraId: string;
  handleCameraSelect: (selectedItem: PopoverItem) => void;
  onDeleteCamera: (id: string) => void;
  focalLengthDragging: Signal;
  disableHotkeyInput: (level: number) => void;
  enableHotkeyInput: (level: number) => void;
}

export const CameraSettingsModal = ({
  isOpen,
  onClose,
  cameras,
  onCameraNameChange,
  onCameraFocalLengthChange,
  onAddCamera,
  selectedCameraId,
  handleCameraSelect,
  onDeleteCamera,
  focalLengthDragging,
  disableHotkeyInput,
  enableHotkeyInput,
}: CameraSettingsModalProps) => {
  const selectedCamera = cameras.find((cam) => cam.id === selectedCameraId);
  const [isDragging, setIsDragging] = useState(false);
  const [tempCameraName, setTempCameraName] = useState<string>("");
  const [editingCameraId, setEditingCameraId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCamera) {
      setTempCameraName(selectedCamera.label);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCamera?.id]);

  useEffect(() => {
    const handlePointerUp = () => {
      setIsDragging(false);
      focalLengthDragging.value = {
        isDragging: false,
        focalLength: selectedCamera?.focalLength || 35,
      };
    };
    document.addEventListener("pointerup", handlePointerUp);
    return () => document.removeEventListener("pointerup", handlePointerUp);
  }, [selectedCamera?.focalLength]);

  const handlePointerDown = () => {
    setIsDragging(true);
    focalLengthDragging.value = {
      isDragging: true,
      focalLength: selectedCamera?.focalLength || 35,
    };
  };

  const handleFocalLengthChange = (id: string, value: number) => {
    focalLengthDragging.value = { isDragging: true, focalLength: value };
    onCameraFocalLengthChange(id, value);
  };

  const handleNameBlur = () => {
    if (selectedCamera && tempCameraName.trim() !== "") {
      onCameraNameChange(selectedCamera.id, tempCameraName);
    } else if (selectedCamera) {
      setTempCameraName(selectedCamera.label);
    }
    setEditingCameraId(null);
  };

  const handleNameFocus = (id: string) => {
    setEditingCameraId(id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className={twMerge(
        "h-[500px] max-w-3xl duration-200",
        isDragging ? "opacity-10" : "opacity-100"
      )}
      backdropClassName={twMerge(
        "duration-200",
        isDragging ? "opacity-0" : "opacity-100"
      )}
      childPadding={false}
      disableHotkeyInput={disableHotkeyInput}
      enableHotkeyInput={enableHotkeyInput}
      showClose={false}
    >
      <div className="grid h-full grid-cols-12 gap-3">
        <div className="relative col-span-4 p-3 pt-2 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-gray-200 after:dark:bg-white/10">
          <div className="flex items-center justify-between gap-2.5 py-0.5">
            <h2 className="text-[18px] font-semibold opacity-80">Camera</h2>
            <Tooltip content="Add camera" position="top" delay={200}>
              <button
                className="h-6 w-6 rounded-full text-white/70 transition-colors hover:text-white/100"
                onClick={onAddCamera}
              >
                <FontAwesomeIcon icon={faPlus} className="text-xl" />
              </button>
            </Tooltip>
          </div>
          <hr className="my-2 w-full border-white/10" />
          <div className="space-y-1">
            {cameras.map((camera) => (
              <button
                key={camera.id}
                className={`h-9 w-full rounded-lg p-2 text-left transition-colors duration-100 hover:bg-[#63636B]/40 ${
                  camera.id === selectedCameraId ? "bg-[#63636B]/40" : ""
                }`}
                onClick={() => handleCameraSelect(camera)}
              >
                <div className="flex items-center gap-2.5 text-sm">
                  {camera.icon}
                  {editingCameraId === camera.id
                    ? tempCameraName
                    : camera.label}
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-8 p-3 ps-0 pt-2">
          <div className="flex h-full flex-col">
            <div>
              <div className="flex items-center justify-between gap-2.5 py-0.5 opacity-100">
                <h2 className="text-[18px] font-semibold">
                  {selectedCamera?.label || "Camera"}
                </h2>
                <Tooltip
                  content={
                    selectedCamera?.id === "main"
                      ? "Cannot delete the main camera"
                      : "Delete camera"
                  }
                  position="top"
                  delay={200}
                >
                  <button
                    className={`h-6 w-6 rounded-lg transition-colors ${
                      selectedCamera?.id === "main"
                        ? "cursor-not-allowed text-white/30"
                        : "text-white/60 hover:text-white/100"
                    }`}
                    onClick={() =>
                      selectedCamera &&
                      selectedCamera.id !== "main" &&
                      onDeleteCamera(selectedCamera.id)
                    }
                    disabled={selectedCamera?.id === "main"}
                  >
                    <FontAwesomeIcon icon={faTrashAlt} className="text-lg" />
                  </button>
                </Tooltip>
              </div>
              <hr className="my-2 w-full border-white/10" />
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="camera-name" className="text-sm opacity-70">
                    Name
                  </Label>
                  <Input
                    id="camera-name"
                    type="text"
                    value={tempCameraName}
                    onChange={(e) => setTempCameraName(e.target.value)}
                    onBlur={handleNameBlur}
                    onFocus={() =>
                      selectedCamera && handleNameFocus(selectedCamera.id)
                    }
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="focal-length" className="text-sm opacity-70">
                    Focal Length
                  </Label>
                  <div
                    className="mt-1 flex items-center gap-4"
                    onPointerDown={handlePointerDown}
                  >
                    <SliderV2
                      min={10}
                      max={200}
                      value={selectedCamera?.focalLength || 35}
                      onChange={(value) =>
                        selectedCamera &&
                        handleFocalLengthChange(selectedCamera.id, value)
                      }
                      step={1}
                      suffix="mm"
                      showDecrement={true}
                      showIncrement={true}
                      className="w-full"
                    />
                    <span className="min-w-[60px] text-sm">
                      {selectedCamera?.focalLength || 35}mm
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-auto flex justify-end pt-4">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
