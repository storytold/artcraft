import { ApiManager, ApiResponse } from "./ApiManager.js";

export interface UserRating {
  entity_token: string;
  entity_type: string;
  rating_value: string;
}

export class UserRatingApi extends ApiManager {
  public ListUserRatings(): Promise<ApiResponse<UserRating[]>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_rating/batch`;

    return this.get<{
      success?: boolean;
      ratings?: UserRating[];
      BadInput?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success ?? false,
        data: response.ratings,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public PostUserRating({
    entityToken,
    entityType,
    ratingValue,
  }: {
    entityToken: string;
    entityType: string;
    ratingValue: string;
  }): Promise<ApiResponse<number>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_rating/rate`;

    const body = {
      entity_token: entityToken,
      entity_type: entityType,
      rating_value: ratingValue,
    };

    return this.post<
      {
        entity_token: string;
        entity_type: string;
        rating_value: string;
      },
      {
        success?: boolean;
        new_positive_rating_count_for_entity?: number;
        BadInput?: string;
      }
    >({ endpoint, body })
      .then((response) => ({
        success: response.success ?? false,
        data: response.new_positive_rating_count_for_entity,
        errorMessage: response.BadInput,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public ListUserRatingByEntity({
    entityType,
    entityToken,
  }: {
    entityType: string;
    entityToken: string;
  }): Promise<ApiResponse<string>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/user_rating/view/${entityType}/${entityToken}`;

    return this.get<{
      success?: boolean;
      maybe_rating_value?: string;
      BadInput?: string;
    }>({ endpoint })
      .then((response) => {
        return {
          success: response.success ?? false,
          data: response.maybe_rating_value,
          errorMessage: response.BadInput,
        };
      })
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }
}
