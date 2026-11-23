import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { BasicEventWrapper } from '../../common/BasicEventWrapper';
import { useEffect } from 'react';

const EVENT_NAME : string = 'image_edit_complete_event';

export interface ImageEditCompleteEvent {
  edited_images: EditedImage[],
  maybe_frontend_subscriber_id?: string,
  maybe_frontend_subscriber_payload?: string,
}

export interface EditedImage {
  media_token: string,
  cdn_url: string,
  maybe_thumbnail_template?: string,
}

export const useImageEditCompleteEvent = (asyncCallback: (event: ImageEditCompleteEvent) => Promise<void>) => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<ImageEditCompleteEvent>>(EVENT_NAME, async (wrappedEvent) => {
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
