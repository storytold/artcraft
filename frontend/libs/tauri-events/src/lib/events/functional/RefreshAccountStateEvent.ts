import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { BasicEventWrapper } from '../../common/BasicEventWrapper';
import { useEffect } from 'react';
import { useLatestRef } from '../../common/useLatestRef';

const EVENT_NAME : string = 'refresh_account_state_event';

export interface RefreshAccountStateEvent {
  provider?: string,
}

export const useRefreshAccountStateEvent = (asyncCallback: (event: RefreshAccountStateEvent) => Promise<void>) => {
  const callbackRef = useLatestRef(asyncCallback);
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<RefreshAccountStateEvent>>(EVENT_NAME, async (wrappedEvent) => {
        await callbackRef.current(wrappedEvent.payload.data);
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
