type NonNullableObject<T extends object> = NonNullable<T>;

export interface ApiResponse<T, P = undefined> {
  success: boolean;
  errorMessage?: string;
  data?: T;
  pagination?: P;
}

export class ApiManager {
  ApiTargets: Record<string, string> = {};

  constructor() {
    // look at the .env file
    this.ApiTargets = {
      BaseApi: "https://api.storyteller.ai",
      CdnApi: "https://cdn.storyteller.ai",
    };
  }

  public async fetch<B, T>(
    endpoint: string,
    {
      method,
      query,
      body,
    }: {
      method: string;
      query?: Record<string, string | boolean | number | undefined>;
      body?: B;
    },
  ): Promise<T> {
    const queryInString =
      query &&
      Object.entries(query).reduce(
        (allOptions, [key, value]) => {
          if (!value) {
            return allOptions;
          }
          allOptions[key] = value.toString();
          return allOptions;
        },
        {} as Record<string, string>,
      );

    const endpointWithQueries = queryInString
      ? endpoint + "?" + new URLSearchParams(queryInString)
      : endpoint;

    const bodyInString = JSON.stringify(body);

    const response = await fetch(endpointWithQueries, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: bodyInString,
    });
    return response.json();
  }

  public async fetchMultipartFormData<T>(
    endpoint: string,
    {
      method,
      body,
    }: {
      method: string;
      body: FormData;
    },
  ): Promise<T> {
    const response = await fetch(endpoint, {
      method,
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
      body: body,
    });
    return response.json();
  }

  protected get<T>({
    endpoint,
    query,
  }: {
    endpoint: string;
    query?: Record<string, string | boolean | number | undefined>;
  }): Promise<T> {
    return this.fetch<null, T>(endpoint, { method: "GET", query });
  }

  protected post<B, T>({
    endpoint,
    query,
    body,
  }: {
    endpoint: string;
    query?: Record<string, string | boolean | number | undefined>;
    body?: B;
  }): Promise<T> {
    return this.fetch<B, T>(endpoint, {
      method: "POST",
      query,
      body,
    });
  }

  protected delete<B, T>({
    endpoint,
    query,
    body,
  }: {
    endpoint: string;
    query?: Record<string, string | boolean | number | undefined>;
    body?: B;
  }): Promise<T> {
    return this.fetch<B, T>(endpoint, {
      method: "DELETE",
      query,
      body,
    });
  }

  protected async postForm<T>({
    endpoint,
    formRecord,
    uuid,
    blob,
    blobFileName,
  }: {
    endpoint: string;
    formRecord: Record<string, string>;
    uuid: string;
    blob?: Blob | File;
    blobFileName?: string;
  }): Promise<T> {
    const formData = new FormData();
    formData.append("uuid_idempotency_token", uuid);
    Object.entries(formRecord).forEach(([key, value]) => {
      formData.append(key, value);
    });
    if (blob && blobFileName) {
      formData.append("file", blob, blobFileName);
    } else if (blob) {
      formData.append("file", blob);
    }

    // console.log(`HELLO${formData}`);
    return this.fetchMultipartFormData<T>(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      credentials: "include",
      body: formData,
    });
  }

  protected camelToSnakeCase(str: string) {
    return str.replace(/([a-z0])([A-Z])/g, "$1_$2").toLowerCase();
  }

  protected parseQueryValues(
    params: Record<string, string | string[] | boolean | number | undefined>,
  ): Record<string, string> {
    return Object.entries(params).reduce(
      (allParams, [key, value]) => {
        if (!value) {
          return allParams;
        }
        const snakeKey = this.camelToSnakeCase(key);
        if (Array.isArray(value)) {
          return { ...allParams, [snakeKey]: value.join(",") };
        }
        return { ...allParams, [snakeKey]: value.toString() };
      },
      {} as Record<string, string>,
    );
  }

  protected parseBodyValues<T extends object, B extends object>(
    params: NonNullableObject<T>,
  ): B {
    return Object.entries(params).reduce((allParams, [key, value]) => {
      if (!value) {
        return allParams;
      }
      const snakeKey = this.camelToSnakeCase(key);
      if (Array.isArray(value)) {
        return { ...allParams, [snakeKey]: value };
      }
      return { ...allParams, [snakeKey]: value };
    }, {} as B);
  }
}

export class Api extends ApiManager {
  public async ConvertTbxToGltf({
    mediaFileToken,
    uuidIdempotencyToken,
  }: {
    mediaFileToken: string;
    uuidIdempotencyToken: string;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/conversion/enqueue_fbx_to_gltf`;

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
    const endpoint = `${this.ApiTargets.BaseApi}/v1/image_studio/scene_snapshot`;
    const formData = new FormData();
    formData.append("snapshot", screenshot); // Changed from "screenshot" to "snapshot" to match API spec
    if (sceneMediaToken) {
      formData.append("scene_media_token", sceneMediaToken);
    }

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
        errorMessage: "Failed to generate snapshot.",
      };
    }

    return result;
  }

  public async enqueueImageGeneration({
    prompt,
    snapshotMediaToken,
    additionalImages,
  }: {
    prompt: string;
    snapshotMediaToken: string;
    additionalImages?: string[];
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/image_studio/prompt`;

    const uuidIdempotencyToken = crypto.randomUUID(); // Generate a new UUID
    const body = {
      uuid_idempotency_token: uuidIdempotencyToken,
      prompt,
      snapshot_media_token: snapshotMediaToken, // Changed from scene_media_token to snapshot_media_token
      additional_images: additionalImages,
    };

    const postResponse = await this.post<
      {
        uuid_idempotency_token: string;
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
    console.log("postResponse FOR ENQUEUE IMAGE GENERATION");
    console.log(postResponse);

    const result = {
      success: isSuccess,
      data: isSuccess ? postResponse.inference_job_token : undefined,
      errorMessage: isSuccess ? undefined : postResponse.BadInput,
    };

    return result;
  }

  public async pollJobSession(jobToken: string): Promise<
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
        generated_images?: string[];
        error?: string;
      };
    }>
  > {
    const endpoint = `${this.ApiTargets.BaseApi}/v1/jobs/job/${jobToken}`;

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

    console.log("response FROM JOBS");
    console.log(response);

    const success = response.success ?? false;
    const status = response.status ?? "";
    const result = response.result ?? {
      generated_images: [],
      error: undefined,
    };

    const errorMessage = response.BadInput;

    return {
      success,
      data: {
        result,
        job_token: jobToken,
        request: {
          maybe_model_title: "Image Generation",
        },
        status: {
          status: status.toLowerCase(),
          progress_percentage: 0,
        },
      },
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
    const endpoint = `${this.ApiTargets.BaseApi}/v1/image_studio/session_jobs/${jobToken}`;

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
