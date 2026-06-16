import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UploaderStates } from "@storyteller/common";
import { GalleryModal, GalleryItem } from "@storyteller/ui-gallery-modal";
import type {
  MoodboardAdapter,
  MoodboardReference,
  MoodboardLibraryPickerProps,
} from "@storyteller/ui-moodboard";
import { uploadImage as webappUploadImage } from "../../components/prompt-box/upload-image";
import { useCreateImageStore } from "../create-image/create-image-store";
import type { RefImage } from "../../components/prompt-box/types";

// Web (artcraft-webapp) implementation of the moodboard's platform seams.

// MoodboardPage registers the router navigate so this non-hook module can do
// SPA navigation without a full reload.
let navigateFn: ((path: string) => void) | null = null;
export const setMoodboardNavigate = (fn: (path: string) => void): void => {
  navigateFn = fn;
};

// Reuses the webapp's uploader, which surfaces a durable media token via its
// success callback — so web-uploaded items are reference-capable.
const uploadImage = async (file: File): Promise<string | null> => {
  let token: string | null = null;
  try {
    await webappUploadImage({
      title: file.name || "Moodboard image",
      assetFile: file,
      progressCallback: (state) => {
        if (state.status === UploaderStates.success && state.data) {
          token = String(state.data);
        }
      },
    });
  } catch (err) {
    console.error("[Moodboard] upload failed", err);
  }
  return token;
};

// The webapp keeps reference images in a shared store, so we can seed them
// directly and navigate to Create Image (no sessionStorage handoff needed).
const sendToGeneration = (refs: MoodboardReference[]): void => {
  const store = useCreateImageStore.getState();
  const newRefs: RefImage[] = refs.map((r) => ({
    id: r.id,
    url: r.url,
    file: new File([], r.id),
    mediaToken: r.mediaToken,
  }));
  store.setReferenceImages(dedupeByToken([...store.referenceImages, ...newRefs]));
  toast.success(
    `${refs.length} reference${refs.length > 1 ? "s" : ""} sent to Create Image`,
  );
  if (navigateFn) navigateFn("/create-image");
  else window.location.assign("/create-image");
};

const WebappLibraryPicker = ({
  open,
  onClose,
  onPick,
}: MoodboardLibraryPickerProps) => {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const close = () => {
    setSelectedIds([]);
    onClose();
  };
  return (
    <GalleryModal
      isOpen={open}
      onClose={close}
      onLoginClick={() => {
        close();
        navigate("/login");
      }}
      mode="select"
      selectedItemIds={selectedIds}
      onSelectItem={(id: string) =>
        setSelectedIds((prev) =>
          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        )
      }
      onUseSelected={(items: GalleryItem[]) => {
        onPick(
          items.map((it) => ({
            url: it.fullImage || it.thumbnail || "",
            mediaToken: it.id ?? null,
            kind: it.mediaClass === "video" ? "video" : "image",
          })),
        );
        setSelectedIds([]);
      }}
      forceFilter="image"
    />
  );
};

export const webappMoodboardAdapter: MoodboardAdapter = {
  uploadImage,
  sendToGeneration,
  renderLibraryPicker: (props) => <WebappLibraryPicker {...props} />,
};

// Dedupe by token but keep tokenless refs (a manually-added prompt reference
// without a token shouldn't vanish when sending from a board).
const dedupeByToken = (refs: RefImage[]): RefImage[] => {
  const seen = new Set<string>();
  const out: RefImage[] = [];
  for (const r of refs) {
    if (r.mediaToken) {
      if (seen.has(r.mediaToken)) continue;
      seen.add(r.mediaToken);
    }
    out.push(r);
  }
  return out;
};
