import { useRef, useState } from "react";
import {
  DeckPreviewModal,
  DeckSlotCard,
  type DeckItem,
} from "@storyteller/ui-promptbox";
import type { MeshInputsState } from "../create-object-store";
import type { MultiViewSlot } from "./MeshInputsRow";
import { MESH_FILE_ACCEPT, uploadMeshFile, uploadViewImage } from "./mesh-upload";

// Always-visible named slot cards (Front/Back/Left/Right angles + input mesh)
// rendered beside the reference deck in the desktop prompt box — same design
// as the video page's First/Last frame cards. The mobile form keeps the
// MeshInputsRow band; both write to the same store slice.

const VIEW_SLOTS: {
  slot: MultiViewSlot;
  key: keyof MeshInputsState;
  label: string;
}[] = [
  { slot: "front", key: "frontImage", label: "Front" },
  { slot: "back", key: "backImage", label: "Back" },
  { slot: "left", key: "leftImage", label: "Left" },
  { slot: "right", key: "rightImage", label: "Right" },
];

interface MeshDeckSlotsProps {
  showMultiView: boolean;
  showMeshInput: boolean;
  inputs: MeshInputsState;
  setInputs: (patch: Partial<MeshInputsState>) => void;
  onPickSlotFromLibrary: (slot: MultiViewSlot) => void;
}

export function MeshDeckSlots({
  showMultiView,
  showMeshInput,
  inputs,
  setInputs,
  onPickSlotFromLibrary,
}: MeshDeckSlotsProps) {
  const viewInputRef = useRef<HTMLInputElement>(null);
  const meshInputRef = useRef<HTMLInputElement>(null);
  const targetSlotRef = useRef<MultiViewSlot>("front");
  const [uploadingView, setUploadingView] = useState<{
    slot: MultiViewSlot;
    previewUrl: string;
  } | null>(null);
  const [isUploadingMesh, setIsUploadingMesh] = useState(false);
  const [previewItem, setPreviewItem] = useState<DeckItem | null>(null);

  const handleViewFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (viewInputRef.current) viewInputRef.current.value = "";
    if (!file) return;
    const target = VIEW_SLOTS.find((v) => v.slot === targetSlotRef.current)!;
    const previewUrl = URL.createObjectURL(file);
    setUploadingView({ slot: target.slot, previewUrl });
    const image = await uploadViewImage(target.label, file);
    URL.revokeObjectURL(previewUrl);
    setUploadingView(null);
    if (image) setInputs({ [target.key]: image });
  };

  const handleMeshFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (meshInputRef.current) meshInputRef.current.value = "";
    if (!file) return;
    setIsUploadingMesh(true);
    const mesh = await uploadMeshFile(file);
    setIsUploadingMesh(false);
    if (mesh) setInputs({ inputMesh: mesh });
  };

  const meshItem: DeckItem | undefined = inputs.inputMesh
    ? {
        id: inputs.inputMesh.id,
        kind: "mesh",
        name: inputs.inputMesh.file?.name || "Mesh file",
      }
    : isUploadingMesh
      ? { id: "uploading-mesh", kind: "mesh", name: "Mesh file", uploading: true }
      : undefined;

  return (
    <div className="flex shrink-0 items-center gap-1.5 self-center">
      <input
        type="file"
        ref={viewInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleViewFile}
      />
      <input
        type="file"
        ref={meshInputRef}
        className="hidden"
        accept={MESH_FILE_ACCEPT}
        onChange={handleMeshFile}
      />

      {showMultiView &&
        VIEW_SLOTS.map(({ slot, key, label }) => {
          const image = inputs[key];
          const item: DeckItem | undefined = image
            ? {
                id: image.id,
                kind: "image",
                url: image.url,
                previewUrl: image.fullUrl ?? image.url,
                name: `${label} view`,
              }
            : uploadingView?.slot === slot
              ? {
                  id: `uploading-${slot}`,
                  kind: "image",
                  url: uploadingView.previewUrl,
                  name: `${label} view`,
                  uploading: true,
                }
              : undefined;
          return (
            <DeckSlotCard
              key={slot}
              item={item}
              label={label}
              addActions={[
                {
                  key: `upload-${slot}`,
                  label: "Upload",
                  onSelect: () => {
                    targetSlotRef.current = slot;
                    viewInputRef.current?.click();
                  },
                },
                {
                  key: `library-${slot}`,
                  label: "From library",
                  onSelect: () => onPickSlotFromLibrary(slot),
                },
              ]}
              onRemove={() => setInputs({ [key]: undefined })}
              onPreview={setPreviewItem}
            />
          );
        })}

      {showMeshInput && (
        <DeckSlotCard
          item={meshItem}
          label="Mesh"
          addActions={[
            {
              key: "upload-mesh",
              label: "Upload mesh",
              onSelect: () => meshInputRef.current?.click(),
            },
          ]}
          onRemove={() => setInputs({ inputMesh: undefined })}
          onPreview={setPreviewItem}
        />
      )}

      <DeckPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
}
