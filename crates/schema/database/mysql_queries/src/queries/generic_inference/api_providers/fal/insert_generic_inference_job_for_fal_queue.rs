use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::common::generation::common_model_type::CommonModelType;
use enums::common::platform_type::PlatformType;
use enums::common::visibility::Visibility;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::errors::database_query_error::DatabaseQueryError;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;
use crate::queries::generic_inference::api_providers::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{insert_generic_inference_job_for_fal_queue_with_apriori_job_token, InsertGenericInferenceForFalWithAprioriJobTokenArgs};

#[derive(Debug, Clone, Copy)]
pub enum FalCategory {
  ImageGeneration,
  VideoGeneration,
  BackgroundRemoval,
  ObjectGeneration,
}

pub struct InsertGenericInferenceForFalArgs<'e, 'c, E> 
  where E: 'e + Executor<'c, Database = MySql>
{
  pub uuid_idempotency_token: &'e str,

  /// The external primary key identifier for the job.
  pub maybe_external_third_party_id: &'e str,
  
  pub fal_category: FalCategory,

  pub maybe_model_type: Option<CommonModelType>,

  pub maybe_inference_args: Option<GenericInferenceArgs>,
  
  pub maybe_prompt_token: Option<&'e PromptToken>,

  pub maybe_creator_user_token: Option<&'e UserToken>,
  pub maybe_avt_token: Option<&'e AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'e str,
  pub creator_set_visibility: Visibility,

  /// The platform the enqueuing request came from, inferred from its User-Agent.
  pub maybe_platform_type: Option<PlatformType>,

  pub mysql_executor: E,
  
  // TODO: Not sure if this works to tell the compiler we need the lifetime annotation.
  //  See: https://doc.rust-lang.org/std/marker/struct.PhantomData.html#unused-lifetime-parameters
  pub phantom: PhantomData<&'c E>,
}

pub async fn insert_generic_inference_job_for_fal_queue<'e, 'c : 'e, E>(args: InsertGenericInferenceForFalArgs<'e, 'c, E>)
  -> Result<InferenceJobToken, DatabaseQueryError>
  where E: 'e + Executor<'c, Database = MySql>
{
  let job_token = InferenceJobToken::generate();

  insert_generic_inference_job_for_fal_queue_with_apriori_job_token(InsertGenericInferenceForFalWithAprioriJobTokenArgs {
    uuid_idempotency_token: args.uuid_idempotency_token,
    apriori_job_token: &job_token,
    maybe_external_third_party_id: args.maybe_external_third_party_id,
    fal_category: args.fal_category,
    maybe_model_type: args.maybe_model_type,
    maybe_inference_args: args.maybe_inference_args,
    maybe_prompt_token: args.maybe_prompt_token,
    maybe_creator_user_token: args.maybe_creator_user_token,
    maybe_avt_token: args.maybe_avt_token,
    creator_ip_address: args.creator_ip_address,
    creator_set_visibility: args.creator_set_visibility,
    maybe_platform_type: args.maybe_platform_type,
    starting_job_status_override: None,
    maybe_frontend_failure_category: None,
    maybe_failure_reason: None,
    maybe_debug_log_event_token: None,
    mysql_executor: args.mysql_executor,
    phantom: args.phantom,
  }).await
}
