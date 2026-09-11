import environmentVariables from "~/Classes/EnvironmentVariables";
import { GetCdnOrigin } from "./GetCdnOrigin";

class BucketConfig {
  isLocalDev: boolean;

  constructor() {
    this.isLocalDev =
      document.location.host.includes("localhost") ||
      document.location.host.includes("jungle.horse") ||
      document.location.host.startsWith("dev.");
  }

  // TODO: Prevent callers with undefined/null paths
  // TODO pipeline works make more robust....
  getGcsUrl(bucketRelativePath: string | undefined | null): string {
    let path = bucketRelativePath;
    if (path !== undefined && path !== null && !path.startsWith("/")) {
      path = "/" + path;
    }
    const media_api_base_url = GetCdnOrigin();
    return `${media_api_base_url}${path}`;
  }

  getCdnUrl(
    bucketRelativePath: string,
    width?: number,
    quality?: number,
  ): string {
    const cndBasePath = environmentVariables.values.CDN_API;
    const path = bucketRelativePath?.startsWith("/")
      ? bucketRelativePath
      : "/" + bucketRelativePath;
    let resizeParams = "";
    if (width || quality) {
      resizeParams = "cdn-cgi/image/";
      if (width) {
        resizeParams += `width=${width},`;
      }
      if (quality) {
        resizeParams += `quality=${quality},`;
      }
      resizeParams = resizeParams.slice(0, -1);
    }
    if (resizeParams) {
      return `${cndBasePath}/${resizeParams}${path}`;
    } else {
      return `${cndBasePath}${path}`;
    }
  }
}

export { BucketConfig };
