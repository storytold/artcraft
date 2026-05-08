export type VFXResolution = "480p" | "720p" | "1080p";

export type VFXMediaRef = {
  id: string;
  url: string;
  mediaToken: string;
};

export type VFXSubTab = "history" | "showcase";

export type VFXResultStatus = "pending" | "complete" | "failed";

export type VFXResult = {
  id: string;
  status: VFXResultStatus;
  prompt: string;
  resolution: VFXResolution;
  source?: VFXMediaRef;
  mask?: VFXMediaRef;
  reference?: VFXMediaRef;
  outputUrl?: string;
  inferenceJobToken?: string;
  failureReason?: string;
  createdAt: number;
};

export const RESOLUTION_OPTIONS: VFXResolution[] = ["480p", "720p", "1080p"];

export const DEFAULT_RESOLUTION: VFXResolution = "720p";

export const MAX_SOURCE_DURATION_S = 15;

export type VFXModelId = "beeble_switchx";

export interface VFXModel {
  id: VFXModelId;
  label: string;
  description: string;
}

export const VFX_MODELS: VFXModel[] = [
  {
    id: "beeble_switchx",
    label: "Beeble SwitchX",
    description: "Relight, change location, swap objects.",
  },
];

export const DEFAULT_MODEL_ID: VFXModelId = "beeble_switchx";
