import { ApiManager, ApiResponse } from "./ApiManager.js";
import { Character } from "./models/Character.js";

export interface CreateCharacterRequest {
  image_media_token: string;
  model: string;
  uuid_idempotency_token: string;
  character_name: string;
  character_description?: string | null;
}

export interface EditCharacterRequest {
  token: string;
  updated_name?: string | null;
  updated_description?: string | null;
}

export interface ListCharactersRequest {
  cursor?: number;
}

export class CharactersApi extends ApiManager {
  public CreateCharacter(
    params: CreateCharacterRequest,
  ): Promise<ApiResponse<{ inference_job_token: string }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/character/create`;

    return this.post<
      CreateCharacterRequest,
      { success: boolean; inference_job_token: string }
    >({
      endpoint,
      body: params,
    })
      .then(({ success, inference_job_token }) => ({
        success,
        data: { inference_job_token },
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public EditCharacter(
    params: EditCharacterRequest,
  ): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/character/edit`;

    return this.post<
      EditCharacterRequest,
      { success: boolean; BadInput?: string }
    >({
      endpoint,
      body: params,
    })
      .then(({ success, BadInput }) => ({
        success: success ?? false,
        errorMessage: BadInput,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public GetCharacter({
    characterToken,
  }: {
    characterToken: string;
  }): Promise<ApiResponse<Character>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/character/${characterToken}`;

    return this.get<{ success: boolean; character: Character }>({ endpoint })
      .then(({ success, character }) => ({
        success,
        data: character,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public DeleteCharacter({
    characterToken,
  }: {
    characterToken: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/character/${characterToken}`;

    return this.delete<null, { success: boolean }>({
      endpoint,
    })
      .then(({ success }) => ({
        success: success ?? false,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public ListCharacters(
    params?: ListCharactersRequest,
  ): Promise<ApiResponse<Character[], { next_cursor?: number | null }>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/characters/session`;

    const query = params?.cursor
      ? { cursor: params.cursor.toString() }
      : undefined;

    return this.get<{
      success: boolean;
      characters: Character[];
      next_cursor?: number | null;
    }>({ endpoint, query })
      .then((response) => ({
        success: response.success,
        data: response.characters,
        pagination: { next_cursor: response.next_cursor },
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }
}
