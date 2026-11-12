import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { BasicEventWrapper } from "../../common/BasicEventWrapper";
import { useEffect } from "react";

const EVENT_NAME: string = "subscription_plan_changed_event";

export interface SubscriptionPlanChangedEvent {
}

export const useSubscriptionPlanChangedEvent = (
  asyncCallback: (event: SubscriptionPlanChangedEvent) => Promise<void>
) => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<SubscriptionPlanChangedEvent>>(
        EVENT_NAME,
        async (wrappedEvent) => {
          await asyncCallback(wrappedEvent.payload.data);
        }
      );

      if (isUnmounted) {
        void unlisten.then((f) => f()); // Unsubscribe if unmounted early.
      }
    };

    void setup();

    return () => {
      isUnmounted = true;
      void unlisten.then((f) => f());
    };
  }, []);
};
