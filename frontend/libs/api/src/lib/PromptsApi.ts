import { ApiManager, ApiResponse, buildSessionHeaders } from "./ApiManager.js";
import { Prompts } from "./models/Prompts.js";
import { FetchProxy as fetch } from "@storyteller/tauri-utils";

export class PromptsApi extends ApiManager {
  public async pollJobSession(
    jobToken: string,
    thumbnailWidth = 256
  ): Promise<
    ApiResponse<{
      job_token: string;
      request: {
        maybe_model_title: string;
      };
      status: {
        status: string;
        progress_percentage: number;
      };
      result: {
        image_url: string;
        thumbnail_url: string;
        public_bucket_path: string;
        generated_images?: string[];
        error?: string;
      };
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/jobs/job/${jobToken}`;

    const response = await this.get<any>({
      endpoint,
    });
    console.log("Job Polling Response:");
    console.log(response);

    const image_url = response.state.maybe_result?.media_links?.cdn_url;
    const public_bucket_path =
      response.state.maybe_result?.maybe_public_bucket_media_path;

    const thumbnail_url =
      response.state.maybe_result?.media_links?.maybe_thumbnail_template?.replace(
        "{WIDTH}",
        thumbnailWidth.toString()
      );

    const progress_percentage = response.state.status.progress_percentage;
    const status_string = response.state.status.status;

    console.log("Image URL:", image_url);
    console.log("Thumbnail URL:", thumbnail_url);
    console.log("Progress Percentage:", progress_percentage);
    console.log("Status", status_string);

    console.log("response FROM JOBS");
    console.log(response);

    const success = response.success ?? false;
    const errorMessage = response.BadInput;

    return {
      success,
      data: {
        result: {
          image_url: image_url || "",
          thumbnail_url: thumbnail_url || "",
          public_bucket_path: public_bucket_path || "",
          error: undefined,
        },
        job_token: jobToken,
        request: {
          maybe_model_title: "Image Generation",
        },
        status: {
          status: status_string.toLowerCase(),
          progress_percentage: progress_percentage,
        },
      },
      errorMessage,
    };
  }

  public GetPromptsByToken({
    token,
  }: {
    token: string;
  }): Promise<ApiResponse<Prompts>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/prompts/${token}`;

    return this.get<{
      success: boolean;
      prompt: Prompts;
      error_reason?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: response.prompt,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public BatchGetPrompts({
    tokens,
  }: {
    tokens: string[];
  }): Promise<ApiResponse<Prompts[]>> {
    if (tokens.length === 0) {
      return Promise.resolve({ success: true, data: [] });
    }
    const query = tokens
      .map((t) => `tokens=${encodeURIComponent(t)}`)
      .join("&");
    const endpoint = `${this.getApiSchemeAndHost()}/v1/prompt/batch?${query}`;

    return this.get<{
      success: boolean;
      prompts: Prompts[];
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: response.prompts,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
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

    const uuidIdempotencyToken = crypto.randomUUID();
    formData.append("uuid_idempotency_token", uuidIdempotencyToken);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: buildSessionHeaders({
        Accept: "application/json",
      }),
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
        errorMessage: "Failed to generate snapshot.",
      };
    }

    return result;
  }
}
