import { useEffect } from "react";
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { SoundManager } from "@storyteller/soundboard";
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
        await SoundManager.playEnqueueSuccess();
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
      return "3D model generation enqueued!";
    case GenerationAction.GenerateGaussian:
      return "3D world generation enqueued!";
    default:
      return "Generation enqueued!";
  }
}
