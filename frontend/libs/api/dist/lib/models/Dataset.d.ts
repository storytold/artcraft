export interface ZsDataset {
    created_at: string;
    creator: UserDetailsLight;
    creator_set_visibility: string;
    dataset_token: string;
    ietf_language_tag: string;
    ietf_primary_language_subtag: string;
    title: string;
    updated_at: string;
}
interface UserDetailsLight {
    default_avatar: UserDefaultAvatarInfo;
    display_name: string;
    gravatar_hash: string;
    user_token: string;
    username: string;
}
interface UserDefaultAvatarInfo {
    color_index: number;
    image_index: number;
}
export {};
//# sourceMappingURL=Dataset.d.ts.map