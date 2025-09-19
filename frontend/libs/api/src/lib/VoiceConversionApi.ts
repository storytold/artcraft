import { ApiManager, ApiResponse } from "./ApiManager.js";

interface VoiceConversionParams {
  autoPredictF0?: boolean;
  creatorSetVisibility?: string;
  isStorytellerDemo?: boolean;
  overrideF0Method?: string;
  sourceMediaUploadToken: string;
  transpose?: number;
  uuidIdempotencyToken: string;
  voiceConversionModelToken: string;
}

interface VoiceConversionRequest {
  auto_predict_f0: boolean;
  creator_set_visibility: string;
  is_storyteller_demo: boolean;
  override_f0_method: string;
  source_media_upload_token: string;
  transpose: number;
  uuid_idempotency_token: string;
  voice_conversion_model_token: string;
}

export class VoiceConversionApi extends ApiManager {
  public ConvertVoice(
    params: VoiceConversionParams,
  ): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/voice_conversion/inference`;

    const body = this.parseBodyValues<
      VoiceConversionParams,
      VoiceConversionRequest
    >(params);

    return this.post<
      VoiceConversionRequest,
      {
        success?: boolean;
        inference_job_token?: string;
        BadInput?: string;
      }
    >({ endpoint, body })
      .then((response) => ({
        success: response.success ?? false,
        data: response.inference_job_token,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }
}
