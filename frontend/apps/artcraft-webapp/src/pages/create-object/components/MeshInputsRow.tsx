import { useRef, useState } from "react";
import { BoxIcon, ImageIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import { DynamicIcon } from "@storyteller/icons";
import { AddButton, type RefImage } from "../../../components/prompt-box";
import {
  MESH_FILE_ACCEPT,
  uploadMeshFile,
  uploadViewImage,
} from "./mesh-upload";

// Multi-view side inputs (front/back/left/right) and the mesh-to-mesh input
// file — the mobile form band. The desktop prompt box renders the same store
// slice as reference-deck cards via useMeshDeckRefs.

export type MultiViewSlot = "front" | "back" | "left" | "right";

interface MeshInputsRowProps {
  showMultiView: boolean;
  showMeshInput: boolean;
  frontImage?: RefImage;
  backImage?: RefImage;
  leftImage?: RefImage;
  rightImage?: RefImage;
  inputMesh?: RefImage;
  onChange: (patch: {
    frontImage?: RefImage;
    backImage?: RefImage;
    leftImage?: RefImage;
    rightImage?: RefImage;
    inputMesh?: RefImage;
  }) => void;
  // Opens the library picker targeting a specific multi-view slot.
  onPickSlotFromLibrary?: (slot: MultiViewSlot) => void;
}

export function MeshInputsRow({
  showMultiView,
  showMeshInput,
  frontImage,
  backImage,
  leftImage,
  rightImage,
  inputMesh,
  onChange,
  onPickSlotFromLibrary,
}: MeshInputsRowProps) {
  if (!showMultiView && !showMeshInput) return null;

  // Mesh models are mutually exclusive here (multi-view vs mesh-input), so a
  // single title reflects whichever slots are shown.
  const title = showMultiView ? "Multi-view" : "Input mesh";
  const subtitle = showMultiView
    ? "Reference angles (optional)"
    : "Mesh file to process";
  const titleIcon = showMultiView ? ImageIcon : BoxIcon;

  return (
    // Title on the left, upload slots right-aligned + top-aligned (matches
    // ImagePromptRow).
    <div className="glass flex items-start gap-3 px-3 py-2">
      <div className="flex grow flex-col gap-1 min-w-32">
        <div className="flex items-center gap-2 text-white/90">
          <DynamicIcon icon={titleIcon} className="h-3.5 w-3.5" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em]">
            {title}
          </span>
        </div>
        <span className="text-[13px] text-white/60">{subtitle}</span>
      </div>
      <div className="flex flex-wrap items-end justify-end gap-3">
        {showMultiView && (
          <>
            <ImageSlot
              label="Front"
              image={frontImage}
              onChange={(img) => onChange({ frontImage: img })}
              onPickFromLibrary={
                onPickSlotFromLibrary
                  ? () => onPickSlotFromLibrary("front")
                  : undefined
              }
            />
            <ImageSlot
              label="Back"
              image={backImage}
              onChange={(img) => onChange({ backImage: img })}
              onPickFromLibrary={
                onPickSlotFromLibrary
                  ? () => onPickSlotFromLibrary("back")
                  : undefined
              }
            />
            <ImageSlot
              label="Left"
              image={leftImage}
              onChange={(img) => onChange({ leftImage: img })}
              onPickFromLibrary={
                onPickSlotFromLibrary
                  ? () => onPickSlotFromLibrary("left")
                  : undefined
              }
            />
            <ImageSlot
              label="Right"
              image={rightImage}
              onChange={(img) => onChange({ rightImage: img })}
              onPickFromLibrary={
                onPickSlotFromLibrary
                  ? () => onPickSlotFromLibrary("right")
                  : undefined
              }
            />
          </>
        )}
        {showMeshInput && (
          <MeshFileSlot
            mesh={inputMesh}
            onChange={(img) => onChange({ inputMesh: img })}
          />
        )}
      </div>
    </div>
  );
}

// ── Slots ──────────────────────────────────────────────────────────────────

const SLOT_CLASS =
  "flex aspect-square w-14 items-center justify-center overflow-hidden rounded-[3px] border border-dashed border-white/25 bg-white/5 transition-all hover:border-white/40 hover:bg-white/10";

function SlotShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      {children}
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-white/60">
        {label}
      </span>
    </div>
  );
}

function ImageSlot({
  label,
  image,
  onChange,
  onPickFromLibrary,
}: {
  label: string;
  image?: RefImage;
  onChange: (img?: RefImage) => void;
  onPickFromLibrary?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setUploading(true);
    const image = await uploadViewImage(label, file);
    setUploading(false);
    if (image) onChange(image);
  };

  return (
    <SlotShell label={label}>
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept="image/*"
        onChange={handleUpload}
      />
      {image ? (
        <div className="group relative aspect-square w-14 overflow-hidden rounded-[3px] border border-white/30">
          <img
            src={image.url}
            alt={`${label} view`}
            className="h-full w-full object-cover"
          />
          <button
            onClick={() => onChange(undefined)}
            className="absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center bg-black/50 text-white transition-colors hover:bg-black"
          >
            <XIcon className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : uploading ? (
        <div className={SLOT_CLASS}>
          <LoaderCircleIcon spin className="h-5 w-5 text-white" />
        </div>
      ) : (
        <AddButton
          onUpload={() => inputRef.current?.click()}
          onPickFromLibrary={onPickFromLibrary}
        />
      )}
    </SlotShell>
  );
}

function MeshFileSlot({
  mesh,
  onChange,
}: {
  mesh?: RefImage;
  onChange: (img?: RefImage) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setUploading(true);
    const mesh = await uploadMeshFile(file);
    setUploading(false);
    if (mesh) onChange(mesh);
  };

  return (
    <SlotShell label="Mesh file">
      <input
        type="file"
        ref={inputRef}
        className="hidden"
        accept={MESH_FILE_ACCEPT}
        onChange={handleUpload}
      />
      {mesh ? (
        <div className="group relative flex aspect-square w-14 items-center justify-center overflow-hidden rounded-[3px] border border-white/30 bg-white/10">
          <BoxIcon className="h-5 w-5 text-white/80" />
          <button
            onClick={() => onChange(undefined)}
            className="absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center bg-black/50 text-white transition-colors hover:bg-black"
          >
            <XIcon className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : uploading ? (
        <div className={SLOT_CLASS}>
          <LoaderCircleIcon spin className="h-5 w-5 text-white" />
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className={SLOT_CLASS}
        >
          <BoxIcon className="text-xl text-white/80" />
        </button>
      )}
    </SlotShell>
  );
}
