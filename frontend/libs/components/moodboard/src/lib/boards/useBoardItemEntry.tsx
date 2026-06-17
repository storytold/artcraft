import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useBoardLibraryStore } from "./BoardLibraryStore";
import { BoardImageItem } from "./boardTypes";
import { measureImage, measureVideo } from "./measureMedia";
import type { MoodboardAdapter, MoodboardPickedItem } from "../adapter";

interface UseReturn {
  triggerUpload: () => void;
  triggerGallery: () => void;
  /** Adds an empty note and returns its id so the grid can open it for editing. */
  addNote: () => string;
  modals: ReactNode;
}

// Generic add-flows: upload, library pick (via adapter render-prop), clipboard
// paste (image + URL), note. The platform-specific bits — how a file is
// uploaded and what the library picker is — come from the adapter. (Color entry
// lives in the toolbar's ColorPickerPopover, which commits via addColorItem.)
export const useBoardItemEntry = (
  adapter: MoodboardAdapter,
  enabled: boolean,
): UseReturn => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const triggerUpload = useCallback(() => fileInputRef.current?.click(), []);
  const triggerGallery = useCallback(() => {
    if (adapter.renderLibraryPicker) setPickerOpen(true);
    else
      toast("Library picker isn't available here — upload or paste for now", {
        icon: "🖼️",
      });
  }, [adapter]);

  const addNote = useCallback(() => {
    const store = useBoardLibraryStore.getState();
    // Empty text → the card shows its "Note" placeholder and the grid drops
    // straight into edit mode so the user types instead of clearing "New note".
    const id = store.addTextItem(store.ensureActiveBoard(), "");
    store.setSelection([id]);
    return id;
  }, []);

  // Place the image immediately from a blob, then (if the platform supports it)
  // upload to capture a durable mediaToken so it becomes reference-capable.
  const addImageFile = useCallback(
    async (file: File) => {
      const store = useBoardLibraryStore.getState();
      const boardId = store.ensureActiveBoard();
      const blobUrl = URL.createObjectURL(file);
      const dims = await measureImage(blobUrl);
      const itemId = store.addImageItem(boardId, {
        src: blobUrl,
        mediaId: null,
        naturalW: dims.w,
        naturalH: dims.h,
      });
      if (!adapter.uploadImage) return;
      try {
        const token = await adapter.uploadImage(file);
        if (token) {
          const patch: Partial<BoardImageItem> = { mediaId: token };
          useBoardLibraryStore.getState().updateItem(boardId, itemId, patch);
        }
      } catch (err) {
        console.error("[Moodboard] upload failed", err);
      }
    },
    [adapter],
  );

  const handleFiles = useCallback(
    async (files: FileList) => {
      for (const file of Array.from(files)) {
        if (file.type.startsWith("image/")) await addImageFile(file);
      }
    },
    [addImageFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) void handleFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePicked = useCallback(async (items: MoodboardPickedItem[]) => {
    const store = useBoardLibraryStore.getState();
    const boardId = store.ensureActiveBoard();
    for (const it of items) {
      if (!it.url) continue;
      if (it.kind === "video") {
        const dims = await measureVideo(it.url);
        store.addVideoItem(boardId, {
          src: it.url,
          mediaId: it.mediaToken,
          naturalW: dims.w,
          naturalH: dims.h,
        });
      } else {
        const dims = await measureImage(it.url);
        store.addImageItem(boardId, {
          src: it.url,
          mediaId: it.mediaToken,
          naturalW: dims.w,
          naturalH: dims.h,
        });
      }
    }
    setPickerOpen(false);
  }, []);

  // ----- clipboard paste (images + URLs) -----
  useEffect(() => {
    if (!enabled) return undefined;
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /input|textarea/i.test(target.tagName)) return;
      const data = e.clipboardData;
      if (!data) return;

      const imageFile = Array.from(data.items)
        .find((it) => it.type.startsWith("image/"))
        ?.getAsFile();
      if (imageFile) {
        e.preventDefault();
        void addImageFile(imageFile);
        return;
      }

      const text = data.getData("text/plain").trim();
      if (isUrl(text)) {
        e.preventDefault();
        const store = useBoardLibraryStore.getState();
        const boardId = store.ensureActiveBoard();
        store.addLinkItem(boardId, {
          url: text,
          title: hostnameOf(text),
          description: "",
          image: null,
        });
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [enabled, addImageFile]);

  const modals = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      {adapter.renderLibraryPicker?.({
        open: pickerOpen,
        onClose: () => setPickerOpen(false),
        onPick: (items) => void handlePicked(items),
      })}
    </>
  );

  return { triggerUpload, triggerGallery, addNote, modals };
};

// ---------- helpers ----------

const isUrl = (text: string): boolean => {
  if (!/^https?:\/\//i.test(text)) return false;
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
};

const hostnameOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
