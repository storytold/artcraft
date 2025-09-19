import { ApiManager, ApiResponse } from "./ApiManager.js";
import { GenerateTtsAudioErrorType } from "./enums/Tts.js";
import { Visibility } from "./enums/Visibility.js";

export interface GenerateTtsAudioRequest {
  creator_set_visibility?: Visibility;
  uuid_idempotency_token: string;
  tts_model_token: string;
  inference_text: string;
  is_storyteller_demo?: boolean;
}

export interface GenerateTtsAudioResponse {
  success?: boolean;
  inference_job_token?: string;
  inference_job_token_type?: string;
  BadInput?: string;
}

export class TtsApi extends ApiManager {
  public async GenerateTtsAudio(request: GenerateTtsAudioRequest): Promise<
    ApiResponse<{
      inference_job_token?: string;
      inference_job_token_type?: string;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/tts/inference`;

    const body = {
      ...request,
      ...(request.creator_set_visibility
        ? {}
        : { creator_set_visibility: Visibility.Public }),
    };

    return this.post<GenerateTtsAudioRequest, GenerateTtsAudioResponse>({
      endpoint,
      body: body,
    })
      .then((response) => {
        if (!response.success) {
          return {
            success: false,
            errorMessage: response.BadInput,
            data: {},
          };
        }
        return {
          success: true,
          data: {
            inference_job_token: response.inference_job_token,
            inference_job_token_type: response.inference_job_token_type,
          },
        };
      })
      .catch(() => {
        return {
          success: false,
          errorMessage: GenerateTtsAudioErrorType.UnknownError,
          data: {},
        };
      });
  }
}
