// ----- Environment Variable Names -----

const ENV_ENABLE_PAGING: &str = "ENABLE_PAGING";
const ENV_ENABLE_PAGING_FOR_500S: &str = "ENABLE_PAGING_FOR_500S";
const ENV_ROOTLY_API_KEY: &str = "ROOTLY_API_KEY";
const ENV_ROOTLY_NOTIFICATION_TARGET_TYPE: &str = "ROOTLY_NOTIFICATION_TARGET_TYPE";
const ENV_ROOTLY_NOTIFICATION_TARGET_ID: &str = "ROOTLY_NOTIFICATION_TARGET_ID";

// ----- Read Environment Variables -----

pub fn env_enable_paging_default_false() -> bool {
  easyenv::get_env_bool_or_default(ENV_ENABLE_PAGING, false)
}

pub fn env_enable_paging_for_500s_default_false() -> bool {
  easyenv::get_env_bool_or_default(ENV_ENABLE_PAGING_FOR_500S, false)
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
