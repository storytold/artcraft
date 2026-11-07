import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";
import { CommandResult } from "../common/CommandStatus";

// Images made without an ArtCraft account (with the user's own fal or OpenRouter key) are kept
// on this computer, not in the cloud library. These list them so the library views can show them.

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
    return result.payload?.images ?? [];
  } catch (e) {
    console.error("Couldn't list local generations", e);
    return [];
  }
};

// Events after which the local images may have changed. Every finished generation sends
// `generation-complete-event`, whatever kind of completion event it also sends.
const REFRESH_EVENTS = ["generation-complete-event", "text_to_image_generation_complete_event", "media_file_deleted_event"];

/** The local images, kept current as generations finish and files are deleted. */
export const useLocalGenerations = (): LocalGeneration[] => {
  const [images, setImages] = useState<LocalGeneration[]>([]);

  const refresh = useCallback(async () => {
    setImages(await ListLocalGenerations());
  }, []);

  useEffect(() => {
    const unlisteners: Promise<UnlistenFn>[] = REFRESH_EVENTS.map((name) => listen(name, () => { refresh(); }));
    // The other desktop app (artcraft-native) keeps images in the same folder.
    const onFocus = () => { refresh(); };
    window.addEventListener("focus", onFocus);
    refresh();
    return () => {
      unlisteners.forEach((u) => u.then((f) => f()));
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  return images;
};
