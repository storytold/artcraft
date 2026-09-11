import { ApiManager, ApiResponse } from "./ApiManager";

export class CommentsApi extends ApiManager {
  public CreateComment({
    commentMarkdown,
    entityToken,
    entityType,
    uuidIdempotencyToken,
  }: {
    commentMarkdown: string;
    entityToken: string;
    entityType: string;
    uuidIdempotencyToken: string;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/comments/new`;

    const body = {
      comment_markdown: commentMarkdown,
      entity_token: entityToken,
      entity_type: entityType,
      uuid_idempotency_token: uuidIdempotencyToken,
    };

    return this.post<
      {
        comment_markdown: string;
        entity_token: string;
        entity_type: string;
        uuid_idempotency_token: string;
      },
      {
        success?: boolean;
        comment_token?: string;
        BadInput?: string;
      }
    >({ endpoint, body })
      .then((response) => ({
        success: response.success ?? false,
        data: response.comment_token,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public DeleteComment({
    commentToken,
  }: {
    commentToken: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/comments/delete/${commentToken}`;

    return this.post<
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

  public ListCommentsByEntity({
    entityType,
    entityToken,
  }: {
    entityType: string;
    entityToken: string;
  }): Promise<ApiResponse<string[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/comments/list/${entityType}/${entityToken}`;

    return this.get<{
      success: boolean;
      comments: string[];
    }>({ endpoint })
      .then((response) => ({
        success: true,
        data: response.comments,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }
}
