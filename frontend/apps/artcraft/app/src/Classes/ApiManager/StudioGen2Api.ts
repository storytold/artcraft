
import { ApiManager, ApiResponse } from "./ApiManager";
import { Visibility } from "~/enums";

interface EnqueueStudioGen2Request {
  // Idempotency
  uuid_idempotency_token: string;

  // Media token for starting frame
  image_file: string;

  // Media token for driver video
  video_file: string;

  // Optional visibility override
  creator_set_visibility?: string;
}

export class StudioGen2Api extends ApiManager {
  public async EnqueueStudioGen2({
    enqueueVideo,
  }: {
    enqueueVideo: EnqueueStudioGen2Request;
  }): Promise<
    ApiResponse<{
      inference_job_token?: string;
      inference_job_token_type?: string;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/studio_gen2/enqueue`;

    const body = {
      ...enqueueVideo,
      ...(enqueueVideo.creator_set_visibility
        ? {}
        : { creator_set_visibility: Visibility.Public }),
    };

    return await this.post<
      EnqueueStudioGen2Request,
      {
        success?: boolean;
        inference_job_token?: string;
        //inference_job_token_type?: string;
        //BadInput?: string;
      }
    >({ endpoint, body: body })
      .then((response) => ({
        success: Boolean(response.success ?? false),
        data: {
          inference_job_token: response.inference_job_token,
          //inference_job_token_type: response.inference_job_token_type,
        },
        //errorMessage: response.BadInput,
      }))
      .catch((err) => {
        console.log(err.message);
        return { success: false, error_reason: err.message };
      });
  }
}
