import { ApiManager, ApiResponse } from "./ApiManager.js";
import { Pagination } from "./models/Pagination.js";
import { ZsDataset } from "./models/Dataset.js";

interface VoiceDesignerParams {
  text: string;
  uuidIdempotencyToken: string;
  voiceToken: string;
}

interface VoiceDesignerRequest {
  text: string;
  uuid_idempotency_token: string;
  voice_token: string;
}

export class VoiceDesignerApi extends ApiManager {
  public EnqueueTts(
    params: VoiceDesignerParams,
  ): Promise<
    ApiResponse<{ inference_job_token?: string; voice_token?: string }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/voice_designer/enqueue_tts`;

    const body = this.parseBodyValues<
      VoiceDesignerParams,
      VoiceDesignerRequest
    >(params);

    return this.post<
      VoiceDesignerRequest,
      {
        success?: boolean;
        inference_job_token?: string;
        voice_token: string;
        BadInput?: string;
      }
    >({ endpoint, body })
      .then((response) => ({
        success: response.success ?? false,
        ...(response.success
          ? {
              data: {
                inference_job_token: response.inference_job_token,
                voice_token: response.voice_token,
              },
            }
          : {}),
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public ListDatasetsByUser({
    username,
  }: {
    username: string;
  }): Promise<ApiResponse<ZsDataset[]>> {
    const user = username;
    const endpoint = `${this.getApiSchemeAndHost()}/v1/voice_designer/user/${user}/list`;

    return this.get<{
      success: boolean;
      datasets: ZsDataset[];
      pagination: Pagination;
    }>({ endpoint })
      .then((response) => ({
        success: true,
        data: response.datasets,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }
}
