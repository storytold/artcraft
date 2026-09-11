import { ApiManager, ApiResponse } from "./ApiManager";

export class FeaturedItemsApi extends ApiManager {
  public CreateFeaturedItem({
    entityToken,
    entityType,
  }: {
    entityToken: string;
    entityType: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/featured_item/create`;

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
        BadInput?: string;
      }
    >({ endpoint, body })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public DeleteFeaturedItem({
    entityToken,
    entityType,
  }: {
    entityToken: string;
    entityType: string;
  }): Promise<ApiResponse<undefined>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/featured_item/delete`;

    const body = {
      entity_token: entityToken,
      entity_type: entityType,
    };

    return this.delete<
      {
        entity_token: string;
        entity_type: string;
      },
      {
        success?: boolean;
        BadInput?: string;
      }
    >({ endpoint, body })
      .then((response) => ({
        success: response.success ?? false,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public CheckFeaturedItem({
    entityType,
    entityToken,
  }: {
    entityType: string;
    entityToken: string;
  }): Promise<ApiResponse<boolean>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/featured_item/is_featured/${entityType}/${entityToken}`;

    return this.post<
      undefined,
      {
        success?: boolean;
        is_featured?: boolean;
        BadInput?: string;
      }
    >({ endpoint })
      .then((response) => ({
        success: response.success ?? false,
        data: response.is_featured,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }
}
