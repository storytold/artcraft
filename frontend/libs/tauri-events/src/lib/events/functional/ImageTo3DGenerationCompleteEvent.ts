import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { BasicEventWrapper } from '../../common/BasicEventWrapper';
import { useEffect } from 'react';

const EVENT_NAME : string = 'image_to_3d_generation_complete_event';

export interface ImageTo3DGenerationCompleteEvent {
  model_media_token: string;
  model_cdn_url: string;
  maybe_frontend_subscriber_id?: string;
}

export const useImageTo3DGenerationCompleteEvent = (asyncCallback: (event: ImageTo3DGenerationCompleteEvent) => Promise<void>) => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<ImageTo3DGenerationCompleteEvent>>(EVENT_NAME, async (wrappedEvent) => {
        await asyncCallback(wrappedEvent.payload.data);
      });

      if (isUnmounted) {
        unlisten.then(f => f());
      }
    };

    setup();
    
    return () => {
      isUnmounted = true;
      unlisten.then(f => f());
    };

  }, []);
}



