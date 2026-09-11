export interface ZsDataset {
  created_at: string; // ISO 8601 date-time string
  creator: UserDetailsLight;
  creator_set_visibility: string; // Enum or specific string values
  dataset_token: string;
  ietf_language_tag: string;
  ietf_primary_language_subtag: string;
  title: string;
  updated_at: string; // ISO 8601 date-time string
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
