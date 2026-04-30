import { useEffect } from "react";
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { SoundManager } from "@storyteller/soundboard";
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
        await SoundManager.playGenerationSuccess();
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
      return "3D model generation complete!";
    case GenerationAction.GenerateGaussian:
      return "3D world generation complete!";
    default:
      return "Generation complete!";
  }
}
