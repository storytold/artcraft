import { ApiManager, ApiResponse } from "./ApiManager";

export class ModerationApi extends ApiManager {
  public async UpdateFeatureFlagsByToken({
    usernameOrToken,
    flags,
  }: {
    usernameOrToken: string;
    flags: string[];
  }): Promise<
    ApiResponse<{
      inference_job_token?: string;
      inference_job_token_type?: string;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/moderation/user_feature_flags/${usernameOrToken}`;

    const body = {
      action: {
        AddFlags: {
          flags,
        },
      },
    };

    return this.post<
      { action: { AddFlags: { flags: string[] } } },
      { success?: boolean; BadInput?: string }
    >({
      endpoint,
      body: body,
    })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.BadInput,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }
}
