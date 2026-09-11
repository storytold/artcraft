import { ApiManager, ApiResponse } from "./ApiManager";
import type { UserBookmarkBatch } from "@storyteller/ui-pagescene";

export class UserBookmarksApi extends ApiManager {
  public CreateUserBookmark({
    entityToken,
    entityType,
  }: {
    entityToken: string;
    entityType: string;
  }): Promise<
    ApiResponse<{
      new_bookmark_count_for_entity?: number;
      user_bookmark_token?: string;
    }>
  > {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_bookmarks/create`;
    const body = {
      entity_token: entityToken,
      entity_type: entityType,
    };

    return this.post<
      {
        entity_token: string;
        entity_type: string;
      },
      {
        success?: boolean;
        new_bookmark_count_for_entity?: number;
        user_bookmark_token: string;
        BadInput?: string;
      }
    >({ endpoint, body })
      .then((response) => ({
        success: response.success ?? false,
        data: {
          new_bookmark_count_for_entity: response.new_bookmark_count_for_entity,
          user_bookmark_token: response.user_bookmark_token,
        },
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public DeleteUserBookmark({
    entityToken,
  }: {
    entityToken: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_bookmarks/delete/${entityToken}`;

    return this.delete<
      { as_mod: boolean },
      {
        success?: boolean;
        BadInput?: string;
      }
    >({ endpoint, body: { as_mod: true } })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public ListUserBookmarks(): Promise<ApiResponse<UserBookmarkBatch[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_bookmarks/batch`;

    return this.get<{
      success?: boolean;
      bookmarks?: UserBookmarkBatch[];
      BadInput?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success ?? false,
        data: response.bookmarks,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

}
