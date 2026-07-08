import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSpinnerThird,
  faXmark,
  faCube,
} from "@fortawesome/pro-solid-svg-icons";
import { MediaUploadApi } from "@storyteller/api";
import { FilterEngineCategories } from "@storyteller/api";
import { UploaderStates } from "@storyteller/common";
import { uploadImage } from "../../../components/prompt-box/upload-image";
import type { RefImage } from "../../../components/prompt-box";

// Multi-view side inputs (front/back/left/right) and the mesh-to-mesh input
// file, shown above the prompt box when the selected model supports them. Uses
// the same media upload path as the primary reference image row.

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
}

const MESH_FILE_ACCEPT = ".glb,.gltf,.fbx,.obj";

export function MeshInputsRow({
  showMultiView,
  showMeshInput,
  frontImage,
  backImage,
  leftImage,
  rightImage,
  inputMesh,
  onChange,
}: MeshInputsRowProps) {
  if (!showMultiView && !showMeshInput) return null;

  return (
    <div className="glass flex flex-wrap items-end gap-3 rounded-2xl px-3 py-2">
      {showMultiView && (
        <>
          <ImageSlot
            label="Front"
            image={frontImage}
            onChange={(img) => onChange({ frontImage: img })}
          />
          <ImageSlot
            label="Back"
            image={backImage}
            onChange={(img) => onChange({ backImage: img })}
          />
          <ImageSlot
            label="Left"
            image={leftImage}
            onChange={(img) => onChange({ leftImage: img })}
          />
          <ImageSlot
            label="Right"
            image={rightImage}
            onChange={(img) => onChange({ rightImage: img })}
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
  );
}

// ── Slots ──────────────────────────────────────────────────────────────────

const SLOT_CLASS =
  "flex aspect-square w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-white/25 bg-white/5 transition-all hover:border-white/40 hover:bg-white/10";

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
      <span className="text-[11px] text-white/60">{label}</span>
    </div>
  );
}

function ImageSlot({
  label,
  image,
  onChange,
}: {
  label: string;
  image?: RefImage;
  onChange: (img?: RefImage) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      await uploadImage({
        title: `${label.toLowerCase()}-view-${Math.random().toString(36).substring(2, 10)}`,
        assetFile: file,
        progressCallback: (state) => {
          if (state.status === UploaderStates.success && state.data) {
            onChange({
              id: Math.random().toString(36).substring(7),
              url: reader.result as string,
              file,
              mediaToken: state.data,
            });
            setUploading(false);
          } else if (
            state.status === UploaderStates.assetError ||
            state.status === UploaderStates.imageCreateError
          ) {
            setUploading(false);
          }
        },
      });
      if (inputRef.current) inputRef.current.value = "";
    };
    reader.readAsDataURL(file);
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
        <div className="group relative aspect-square w-14 overflow-hidden rounded-lg border-2 border-white/30">
          <img
            src={image.url}
            alt={`${label} view`}
            className="h-full w-full object-cover"
          />
          <button
            onClick={() => onChange(undefined)}
            className="absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black"
          >
            <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : uploading ? (
        <div className={SLOT_CLASS}>
          <FontAwesomeIcon
            icon={faSpinnerThird}
            spin
            className="h-5 w-5 text-white"
          />
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className={SLOT_CLASS}
        >
          <FontAwesomeIcon icon={faPlus} className="text-xl text-white/80" />
        </button>
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
    if (!file) return;
    setUploading(true);
    try {
      const api = new MediaUploadApi();
      const response = await api.UploadNewEngineAsset({
        file,
        fileName: file.name || `input-mesh-${Date.now()}`,
        uuid: crypto.randomUUID(),
        engine_category: FilterEngineCategories.OBJECT,
        maybe_title: "input_mesh",
      });
      if (response?.success && response.data) {
        onChange({
          id: Math.random().toString(36).substring(7),
          url: "",
          file,
          mediaToken: response.data,
        });
      }
    } catch {
      // ignore — user can retry
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
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
        <div className="group relative flex aspect-square w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-white/30 bg-white/10">
          <FontAwesomeIcon icon={faCube} className="h-5 w-5 text-white/80" />
          <button
            onClick={() => onChange(undefined)}
            className="absolute right-[2px] top-[2px] flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black"
          >
            <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5" />
          </button>
        </div>
      ) : uploading ? (
        <div className={SLOT_CLASS}>
          <FontAwesomeIcon
            icon={faSpinnerThird}
            spin
            className="h-5 w-5 text-white"
          />
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className={SLOT_CLASS}
        >
          <FontAwesomeIcon icon={faCube} className="text-xl text-white/80" />
        </button>
      )}
    </SlotShell>
  );
}
