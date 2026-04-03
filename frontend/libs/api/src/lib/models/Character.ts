export interface MediaFileLinks {
  cdn_url: string;
  maybe_thumbnail_template?: string | null;
  maybe_video_previews?: {
    cdn_url: string;
    maybe_thumbnail_template?: string | null;
  } | null;
}

export interface Character {
  token: string;
  name: string;
  maybe_description?: string | null;
  maybe_avatar?: MediaFileLinks | null;
  maybe_full_image?: MediaFileLinks | null;
  models: string[];
  is_user_created?: boolean;
}
