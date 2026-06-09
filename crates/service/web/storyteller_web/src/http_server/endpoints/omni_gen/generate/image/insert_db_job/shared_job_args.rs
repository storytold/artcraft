use enums::common::generation::common_model_type::CommonModelType;
use enums::common::platform_type::PlatformType;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

/// Fields every image-side `insert_*_job` helper needs.
/// Parallels `omni_gen::generate::video::insert_db_job::shared_job_args::SharedJobArgs`.
pub struct SharedJobArgs<'a, 'tx> {
  pub apriori_job_token: &'a InferenceJobToken,
  pub idempotency_token: &'a str,
  pub user_token: &'a UserToken,
  pub maybe_avt_token: Option<&'a AnonymousVisitorTrackingToken>,
  pub maybe_prompt_token: Option<&'a PromptToken>,
  pub maybe_debug_log_event_token: Option<&'a DebugLogEventToken>,
  pub maybe_model_type: Option<CommonModelType>,
  pub maybe_platform_type: Option<PlatformType>,
  pub ip_address: &'a str,
  pub transaction: &'a mut sqlx::Transaction<'tx, sqlx::MySql>,
}
