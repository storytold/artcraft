interface CoverImage {
    default_cover: {
        color_index: number;
        image_index: number;
    };
    maybe_cover_image_public_bucket_path: string;
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
interface Stats {
    bookmark_count: number;
    positive_rating_count: number;
}
export interface Weight {
    cover_image: CoverImage;
    created_at: string;
    creator: Creator;
    creator_set_visibility: string;
    file_checksum_sha2: string;
    file_size_bytes: number;
    stats: Stats;
    title: string;
    updated_at: string;
    weight_category: string;
    weight_token: string;
    weight_type: string;
}
export {};
//# sourceMappingURL=Weight.d.ts.map