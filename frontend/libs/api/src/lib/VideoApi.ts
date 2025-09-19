import { ApiManager, ApiResponse } from "./ApiManager.js";
import { Visibility } from "./enums/Visibility.js";

interface GenerateVideoStyleTransferRequest {
  creator_set_visibility: string;
  disable_lcm: boolean;
  enable_lipsync: boolean;
  frame_skip: number;
  global_ipa_media_token: string;
  input_depth_file: string;
  input_file: string;
  input_normal_file: string;
  input_outline_file: string;
  negative_prompt: string;
  prompt: string;
  remove_watermark: boolean;
  style: string;
  travel_prompt: string;
  trim_end_millis: number;
  trim_start_millis: number;
  use_cinematic: boolean;
  use_face_detailer: boolean;
  use_strength: number;
  use_upscaler: boolean;
  uuid_idempotency_token: string;
}

export class VideoApi extends ApiManager {
  public async EnqueueStudio({
    enqueueVideo,
  }: {
    enqueueVideo: GenerateVideoStyleTransferRequest;
  }): Promise<
    ApiResponse<{
      inference_job_token?: string;
      inference_job_token_type?: string;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/workflows/enqueue_studio`;

    const body = {
      ...enqueueVideo,
      ...(enqueueVideo.creator_set_visibility
        ? {}
        : { creator_set_visibility: Visibility.Public }),
    };

    return await this.post<
      GenerateVideoStyleTransferRequest,
      {
        success?: boolean;
        inference_job_token?: string;
        inference_job_token_type?: string;
        BadInput?: string;
      }
    >({ endpoint, body: body })
      .then((response) => ({
        success: Boolean(response.success ?? false),
        data: {
          inference_job_token: response.inference_job_token,
          inference_job_token_type: response.inference_job_token_type,
        },
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        console.log(err.message);
        return { success: false, error_reason: err.message };
      });
  }
}
