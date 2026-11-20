import { MediaFileDelete } from "@storyteller/tauri-api";
import { listen } from "@tauri-apps/api/event";
import { AAO_LIBRARY_UPDATED } from "~/components/generation-feed/aaoLibraryImports";

export const galleryModalDeleteMedia = (id: string) => MediaFileDelete(id);

export const galleryModalSubscribeToMediaEvents = (handlers: {
  onGenerationComplete: () => void;
  onMediaDeleted: (mediaId: string) => void;
}) => {
  window.addEventListener(AAO_LIBRARY_UPDATED, handlers.onGenerationComplete);
  const unlistenGen = listen("generation-complete-event", () => {
    handlers.onGenerationComplete();
  });
  const unlistenDel = listen<any>("media_file_deleted_event", (event) => {
    const token: string | undefined =
      event?.payload?.data?.media_file_token ??
      event?.payload?.media_file_token;
    if (token) handlers.onMediaDeleted(token);
  });
  return () => {
    window.removeEventListener(AAO_LIBRARY_UPDATED, handlers.onGenerationComplete);
    unlistenGen.then((fn) => fn());
    unlistenDel.then((fn) => fn());
  };
};
