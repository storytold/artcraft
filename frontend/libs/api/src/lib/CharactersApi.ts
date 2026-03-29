import { ApiManager, ApiResponse } from "./ApiManager.js";
import { Character } from "./models/Character.js";
import { PaginationInfinite } from "./models/Pagination.js";

export interface CreateCharacterRequest {
  name: string;
  description?: string;
  image_media_file_token: string;
}

export interface UpdateCharacterRequest {
  name?: string;
  description?: string;
  image_media_file_token?: string;
}

export interface ListCharactersRequest {
  cursor?: string;
  cursorIsReversed?: boolean;
  pageSize?: number;
}

export class CharactersApi extends ApiManager {
  public CreateCharacter(
    params: CreateCharacterRequest,
  ): Promise<ApiResponse<Character>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/characters/create`;

    return this.post<CreateCharacterRequest, { success: boolean } & Character>({
      endpoint,
      body: params,
    })
      .then(({ success, ...character }) => ({
        success,
        data: character,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public ListCharacters({
    ...params
  }: ListCharactersRequest): Promise<
    ApiResponse<Character[], PaginationInfinite>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/characters/list`;

    const query = this.parseQueryValues(params);

    return this.get<{
      success: boolean;
      results: Character[];
      pagination: PaginationInfinite;
    }>({ endpoint, query })
      .then((response) => ({
        success: true,
        data: response.results,
        pagination: response.pagination,
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
    const endpoint = `${this.getApiSchemeAndHost()}/v1/characters/character/${characterToken}`;

    return this.get<{ success: boolean } & Character>({ endpoint })
      .then(({ success, ...character }) => ({
        success,
        data: character,
      }))
      .catch((err) => ({
        success: false,
        errorMessage: err.message,
      }));
  }

  public UpdateCharacter({
    characterToken,
    ...params
  }: UpdateCharacterRequest & {
    characterToken: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/characters/character/${characterToken}`;

    const body = this.parseBodyValues<
      UpdateCharacterRequest,
      Record<string, unknown>
    >(params);

    return this.post<Record<string, unknown>, { success?: boolean; BadInput?: string }>({
      endpoint,
      body,
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

  public DeleteCharacter({
    characterToken,
  }: {
    characterToken: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/characters/character/${characterToken}`;

    return this.delete<null, { success?: boolean; BadInput?: string }>({
      endpoint,
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
}
