import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { BasicEventWrapper } from '../../common/BasicEventWrapper';
import { useEffect } from 'react';
import { useLatestRef } from '../../common/useLatestRef';
import { GenerationProvider } from '@storyteller/common';

const EVENT_NAME : string = 'show_provider_billing_modal_event';

export interface ShowProviderBillingModalEvent {
  provider: GenerationProvider,
}

export const useShowProviderBillingModalEvent = (asyncCallback: (event: ShowProviderBillingModalEvent) => Promise<void>) => {
  const callbackRef = useLatestRef(asyncCallback);
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<ShowProviderBillingModalEvent>>(EVENT_NAME, async (wrappedEvent) => {
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
