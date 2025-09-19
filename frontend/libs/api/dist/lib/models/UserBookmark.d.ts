export interface UserBookmarkBatch {
    entity_token: string;
    entity_type: string;
    is_bookmarked: boolean;
    maybe_bookmark_token: string;
}
interface DefaultAvatar {
    color_index: number;
    image_index: number;
}
interface User {
    default_avatar: DefaultAvatar;
    display_name: string;
    gravatar_hash: string;
    user_token: string;
    username: string;
}
export interface UserBookmarkByEntity {
    created_at: string;
    token: string;
    updated_at: string;
    user: User;
}
interface DefaultAvatar {
    color_index: number;
    image_index: number;
}
interface Creator {
    default_avatar: DefaultAvatar;
    display_name: string;
    gravatar_hash: string;
    user_token: string;
    username: string;
}
interface MediaFileData {
    maybe_creator: Creator;
    media_type: string;
    public_bucket_path: string;
}
interface WeightData {
    maybe_cover_image_public_bucket_path: string;
    maybe_creator: Creator;
    title: string;
    weight_category: string;
    weight_type: string;
}
interface Stats {
    bookmark_count: number;
    positive_rating_count: number;
}
interface Details {
    entity_token: string;
    entity_type: string;
    maybe_media_file_data?: MediaFileData;
    maybe_summary_text?: string;
    maybe_thumbnail_url?: string;
    maybe_weight_data?: WeightData;
    stats: Stats;
}
export interface UserBookmarkByUser {
    created_at: string;
    details: Details;
    token: string;
    updated_at: string;
}
export {};
//# sourceMappingURL=UserBookmark.d.ts.map