import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { BasicEventWrapper } from '../../common/BasicEventWrapper';
import { useEffect } from 'react';

const EVENT_NAME: string = 'motion_control_complete_event';

export interface MotionControlCompleteEvent {
  generated_video?: MotionControlGeneratedVideo;
  maybe_frontend_subscriber_id?: string;
  maybe_frontend_subscriber_payload?: string;
}

export interface MotionControlGeneratedVideo {
  media_token: string;
  cdn_url: string;
  maybe_thumbnail_template?: string;
}

export const useMotionControlCompleteEvent = (
  asyncCallback: (event: MotionControlCompleteEvent) => Promise<void>,
) => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<MotionControlCompleteEvent>>(
        EVENT_NAME,
        async (wrappedEvent) => {
          await asyncCallback(wrappedEvent.payload.data);
        },
      );

      if (isUnmounted) {
        unlisten.then((f) => f());
      }
    };

    setup();

    return () => {
      isUnmounted = true;
      unlisten.then((f) => f());
    };
  }, []);
};
