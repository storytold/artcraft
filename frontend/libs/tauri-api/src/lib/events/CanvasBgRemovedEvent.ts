import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { BasicEventWrapper } from './BasicEventWrapper';
import { useEffect, useRef } from 'react';

const EVENT_NAME : string = 'canvas_bg_removed_event';

export interface CanvasBgRemovedEvent {
  media_token: string,
  image_cdn_url: string,
  maybe_frontend_subscriber_id?: string,
  maybe_frontend_subscriber_payload?: string,
}

export const useCanvasBgRemovedEvent = (asyncCallback: (event: CanvasBgRemovedEvent) => Promise<void>) => {
  // FIX: the effect below only runs once, so it used to capture the first render's
  // callback forever (stale closure). Always call through the latest one.
  const callbackRef = useRef(asyncCallback);
  callbackRef.current = asyncCallback;

  useEffect(() => {
    const unlisten: Promise<UnlistenFn> = listen<BasicEventWrapper<CanvasBgRemovedEvent>>(EVENT_NAME, async (wrappedEvent) => {
      await callbackRef.current(wrappedEvent.payload.data);
    });

    return () => {
      // listen() returns a promise, so this also unsubscribes if we unmount before it resolves.
      unlisten.then(f => f());
    };

  }, []);
}
