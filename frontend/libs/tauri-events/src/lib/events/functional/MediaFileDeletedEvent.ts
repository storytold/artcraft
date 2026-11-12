import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { BasicEventWrapper } from "../../common/BasicEventWrapper";
import { useEffect } from "react";

const EVENT_NAME: string = "media_file_deleted_event";

export interface MediaFileDeletedEvent {
  media_file_token: string;
}

export const useMediaFileDeletedEvent = (
  asyncCallback: (event: MediaFileDeletedEvent) => Promise<void>
) => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<MediaFileDeletedEvent>>(
        EVENT_NAME,
        async (wrappedEvent) => {
          await asyncCallback(wrappedEvent.payload.data);
        }
      );

      if (isUnmounted) {
        void unlisten.then((f) => f()); // Unsubscribe if unmounted early.
      }
    };

    void setup();

    return () => {
      isUnmounted = true;
      void unlisten.then((f) => f());
    };
  }, []);
};
