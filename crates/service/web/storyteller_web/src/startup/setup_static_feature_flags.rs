use errors::AnyhowResult;

use crate::state::flags::paging_flags::PagingFlags;
use crate::state::server_state::StaticFeatureFlags;

pub fn setup_static_feature_flags(paging_flags: PagingFlags) -> AnyhowResult<StaticFeatureFlags> {
  Ok(StaticFeatureFlags {
    // Permanent (control plane / safety) flags : messaging
    maybe_status_alert_category: easyenv::get_env_string_optional("FF_STATUS_ALERT_CATEGORY"),
    maybe_status_alert_custom_message: easyenv::get_env_string_optional("FF_STATUS_ALERT_CUSTOM_MESSAGE"),

    // Permanent (control plane / safety) flags : disabling features
    global_429_pushback_filter_enabled: easyenv::get_env_bool_or_default("FF_GLOBAL_429_PUSHBACK_FILTER_ENABLED", false),
    disable_unified_queue_stats_endpoint: easyenv::get_env_bool_or_default("FF_DISABLE_QUEUE_STATS_ENDPOINT", false),
    disable_inference_queue_length_endpoint: easyenv::get_env_bool_or_default("FF_DISABLE_INFERENCE_QUEUE_LENGTH_ENDPOINT", false),
    disable_tts_queue_length_endpoint: easyenv::get_env_bool_or_default("FF_DISABLE_TTS_QUEUE_LENGTH_ENDPOINT", false),
    disable_tts_model_list_endpoint: easyenv::get_env_bool_or_default("FF_DISABLE_TTS_MODEL_LIST_ENDPOINT", false),
    disable_voice_conversion_model_list_endpoint: easyenv::get_env_bool_or_default("FF_DISABLE_VOICE_CONVERSION_MODEL_LIST_ENDPOINT", false),

    // Refresh rates
    frontend_unified_queue_stats_refresh_interval_millis: easyenv::get_env_num("FF_FRONTEND_QUEUE_STATS_REFRESH_INTERVAL_MILLIS", 15_000)?,
    frontend_pending_inference_refresh_interval_millis: easyenv::get_env_num("FF_FRONTEND_PENDING_INFERENCE_REFRESH_INTERVAL_MILLIS", 15_000)?,
    frontend_pending_tts_refresh_interval_millis: easyenv::get_env_num("FF_FRONTEND_PENDING_TTS_REFRESH_INTERVAL_MILLIS", 15_000)?,

    // Bans
    troll_ban_user_percent: easyenv::get_env_num("FF_TROLL_BANNED_USER_PERCENT", 0)?,

    // Temporary flags
    switch_tts_to_model_weights: easyenv::get_env_bool_or_default("FF_SWITCH_TTS_TO_MODEL_WEIGHTS", false),
    force_session_studio_flags: easyenv::get_env_bool_or_default("FF_FORCE_SESSION_STUDIO_FLAG", false),
    force_session_video_style_transfer_flags: easyenv::get_env_bool_or_default("FF_FORCE_SESSION_VST_FLAG", false),

    // Disable voice features
    disable_tts: easyenv::get_env_bool_or_default("DISABLE_TTS", false),
    disable_voice_conversion: easyenv::get_env_bool_or_default("DISABLE_VOICE_CONVERSION", false),

    // Paging
    paging: paging_flags,
  })
}
