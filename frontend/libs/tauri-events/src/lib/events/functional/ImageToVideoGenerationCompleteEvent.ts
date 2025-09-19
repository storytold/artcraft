import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { BasicEventWrapper } from "../../common/BasicEventWrapper";
import { useEffect } from "react";

const EVENT_NAME: string = "image_to_video_generation_complete_event";

export interface ImageToVideoGenerationCompleteEvent {
  generated_video: GeneratedVideo;
  maybe_frontend_subscriber_id?: string;
  maybe_frontend_subscriber_payload?: string;
}

export interface GeneratedVideo {
  media_token: string;
  cdn_url: string;
}

export const useImageToVideoGenerationCompleteEvent = (
  asyncCallback: (event: ImageToVideoGenerationCompleteEvent) => Promise<void>
) => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<ImageToVideoGenerationCompleteEvent>>(
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
