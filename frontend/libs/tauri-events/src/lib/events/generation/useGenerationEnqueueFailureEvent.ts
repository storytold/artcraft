import { useEffect } from "react";
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { SoundRegistry } from "@storyteller/soundboard";
import { GetAppPreferences } from "@storyteller/tauri-api";
import { toast } from "@storyteller/ui-toaster";
import { GenerationAction, GenerationModel, GenerationServiceProvider } from "./common";
import { BasicEventWrapper } from "../../common/BasicEventWrapper";

type GenerationEnqueueFailureEvent = {
  action: GenerationAction,
  service: GenerationServiceProvider,
  model?: GenerationModel,
  reason?: string,
}; 

export const useGenerationEnqueueFailureEvent = () => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<GenerationEnqueueFailureEvent>>('generation-enqueue-failure-event', async (event) => {
        console.log("Generation enqueue failure event received:", event);
        const prefs = await GetAppPreferences();
        const soundName = prefs.preferences?.enqueue_failure_sound;
        if (soundName !== undefined) {
          const registry = SoundRegistry.getInstance();
          registry.playSound(soundName);
        }
        const message = makeMessage(event.payload.data);
        toast.error(message);
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

const makeMessage = (event: GenerationEnqueueFailureEvent) => {
  if (!!event.reason) {
    return event.reason;
  }
  switch (event.action) {
    case GenerationAction.GenerateImage:
      return "Couldn't enqueue image generation!";
    case GenerationAction.GenerateVideo:
      return "Couldn't enqueue video generation!";
    case GenerationAction.RemoveBackground:
      return "Couldn't enqueue background removal!";
    case GenerationAction.ImageTo3d:
      return "Couldn't enqueue image to 3D!";
    default:
      return "Couldn't enqueue generation!";
  }
}
