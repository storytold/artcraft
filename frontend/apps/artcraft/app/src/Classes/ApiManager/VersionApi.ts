import { ApiManager, ApiResponse } from "./ApiManager";

export interface NewVersionInfo {
  version_label: string;
  features_description: string;
  direct_download_link?: string;
  website_download_link: string;
}

export interface VersionInfoResponse {
  is_up_to_date: boolean;
  new_version?: NewVersionInfo;
}

export class VersionApi extends ApiManager {
  private static instance: VersionApi;

  public static getInstance(): VersionApi {
    if (!VersionApi.instance) {
      VersionApi.instance = new VersionApi();
    }
    return VersionApi.instance;
  }

  public getVersionInfo(
    platform: string,
    versionString: string,
  ): Promise<ApiResponse<VersionInfoResponse>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/artcraft/version_info/${platform}/${versionString}`;
    return this.get<VersionInfoResponse>({ endpoint })
      .then((data) => ({
        success: true,
        data,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }
}
