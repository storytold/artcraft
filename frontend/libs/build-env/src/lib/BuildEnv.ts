import { BuildEnvType, GetBuildEnvType } from "./BuildEnvType";

export class BuildEnv {
  private static instance: BuildEnv;
  private readonly envType: BuildEnvType;

  public static getInstance(): BuildEnv {
    if (BuildEnv.instance !== undefined) {
      return BuildEnv.instance;
    }

    const envType = GetBuildEnvType();
    const instance = new BuildEnv(envType);
    BuildEnv.instance = instance;
    
    return instance;
  }

  public getType(): BuildEnvType {
    return this.envType;
  }

  private constructor(envType: BuildEnvType) {
    this.envType = envType;
  }
}

export function GetBuildEnv() : BuildEnv {
  return BuildEnv.getInstance();
}
