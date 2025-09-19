import { ApiManager, ApiResponse } from './ApiManager.js';
export interface UserRating {
    entity_token: string;
    entity_type: string;
    rating_value: string;
}
export declare class UserRatingApi extends ApiManager {
    ListUserRatings(): Promise<ApiResponse<UserRating[]>>;
    PostUserRating({ entityToken, entityType, ratingValue, }: {
        entityToken: string;
        entityType: string;
        ratingValue: string;
    }): Promise<ApiResponse<number>>;
    ListUserRatingByEntity({ entityType, entityToken, }: {
        entityType: string;
        entityToken: string;
    }): Promise<ApiResponse<string>>;
}
//# sourceMappingURL=UserRatingsApi.d.ts.map