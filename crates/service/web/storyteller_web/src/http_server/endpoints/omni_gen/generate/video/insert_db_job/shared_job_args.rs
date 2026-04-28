use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

pub struct SharedJobArgs<'a, 'tx> {
  pub apriori_job_token: &'a InferenceJobToken,
  pub idempotency_token: &'a str,
  pub user_token: &'a UserToken,
  pub maybe_avt_token: Option<&'a AnonymousVisitorTrackingToken>,
  pub maybe_prompt_token: Option<&'a PromptToken>,
  pub ip_address: &'a str,
  pub transaction: &'a mut sqlx::Transaction<'tx, sqlx::MySql>,
}
