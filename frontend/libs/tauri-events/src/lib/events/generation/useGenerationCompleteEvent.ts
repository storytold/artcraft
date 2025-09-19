import { useEffect } from "react";
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { SoundRegistry } from "@storyteller/soundboard";
import { GetAppPreferences } from "@storyteller/tauri-api";
import { toast } from "@storyteller/ui-toaster";
import { GenerationAction, GenerationModel, GenerationServiceProvider } from "./common";
import { BasicEventWrapper } from "../../common/BasicEventWrapper";

type GenerationCompleteEvent = {
  action?: GenerationAction,
  service: GenerationServiceProvider,
  model?: GenerationModel,
};

export const useGenerationCompleteEvent = () => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<GenerationCompleteEvent>>('generation-complete-event', async (event) => {
        console.log("Generation complete event received:", event);
        const prefs = await GetAppPreferences();
        const soundName = prefs.preferences?.generation_success_sound;
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

const makeMessage = (event: GenerationCompleteEvent) => {
  if (!event.action) {
    return "Generation complete!";
  }
  switch (event.action) {
    case GenerationAction.GenerateImage:
      return "Image generation complete!";
    case GenerationAction.GenerateVideo:
      return "Video generation complete!";
    case GenerationAction.RemoveBackground:
      return "Background removal complete!";
    case GenerationAction.ImageTo3d:
      return "Image to 3D complete!";
    default:
      return "Generation complete!";
  }
}
