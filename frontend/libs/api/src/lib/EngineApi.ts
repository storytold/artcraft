import { ApiManager, ApiResponse } from "./ApiManager";

export class EngineApi extends ApiManager {
  public async ConvertTbxToGltf({
    mediaFileToken,
    uuidIdempotencyToken,
  }: {
    mediaFileToken: string;
    uuidIdempotencyToken: string;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/conversion/enqueue_fbx_to_gltf`;

    const body = {
      media_file_token: mediaFileToken,
      uuid_idempotency_token: uuidIdempotencyToken,
    };

    return this.post<
      { media_file_token: string; uuid_idempotency_token: string },
      { success?: boolean; inference_job_token?: string; BadInput?: string }
    >({
      endpoint,
      body: body,
    })
      .then((response) => {
        return {
          success: response.success ?? false,
          data: response.inference_job_token,
          errorMessage: response.BadInput,
        };
      })
      .catch((err) => {
        return {
          success: false,
          errorMessage: err.message,
        };
      });
  }

  public async uploadSceneSnapshot({
    screenshot,
    sceneMediaToken,
  }: {
    screenshot: File; // base64 encoded PNG
    sceneMediaToken?: string;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/image_studio/scene_snapshot`;
    const formData = new FormData();
    formData.append("snapshot", screenshot); // Changed from "screenshot" to "snapshot" to match API spec
    if (sceneMediaToken) {
      formData.append("scene_media_token", sceneMediaToken);
    }

    // for now ...
    const uuidIdempotencyToken = crypto.randomUUID(); // Generate a new UUID
    formData.append("uuid_idempotency_token", uuidIdempotencyToken); // Added uuid_idempotency_token

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
      body: formData,
    });

    const postResponse = await response.json();

    console.log(postResponse);

    let result: { success: boolean; data?: string; errorMessage?: string };

    if (postResponse.success) {
      result = {
        success: true,
        data: postResponse.snapshot_media_token,
        errorMessage: undefined,
      };
    } else {
      result = {
        success: false,
        errorMessage: postResponse.BadInput,
      };
    }

    return result;
  }

  public async enqueueImageGeneration({
    disableSystemPrompt,
    prompt,
    snapshotMediaToken,
    additionalImages,
  }: {
    disableSystemPrompt: boolean;
    prompt: string;
    snapshotMediaToken: string;
    additionalImages?: string[];
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/image_studio/prompt`;
    
    const uuidIdempotencyToken = crypto.randomUUID(); // Generate a new UUID
    const body = {
      uuid_idempotency_token: uuidIdempotencyToken,
      disable_system_prompt: disableSystemPrompt,
      prompt,
      snapshot_media_token: snapshotMediaToken, // Changed from scene_media_token to snapshot_media_token
      additional_images: additionalImages,
    };

    const postResponse = await this.post<
      {
        uuid_idempotency_token: string;
        disable_system_prompt: boolean;
        prompt: string;
        snapshot_media_token: string;
        additional_images?: string[];
      },
      { success?: boolean; job_token?: string; BadInput?: string }
    >({
      endpoint,
      body,
    });

    // Check if the response is successful
    const isSuccess = postResponse.success ?? false;

    // Prepare the result object
    const result = {
      success: isSuccess,
      data: isSuccess ? postResponse.job_token : undefined,
      errorMessage: isSuccess ? undefined : postResponse.BadInput,
    };

    return result;
  }

  public async pollJobSession(jobToken: string): Promise<
    ApiResponse<{
      status: string;
      result: {
        generated_images?: string[];
        error?: string;
      };
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/jobs/session/${jobToken}`;

    const response = await this.get<{
      success?: boolean;
      status?: string;
      result?: {
        generated_images?: string[];
        error?: string;
      };
      BadInput?: string;
    }>({
      endpoint,
    });

    const success = response.success ?? false;
    const status = response.status ?? "";
    const result = response.result ?? {
      generated_images: [],
      error: undefined,
    };
    const errorMessage = response.BadInput;

    return {
      success,
      data: { status, result },
      errorMessage,
    };
  }

  public async pollStudioSessionJobs(jobToken: string): Promise<
    ApiResponse<{
      status: string;
      result: {
        generated_images?: string[];
        error?: string;
      };
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/image_studio/session_jobs/${jobToken}`;

    const response = await this.get<{
      success?: boolean;
      status?: string;
      result?: {
        generated_images?: string[];
        error?: string;
      };
      BadInput?: string;
    }>({
      endpoint,
    });

    const success = response.success ?? false;
    const status = response.status ?? "";
    const result = response.result ?? {
      generated_images: [],
      error: undefined,
    };
    const errorMessage = response.BadInput;

    return {
      success,
      data: { status, result },
      errorMessage,
    };
  }
}
