import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { BasicEventWrapper } from "../../common/BasicEventWrapper";
import { useEffect } from "react";

const EVENT_NAME: string = "object_generation_complete_event";

export interface ObjectGenerationCompleteEvent {
  generated_object?: GeneratedObject;
  maybe_frontend_subscriber_id?: string;
  maybe_frontend_subscriber_payload?: string;
}

export interface GeneratedObject {
  media_token: string;
  cdn_url: string;
  maybe_thumbnail_template?: string;
}

export const useObjectGenerationCompleteEvent = (
  asyncCallback: (event: ObjectGenerationCompleteEvent) => Promise<void>
) => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<ObjectGenerationCompleteEvent>>(
        EVENT_NAME,
        async (wrappedEvent) => {
          await asyncCallback(wrappedEvent.payload.data);
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
