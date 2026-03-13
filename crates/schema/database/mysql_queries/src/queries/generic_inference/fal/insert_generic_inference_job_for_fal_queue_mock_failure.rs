use idempotency::uuid::generate_random_uuid;
use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::visibility::Visibility;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::errors::database_query_error::DatabaseQueryError;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;
use crate::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use crate::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{
  insert_generic_inference_job_for_fal_queue_with_apriori_job_token,
  InsertGenericInferenceForFalWithAprioriJobTokenArgs,
};

/// Same as [`InsertGenericInferenceForFalArgs`] but without `maybe_external_third_party_id`,
/// since no external Fal call was made. The inserted job will have status
/// [`JobStatusPlus::CompleteFailure`] immediately, making it a synthetic failed job useful
/// for testing error-handling paths on the frontend without touching real inference services.
pub struct InsertGenericInferenceForFalMockFailureArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub uuid_idempotency_token: &'e str,

  pub fal_category: FalCategory,

  pub maybe_inference_args: Option<GenericInferenceArgs>,

  pub maybe_prompt_token: Option<&'e PromptToken>,

  pub maybe_creator_user_token: Option<&'e UserToken>,
  pub maybe_avt_token: Option<&'e AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'e str,
  pub creator_set_visibility: Visibility,

  pub maybe_frontend_failure_category: Option<FrontendFailureCategory>,
  pub maybe_failure_reason: Option<&'e str>,

  pub mysql_executor: E,

  pub phantom: PhantomData<&'c E>,
}

pub async fn insert_generic_inference_job_for_fal_queue_mock_failure<'e, 'c: 'e, E>(
  args: InsertGenericInferenceForFalMockFailureArgs<'e, 'c, E>,
) -> Result<InferenceJobToken, DatabaseQueryError>
  where E: 'e + Executor<'c, Database = MySql>
{
  let job_token = InferenceJobToken::generate();
  let synthetic_external_id = format!("synthetic_{}", generate_random_uuid());

  let inner_args = InsertGenericInferenceForFalWithAprioriJobTokenArgs {
    uuid_idempotency_token: args.uuid_idempotency_token,
    apriori_job_token: &job_token,
    maybe_external_third_party_id: &synthetic_external_id,
    fal_category: args.fal_category,
    maybe_inference_args: args.maybe_inference_args,
    maybe_prompt_token: args.maybe_prompt_token,
    maybe_creator_user_token: args.maybe_creator_user_token,
    maybe_avt_token: args.maybe_avt_token,
    creator_ip_address: args.creator_ip_address,
    creator_set_visibility: args.creator_set_visibility,
    starting_job_status_override: Some(JobStatusPlus::CompleteFailure),
    maybe_frontend_failure_category: args.maybe_frontend_failure_category,
    maybe_failure_reason: args.maybe_failure_reason,
    mysql_executor: args.mysql_executor,
    phantom: args.phantom,
  };

  insert_generic_inference_job_for_fal_queue_with_apriori_job_token(inner_args).await
}
