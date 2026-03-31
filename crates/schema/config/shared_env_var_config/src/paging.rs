const ENV_ENABLE_PAGING: &str = "ENABLE_PAGING";
const ENV_ROOTLY_API_KEY: &str = "ROOTLY_API_KEY";
const ENV_ROOTLY_NOTIFICATION_TARGET_TYPE: &str = "ROOTLY_NOTIFICATION_TARGET_TYPE";
const ENV_ROOTLY_NOTIFICATION_TARGET_ID: &str = "ROOTLY_NOTIFICATION_TARGET_ID";

pub fn env_enable_paging_default_false() -> bool {
  easyenv::get_env_bool_or_default(ENV_ENABLE_PAGING, false)
}

pub fn env_optional_rootly_api_key() -> Option<String> {
  easyenv::get_env_string_optional(ENV_ROOTLY_API_KEY)
}

pub fn env_optional_rootly_notification_target_type() -> Option<String> {
  easyenv::get_env_string_optional(ENV_ROOTLY_NOTIFICATION_TARGET_TYPE)
}

pub fn env_optional_rootly_notification_target_id() -> Option<String> {
  easyenv::get_env_string_optional(ENV_ROOTLY_NOTIFICATION_TARGET_ID)
}
