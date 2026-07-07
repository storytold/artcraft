// The audio request builder + enqueue live in the shared omni-gen lib (used
// by both this page and the desktop PromptBoxAudio). Re-exported so this
// page keeps the same local-module structure as create-image / create-video.
export {
  buildAudioRequest,
  enqueueAudioGeneration,
  AUDIO_MODELS_REQUIRING_AUDIO_REF,
} from "@storyteller/omni-gen";
export type { AudioGenerationSettings } from "@storyteller/omni-gen";
