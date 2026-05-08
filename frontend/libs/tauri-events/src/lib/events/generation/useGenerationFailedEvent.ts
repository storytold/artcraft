import { useEffect } from "react";
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { SoundManager } from "@storyteller/soundboard";
import { toast } from "@storyteller/ui-toaster";
import { GenerationAction, GenerationModel, GenerationServiceProvider } from "./common";
import { BasicEventWrapper } from "../../common/BasicEventWrapper";

type GenerationFailedEvent = {
  action: GenerationAction,
  service: GenerationServiceProvider,
  model?: GenerationModel,
  reason?: string,
};

export const useGenerationFailedEvent = () => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<GenerationFailedEvent>>('generation-failed-event', async (event) => {
        console.log("Generation failed event received:", event);
        await SoundManager.playGenerationFailure();
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

const makeMessage = (event: GenerationFailedEvent) => {
  if (!!event.reason) {
    return event.reason;
  }
  switch (event.action) {
    case GenerationAction.GenerateImage:
      return "Image generation failed!";
    case GenerationAction.GenerateVideo:
      return "Video generation failed!";
    case GenerationAction.RemoveBackground:
      return "Background removal failed!";
    case GenerationAction.ImageTo3d:
      return "3D model generation failed!";
    case GenerationAction.GenerateGaussian:
      return "3D world generation failed!";
    default:
      return "Generation failed!";
  }
}
