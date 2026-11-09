import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
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
}

const LOCAL_GENERATION_ID = /^local_file_[A-Za-z0-9_]+$/;

/**
 * Whether `id` names an image kept on this computer rather than a library media token. Library
 * actions (use as reference, animate, remix) can't take these; download and delete still work.
 */
export const isLocalGeneration = (id: string): boolean => LOCAL_GENERATION_ID.test(id);

interface ListLocalGenerationsSuccess extends CommandResult {
  payload: { images: LocalGeneration[] };
}

/** Newest first; empty when the list can't be read. */
export const ListLocalGenerations = async (): Promise<LocalGeneration[]> => {
  try {
    const result = (await invoke("list_local_generations_command")) as ListLocalGenerationsSuccess;
    return result.status === "success" ? result.payload?.images ?? [] : [];
  } catch (e) {
    console.error("Couldn't list local generations", e);
    return [];
  }
};

// Events after which the local images may have changed. Every finished generation sends
// `generation-complete-event`, whatever kind of completion event it also sends.
const REFRESH_EVENTS = ["generation-complete-event", "text_to_image_generation_complete_event", "video_generation_complete_event", "media_file_deleted_event"];

/** The local images, kept current as generations finish and files are deleted. */
export const useLocalGenerations = (): LocalGeneration[] => {
  const [images, setImages] = useState<LocalGeneration[]>([]);

  useEffect(() => {
    let active = true;
    let requestNumber = 0;
    const refresh = async () => {
      const currentRequest = ++requestNumber;
      const nextImages = await ListLocalGenerations();
      if (active && currentRequest === requestNumber) setImages(nextImages);
    };
    const unlisteners: Promise<UnlistenFn | undefined>[] = REFRESH_EVENTS.map((name) =>
      listen(name, () => { void refresh(); }).catch(() => undefined),
    );
    const onFocus = () => { refresh(); };
    window.addEventListener("focus", onFocus);
    refresh();
    return () => {
      active = false;
      unlisteners.forEach((unlistener) => { void unlistener.then((stop) => stop?.()); });
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return images;
};

export const ImportLocalGeneration = async (id: string): Promise<string> => {
  const result = await invoke("import_local_generation_command", { request: { id } }) as CommandResult & { payload?: { media_file_token: string }; error_message?: string };
  if (result.status !== "success" || !result.payload?.media_file_token) throw new Error(result.error_message ?? "Could not upload the local image");
  return result.payload.media_file_token;
};
