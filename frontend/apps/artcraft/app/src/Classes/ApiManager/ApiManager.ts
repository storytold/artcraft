import { GetBuildEnvironment } from "~/BuildEnvironment";
import environmentVariables from "../EnvironmentVariables";
import { Configs } from "~/configs";
import { FetchProxy as fetch } from "@storyteller/tauri-utils";
import { StorytellerApiHostStore } from "@storyteller/api";

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
    const environmentType = GetBuildEnvironment().getBuildEnvironmentType();
    const configs = new Configs(environmentType);

    // TODO(bt,2025-07-06): Not sure that any of this is used anymore.
    // If so, try to use Configs, StorytellerApiHostStore, or another configuration source.
    
    // look at the .env file
    this.ApiTargets = {
      GoggleApi: environmentVariables.values.GOOGLE_API as string,
      FunnelApi: environmentVariables.values.FUNNEL_API as string,
      CdnApi: environmentVariables.values.CDN_API as string,
      GravatarApi: environmentVariables.values.GRAVATAR_API as string,
      uploadApi: environmentVariables.values.UPLOAD_API_VIDEO as string,
    };
  }

  protected getApiSchemeAndHost(): string {
    return StorytellerApiHostStore.getInstance().getApiSchemeAndHost();
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

    console.log(`HELLO${formData}`);
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
