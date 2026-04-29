export interface IGenerationOptions {
  upscale: boolean;
  faceDetail: boolean;
  styleStrength: number;
  lipSync: boolean;
  cinematic: boolean;
  globalIpAdapterImageMediaToken: string | null;
  enginePreProcessing: boolean;
}

export class GenerationOptions implements IGenerationOptions {
  public upscale: boolean;
  public faceDetail: boolean;
  public styleStrength: number;
  public lipSync: boolean;
  public cinematic: boolean;
  public globalIpAdapterImageMediaToken: string | null;
  public enginePreProcessing: boolean;
  constructor(
    upscale: boolean,
    faceDetail: boolean,
    styleStrength: number,
    lipSync: boolean,
    cinematic: boolean,
    globalIpAdapterImageMediaToken: string | null,
    enginePreprocessing: boolean,
  ) {
    this.upscale = upscale;
    this.faceDetail = faceDetail;
    this.styleStrength = styleStrength;
    this.lipSync = lipSync;
    this.cinematic = cinematic;
    this.globalIpAdapterImageMediaToken = globalIpAdapterImageMediaToken;
    this.enginePreProcessing = enginePreprocessing;
  }
}
