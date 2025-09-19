
/**
 * This is cached whenever vite/remix launches or CI/CD bakes in constants.
 * It's fed from an environment variable.
 */
export enum BuildEnvType {
    Dev,
    DevProxy,
    Staging,
    Production,
}

// Use CI/CD to replace this value with one of the BuildEnvType values.
const BUILD_ENV_TYPE = '%BUILD_ENV_TYPE_VALUE%';

// Attempt to read the environment type.
export function GetBuildEnvType() : BuildEnvType {
  let maybeEnvType : BuildEnvType | undefined = undefined;

  if (!BUILD_ENV_TYPE.startsWith("%") && !BUILD_ENV_TYPE.endsWith("%")) {
    maybeEnvType = stringToEnvType(BUILD_ENV_TYPE);
    if (maybeEnvType !== undefined) {
      return maybeEnvType;
    }
  }

  if (import.meta.env.BUILD_ENV_TYPE !== undefined) {
    console.log(`Reading environment variable 'BUILD_ENV_TYPE' (= ${import.meta.env.BUILD_ENV_TYPE}) to determine build environment.`)
    maybeEnvType = stringToEnvType(import.meta.env.BUILD_ENV_TYPE);
    if (maybeEnvType !== undefined) {
      return maybeEnvType;
    }
  }

  if (import.meta.env.VITE_ENVIRONMENT_TYPE !== undefined) {
    console.log(`Reading legacy environment variable 'VITE_ENVIRONMENT_TYPE' (= ${import.meta.env.VITE_ENVIRONMENT_TYPE}) to determine build environment.`)
    maybeEnvType = stringToEnvType(import.meta.env.VITE_ENVIRONMENT_TYPE);
    if (maybeEnvType !== undefined) {
      return maybeEnvType;
    }
  }

  // Always default to production.
  return BuildEnvType.Production;
}

function stringToEnvType(str: string): BuildEnvType | undefined {
  switch (str.toLocaleLowerCase()) {
    case "dev":
    case "development":
      return BuildEnvType.Dev;
    case "dev-proxy":
    case "devproxy":
      return BuildEnvType.DevProxy;
    case "stage":
    case "staging":
      return BuildEnvType.Staging;
    default:
      return undefined;
  }
}
