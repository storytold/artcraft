import { useEffect } from "react";
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { SoundRegistry } from "@storyteller/soundboard";
import { GetAppPreferences } from "@storyteller/tauri-api";
import { toast } from "@storyteller/ui-toaster";
import { GenerationAction, GenerationModel, GenerationServiceProvider } from "./common";
import { BasicEventWrapper } from "../../common/BasicEventWrapper";

type GenerationEnqueueSuccessEvent = {
  action: GenerationAction,
  service: GenerationServiceProvider,
  model?: GenerationModel,
}; 

export const useGenerationEnqueueSuccessEvent = () => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<GenerationEnqueueSuccessEvent>>('generation-enqueue-success-event', async (event) => {
        console.log("Generation enqueue success event received:", event);
        const prefs = await GetAppPreferences();
        const soundName = prefs.preferences?.enqueue_success_sound;
        if (soundName !== undefined) {
          const registry = SoundRegistry.getInstance();
          registry.playSound(soundName);
        }
        const message = makeMessage(event.payload.data);
        toast.success(message);
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

const makeMessage = (event: GenerationEnqueueSuccessEvent) => {
  switch (event.action) {
    case GenerationAction.GenerateImage:
      return "Image generation enqueued!";
    case GenerationAction.GenerateVideo:
      return "Video generation enqueued!";
    case GenerationAction.RemoveBackground:
      return "Background removal enqueued!";
    case GenerationAction.ImageTo3d:
      return "Image to 3D enqueued!";
    default:
      return "Generation enqueued!";
  }
}
