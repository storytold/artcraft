import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useSyncExternalStore } from "react";
import { CommandResult } from "../common/CommandStatus";

export interface LocalGeneration {
  /** `local_file_<uuid>`; stands in for a media token. */
  id: string;
  /** The asset-protocol URL the webview loads the image from. */
  url: string;
  prompt: string;
  model_id: string;
  provider: string;
  /** RFC 3339. */
  created_at: string;
  media_class?: "image" | "video";
  thumbnail_url?: string | null;
}

export { isLocalGeneration } from "@storyteller/common";

interface ListLocalGenerationsSuccess extends CommandResult {
  payload: { images: LocalGeneration[]; next_cursor?: number | null };
}

/** Newest first; empty when the list can't be read. */
export const ListLocalGenerations = async (): Promise<LocalGeneration[]> => {
  try {
    const images: LocalGeneration[] = [];
    let cursor: number | undefined;
    do {
      const result = await (cursor === undefined ? invoke("list_local_generations_command") : invoke("list_local_generations_command", { request: { cursor } })) as ListLocalGenerationsSuccess;
      if (result.status !== "success") return [];
      images.push(...(result.payload?.images ?? []));
      const next = result.payload?.next_cursor;
      if (next == null) return images;
      if (next <= (cursor ?? 0)) throw new Error("Invalid local-library cursor");
      cursor = next;
    } while (cursor !== undefined);
    return images;
  } catch (e) {
    console.error("Couldn't list local generations", e);
    return [];
  }
};

// Events after which the local images may have changed. Every finished generation sends
// `generation-complete-event`, whatever kind of completion event it also sends.
const REFRESH_EVENTS = ["generation-complete-event", "text_to_image_generation_complete_event", "video_generation_complete_event", "media_file_deleted_event"];

/** The local images, kept current as generations finish and files are deleted. */
let localImages: LocalGeneration[] = [];
const subscribers = new Set<() => void>();
let stopListening: (() => void) | undefined;

function subscribe(listener: () => void) {
  subscribers.add(listener);
  if (!stopListening) {
    let active = true;
    let refreshing = false;
    let refreshAgain = false;
    const refresh = async () => {
      if (refreshing) { refreshAgain = true; return; }
      refreshing = true;
      do {
        refreshAgain = false;
        const images = await ListLocalGenerations();
        if (active) {
          localImages = images;
          subscribers.forEach((subscriber) => subscriber());
        }
      } while (active && refreshAgain);
      refreshing = false;
    };
    const unlisteners: Promise<UnlistenFn | undefined>[] = REFRESH_EVENTS.map((name) =>
      listen(name, () => { void refresh(); }).catch(() => undefined),
    );
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    stopListening = () => {
      active = false;
      unlisteners.forEach((unlistener) => { void unlistener.then((stop) => stop?.()); });
      window.removeEventListener("focus", onFocus);
    };
    void refresh();
  }
  return () => {
    subscribers.delete(listener);
    if (!subscribers.size) {
      stopListening?.();
      stopListening = undefined;
    }
  };
}

export const useLocalGenerations = (): LocalGeneration[] => useSyncExternalStore(subscribe, () => localImages);

export const ImportLocalGeneration = async (id: string): Promise<string> => {
  const result = await invoke("import_local_generation_command", { request: { id } }) as CommandResult & { payload?: { media_file_token: string }; error_message?: string };
  if (result.status !== "success" || !result.payload?.media_file_token) throw new Error(result.error_message ?? "Could not upload the local image");
  return result.payload.media_file_token;
};
