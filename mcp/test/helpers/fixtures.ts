import { fixture } from "./contract";

/** Spec-validated upstream fixtures shared across suites. */

export const SIGNED_SESSION =
  "eyJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX3Rva2VuIjoic2Vzc2lvbl90ZXN0In0.c2lnbmF0dXJl";

export const SESSION_USER = {
  core_info: {
    user_token: "user_localdev1",
    username: "localdev1",
    display_name: "Local Dev",
    gravatar_hash: "0".repeat(32),
    default_avatar: { color_index: 0, image_index: 0 },
  },
  user_token: "user_localdev1",
  username: "localdev1",
  display_name: "Local Dev",
  email_gravatar_hash: "0".repeat(32),
  onboarding: {
    email_not_set: false,
    email_not_confirmed: true,
    password_not_set: false,
    username_not_customized: false,
  },
  can_access_studio: false,
  maybe_feature_flags: ["api_key", "upload_3d"],
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

export const SESSION_OK = fixture("SessionInfoSuccessResponse", {
  success: true,
  logged_in: true,
  user: SESSION_USER,
});

export const SESSION_ANONYMOUS = fixture("SessionInfoSuccessResponse", {
  success: true,
  logged_in: false,
  user: null,
});
