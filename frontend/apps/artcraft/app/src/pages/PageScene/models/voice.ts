import { Weight } from "~/models";
import { AudioTabPages } from "~/pages/PageScene/enums";

export type AudioPanelState = {
  firstLoad: boolean;
  page: AudioTabPages;
  lastWorkingAudioGeneration: AudioTabPages.TTS | AudioTabPages.V2V;
  ttsState: TtsState;
  v2vState: V2VState;
};
export type TtsState = {
  voice: Weight | undefined;
  text: string;
};

export type V2VState = {
  voice: Weight | undefined;
  file: File | undefined;
  inputFileToken: string | undefined;
};
