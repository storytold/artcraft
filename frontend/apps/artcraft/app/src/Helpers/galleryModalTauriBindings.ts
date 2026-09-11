import { MediaFileDelete } from "@storyteller/tauri-api";
import { listen } from "@tauri-apps/api/event";

export const galleryModalDeleteMedia = (id: string) => MediaFileDelete(id);

export const galleryModalSubscribeToMediaEvents = (handlers: {
  onGenerationComplete: () => void;
  onMediaDeleted: (mediaId: string) => void;
}) => {
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
    unlistenGen.then((fn) => fn());
    unlistenDel.then((fn) => fn());
  };
};
