
/**
 * This is cached whenever vite/remix/whatever launches.
 * It's fed from an environment variable.
 */
export enum BuildEnvironmentType {
    Dev,
    DevProxy,
    Staging,
    Production,
}

export class BuildEnvironment {
  private static instance: BuildEnvironment;
  private readonly environmentType: BuildEnvironmentType;

  public static getInstance(): BuildEnvironment {
    if (BuildEnvironment.instance !== undefined) {
      return BuildEnvironment.instance;
    }

    // https://v2.vitejs.dev/guide/env-and-mode.html
    console.log('Reading environment variable: `VITE_ENVIRONMENT_TYPE` to determine build environment.')
    console.log(`Environment variable 'VITE_ENVIRONMENT_TYPE' = ${import.meta.env.VITE_ENVIRONMENT_TYPE}`)

    const environmentLabel : string | undefined = import.meta.env.VITE_ENVIRONMENT_TYPE;

    let environmentType = BuildEnvironmentType.Production;

    switch (environmentLabel?.toLocaleLowerCase()) {
      case "dev":
      case "development":
        environmentType = BuildEnvironmentType.Dev;
        break;
      case "dev-proxy":
      case "devproxy":
        environmentType = BuildEnvironmentType.DevProxy;
        break;
      case "stage":
      case "staging":
        environmentType = BuildEnvironmentType.Staging;
        break;
    }

    const instance = new BuildEnvironment(environmentType);
    BuildEnvironment.instance = instance;
    return instance;
  }

  public getBuildEnvironmentType(): BuildEnvironmentType {
    return this.environmentType;
  }

  private constructor(environmentType: BuildEnvironmentType) {
    this.environmentType = environmentType;
  }
}

export function GetBuildEnvironment() : BuildEnvironment {
  return BuildEnvironment.getInstance();
}
