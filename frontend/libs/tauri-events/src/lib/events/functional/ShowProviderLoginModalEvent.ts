import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { BasicEventWrapper } from '../../common/BasicEventWrapper';
import { useEffect } from 'react';
import { GenerationProvider } from '@storyteller/common';

const EVENT_NAME : string = 'show_provider_login_modal_event';

export interface ShowProviderLoginModalEvent {
  provider: GenerationProvider,
}

export const useShowProviderLoginModalEvent = (asyncCallback: (event: ShowProviderLoginModalEvent) => Promise<void>) => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<ShowProviderLoginModalEvent>>(EVENT_NAME, async (wrappedEvent) => {
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
