import { useState } from "react";
import toast from "react-hot-toast";
import { UploaderStates } from "@storyteller/common";
import { UploadImageMedia } from "@storyteller/api";
import { GalleryModal, GalleryItem } from "@storyteller/ui-gallery-modal";
import { useLoginModalStore } from "@storyteller/ui-login-modal";
import { usePromptImageStore, RefImage } from "@storyteller/ui-promptbox";
import type {
  MoodboardAdapter,
  MoodboardReference,
  MoodboardLibraryPickerProps,
} from "@storyteller/ui-moodboard";
import { useTabStore } from "../Stores/TabState";

// Desktop (Tauri) implementation of the moodboard's platform seams.

const uploadImage = async (file: File): Promise<string | null> => {
  let token: string | null = null;
  try {
    await UploadImageMedia({
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

const sendToGeneration = (refs: MoodboardReference[]): void => {
  const newRefs: RefImage[] = refs.map((r) => ({
    id: r.id,
    url: r.url,
    file: new File([], r.id),
    mediaToken: r.mediaToken,
  }));
  const store = usePromptImageStore.getState();
  store.setReferenceImages(dedupeByToken([...store.referenceImages, ...newRefs]));
  void useTabStore.getState().setActiveTab("IMAGE");
  toast.success(
    `${refs.length} reference${refs.length > 1 ? "s" : ""} added to the prompt`,
  );
};

const DesktopLibraryPicker = ({
  open,
  onClose,
  onPick,
}: MoodboardLibraryPickerProps) => {
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
        useLoginModalStore.getState().openModal();
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

export const desktopMoodboardAdapter: MoodboardAdapter = {
  uploadImage,
  sendToGeneration,
  renderLibraryPicker: (props) => <DesktopLibraryPicker {...props} />,
};

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
