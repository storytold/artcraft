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

}
