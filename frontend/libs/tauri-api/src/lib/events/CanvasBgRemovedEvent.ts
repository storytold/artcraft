import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { BasicEventWrapper } from './BasicEventWrapper';
import { useEffect } from 'react';

const EVENT_NAME : string = 'canvas_bg_removed_event';

export interface CanvasBgRemovedEvent {
  media_token: string,
  image_cdn_url: string,
  maybe_frontend_subscriber_id?: string,
  maybe_frontend_subscriber_payload?: string,
}

export const useCanvasBgRemovedEvent = (asyncCallback: (event: CanvasBgRemovedEvent) => Promise<void>) => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<CanvasBgRemovedEvent>>(EVENT_NAME, async (wrappedEvent) => {
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
