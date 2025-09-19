export interface IGenerationOptions {
  upscale: boolean;
  faceDetail: boolean;
  styleStrength: number;
  lipSync: boolean;
  cinematic: boolean;
  globalIpAdapterImageMediaToken: string | null;
  enginePreProcessing: boolean;
}
