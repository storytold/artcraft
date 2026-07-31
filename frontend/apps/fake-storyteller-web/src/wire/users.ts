/**
 * User response builders.
 *
 * `GET /v1/session` is the single most load-bearing response in the app — most
 * of the UI keys off it — so the full permission block is reproduced rather
 * than trimmed to the fields currently read.
 */

import type { UserRecord } from "../state/entities.ts";

export function sessionUserPayload(user: UserRecord): object {
  return {
    core_info: coreInfoPayload(user),
    user_token: user.userToken,
    username: user.username,
    display_name: user.displayName,
    email_gravatar_hash: user.gravatarHash,
    onboarding: {
      email_not_set: false,
      email_not_confirmed: false,
      password_not_set: false,
      username_not_customized: false,
    },
    can_access_studio: user.featureFlags.includes("studio"),
    maybe_feature_flags: user.featureFlags,
    fakeyou_plan: "free",
    storyteller_stream_plan: "free",
    can_use_tts: true,
    can_use_w2l: true,
    can_delete_own_tts_results: true,
    can_delete_own_w2l_results: true,
    can_delete_own_account: true,
    can_upload_tts_models: true,
    can_upload_w2l_templates: true,
    can_delete_own_tts_models: true,
    can_delete_own_w2l_templates: true,
    can_approve_w2l_templates: false,
    can_edit_other_users_profiles: false,
    can_edit_other_users_tts_models: false,
    can_edit_other_users_w2l_templates: false,
    can_delete_other_users_tts_models: false,
    can_delete_other_users_tts_results: false,
    can_delete_other_users_w2l_templates: false,
    can_delete_other_users_w2l_results: false,
    can_ban_users: false,
    can_delete_users: false,
  };
}

export function coreInfoPayload(user: UserRecord): object {
  return {
    user_token: user.userToken,
    username: user.username,
    display_name: user.displayName,
    gravatar_hash: user.gravatarHash,
    default_avatar: user.defaultAvatar,
  };
}

/** `GET /v1/user/:username/profile`. */
export function userProfilePayload(user: UserRecord): object {
  return {
    user_token: user.userToken,
    core_info: coreInfoPayload(user),
    username: user.username,
    display_name: user.displayName,
    email_gravatar_hash: user.gravatarHash,
    default_avatar_index: user.defaultAvatar.image_index,
    default_avatar_color_index: user.defaultAvatar.color_index,
    profile_markdown: "",
    profile_rendered_html: "",
    user_role_slug: "user",
    disable_gravatar: false,
    preferred_tts_result_visibility: "public",
    preferred_w2l_result_visibility: "public",
    discord_username: null,
    twitch_username: null,
    twitter_username: null,
    patreon_username: null,
    github_username: null,
    cashapp_username: null,
    website_url: null,
    badges: [],
    created_at: user.createdAt,
    maybe_moderator_fields: null,
  };
}
