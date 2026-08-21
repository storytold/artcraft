import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { UploaderStates } from "@storyteller/common";
import { MediaFilesApi, ProjectsApi } from "@storyteller/api";
import { GalleryModal, GalleryItem } from "@storyteller/ui-gallery-modal";
import type {
  MoodboardAdapter,
  MoodboardPersistenceAdapter,
  MoodboardReference,
  MoodboardLibraryPickerProps,
} from "@storyteller/ui-moodboard";
import { uploadImage as webappUploadImage } from "../../components/prompt-box/upload-image";
import { useCreateImageStore } from "../create-image/create-image-store";
import { useSessionStore } from "../../lib/session";
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

// Server persistence over the project-document endpoints: each board is one
// mood_board project (multipart JSON upload; save-new returns the media file
// token that links the board to its server row).
const persistence: MoodboardPersistenceAdapter = {
  getUserId: () => useSessionStore.getState().user?.user_token ?? null,
  subscribeAuthState: (onChange) => useSessionStore.subscribe(onChange),

  saveBoard: async ({ token, name, documentJson }) => {
    const api = new ProjectsApi();
    const blob = new Blob([documentJson], { type: "application/json" });
    const fileName = `${name || "Untitled board"}.mood.json`;
    const uuid = crypto.randomUUID();
    const response = token
      ? await api.UpdateProject({
          projectType: "mood_board",
          token,
          blob,
          fileName,
          uuid,
          maybe_title: name,
        })
      : await api.UploadNewProject({
          projectType: "mood_board",
          blob,
          fileName,
          uuid,
          maybe_title: name,
        });
    return {
      success: response.success,
      token: response.data ?? token ?? undefined,
      errorMessage: response.errorMessage,
    };
  },

  listBoards: async () => {
    const response = await new ProjectsApi().ListSessionProjects({
      filter_project_type: "mood_board",
      page_size: 100,
    });
    if (!response.success || !response.data) return { success: false };
    return {
      success: true,
      boards: response.data.map((row) => ({
        token: row.token,
        name: row.maybe_title ?? "Untitled board",
        updatedAt: row.updated_at,
      })),
    };
  },

  // The adapter contract is non-throwing; the raw fetch()es here reject on
  // network failure, so wrap them — an escaped rejection would tear down
  // the caller's whole hydration pass, not just this board.
  loadBoard: async (token) => {
    try {
      const response = await new MediaFilesApi().GetMediaFileByToken({
        mediaFileToken: token,
      });
      const cdnUrl = response.success
        ? response.data?.media_links?.cdn_url
        : undefined;
      if (!cdnUrl) return { success: false };
      const documentResponse = await fetch(cdnUrl);
      if (!documentResponse.ok) return { success: false };
      return { success: true, documentJson: await documentResponse.text() };
    } catch (error) {
      console.error("[Moodboard] board document fetch failed:", error);
      return { success: false };
    }
  },

  deleteBoard: async (token) => {
    try {
      const response = await new MediaFilesApi().DeleteMediaFileByToken({
        mediaFileToken: token,
        asMod: false,
      });
      return response.success;
    } catch (error) {
      console.error("[Moodboard] board delete failed:", error);
      return false;
    }
  },

  resolveMediaUrls: async (tokens) => {
    try {
      const response = await new MediaFilesApi().ListMediaFilesByTokens({
        mediaTokens: tokens,
      });
      const urlByToken: Record<string, string> = {};
      for (const media of response.data ?? []) {
        if (media.media_links?.cdn_url) {
          urlByToken[media.token] = media.media_links.cdn_url;
        }
      }
      return urlByToken;
    } catch (error) {
      console.error("[Moodboard] media URL resolution failed:", error);
      return {};
    }
  },
};

export const webappMoodboardAdapter: MoodboardAdapter = {
  uploadImage,
  sendToGeneration,
  renderLibraryPicker: (props) => <WebappLibraryPicker {...props} />,
  persistence,
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
