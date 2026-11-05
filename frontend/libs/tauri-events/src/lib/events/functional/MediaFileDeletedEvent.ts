import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { BasicEventWrapper } from "../../common/BasicEventWrapper";
import { useEffect } from "react";
import { useLatestRef } from "../../common/useLatestRef";

const EVENT_NAME: string = "media_file_deleted_event";

export interface MediaFileDeletedEvent {
  media_file_token: string;
}

export const useMediaFileDeletedEvent = (
  asyncCallback: (event: MediaFileDeletedEvent) => Promise<void>
) => {
  const callbackRef = useLatestRef(asyncCallback);
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<MediaFileDeletedEvent>>(
        EVENT_NAME,
        async (wrappedEvent) => {
          await callbackRef.current(wrappedEvent.payload.data);
        }
      );

      if (isUnmounted) {
        unlisten.then((f) => f()); // Unsubscribe if unmounted early.
      }
    };

    setup();

    return () => {
      isUnmounted = true;
      unlisten.then((f) => f());
    };
  }, []);
};
