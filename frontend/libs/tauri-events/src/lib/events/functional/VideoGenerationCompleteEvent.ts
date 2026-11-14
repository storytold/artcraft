import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { BasicEventWrapper } from '../../common/BasicEventWrapper';
import { useEffect } from 'react';

const EVENT_NAME : string = 'video_generation_complete_event';

export interface VideoGenerationCompleteEvent {
  generated_video?: GeneratedVideo,
  maybe_frontend_subscriber_id?: string,
  maybe_frontend_subscriber_payload?: string,
}

export interface GeneratedVideo {
  media_token: string,
  cdn_url: string,
  maybe_thumbnail_template?: string,
}

export const useVideoGenerationCompleteEvent = (asyncCallback: (event: VideoGenerationCompleteEvent) => Promise<void>) => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<VideoGenerationCompleteEvent>>(EVENT_NAME, async (wrappedEvent) => {
        await asyncCallback(wrappedEvent.payload.data);
      });

      if (isUnmounted) {
        unlisten.then(f => f()); // Unsubscribe if unmounted early.
      }
    };

    setup();
    
    return () => {
      isUnmounted = true;
      unlisten.then(f => f());
    };

  }, []);
}
