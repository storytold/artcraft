use anyhow::anyhow;
use log::info;
use sqlx::MySqlPool;
use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
use enums::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::common::job_status_plus::JobStatusPlus;
use enums::common::visibility::Visibility;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::errors::database_query_error::DatabaseQueryError;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;
use crate::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;


pub struct InsertGenericInferenceForFalWithAprioriJobTokenArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  pub uuid_idempotency_token: &'e str,

  // NOTE: We'll generate this ahead of time so we can save it with billing info!
  pub apriori_job_token: &'e InferenceJobToken,

  /// The external primary key identifier for the job.
  pub maybe_external_third_party_id: &'e str,

  pub fal_category: FalCategory,

  pub maybe_inference_args: Option<GenericInferenceArgs>,

  pub maybe_prompt_token: Option<&'e PromptToken>,

  pub maybe_creator_user_token: Option<&'e UserToken>,
  pub maybe_avt_token: Option<&'e AnonymousVisitorTrackingToken>,
  pub creator_ip_address: &'e str,
  pub creator_set_visibility: Visibility,

  /// Override the initial job status. Defaults to `Pending` when `None`.
  /// Set to `Some(JobStatusPlus::CompleteFailure)` for mock/test failure jobs.
  pub starting_job_status_override: Option<JobStatusPlus>,

  pub maybe_frontend_failure_category: Option<FrontendFailureCategory>,
  pub maybe_failure_reason: Option<&'e str>,

  pub mysql_executor: E,

  // TODO: Not sure if this works to tell the compiler we need the lifetime annotation.
  //  See: https://doc.rust-lang.org/std/marker/struct.PhantomData.html#unused-lifetime-parameters
  pub phantom: PhantomData<&'c E>,
}

pub async fn insert_generic_inference_job_for_fal_queue_with_apriori_job_token<'e, 'c : 'e, E>(args: InsertGenericInferenceForFalWithAprioriJobTokenArgs<'e, 'c, E>)
  -> Result<InferenceJobToken, DatabaseQueryError>
  where E: 'e + Executor<'c, Database = MySql>
{

  let serialized_args_payload = serde_json::ser::to_string(&args.maybe_inference_args)
      .map_err(|_e| anyhow!("could not encode inference args"))?;

  const JOB_TYPE : InferenceJobType = InferenceJobType::FalQueue;

  let (inference_category, product_category) =
      match args.fal_category {
        FalCategory::ImageGeneration => (
          InferenceCategory::ImageGeneration,
          InferenceJobProductCategory::FalImage
        ),
        FalCategory::VideoGeneration => (
          InferenceCategory::VideoGeneration,
          InferenceJobProductCategory::FalVideo
        ),
        FalCategory::BackgroundRemoval => (
          InferenceCategory::BackgroundRemoval,
          InferenceJobProductCategory::FalBgRemoval
        ),
        FalCategory::ObjectGeneration => (
          InferenceCategory::ObjectGeneration,
          InferenceJobProductCategory::FalObject,
        ),
      };

  let maybe_external_third_party = InferenceJobExternalThirdParty::Fal;

  let status = args.starting_job_status_override.unwrap_or(JobStatusPlus::Pending);

  let maybe_frontend_failure_category_str = args.maybe_frontend_failure_category
      .map(|c| c.to_str());

  let maybe_truncated_failure_reason = args.maybe_failure_reason
      .map(|s| if s.len() > 255 { &s[..255] } else { s });

  let query = sqlx::query!(
        r#"
INSERT INTO generic_inference_jobs
SET
  token = ?,
  uuid_idempotency_token = ?,

  job_type = ?,

  maybe_external_third_party = ?,
  maybe_external_third_party_id = ?,

  product_category = ?,
  inference_category = ?,

  maybe_model_type = NULL,
  maybe_model_token = NULL,

  maybe_input_source_token = NULL,
  maybe_input_source_token_type = NULL,

  maybe_download_url = NULL,
  maybe_cover_image_media_file_token = NULL,

  maybe_prompt_token = ?,

  maybe_raw_inference_text = NULL,

  maybe_inference_args = ?,

  maybe_creator_user_token = ?,
  maybe_creator_anonymous_visitor_token = ?,
  creator_ip_address = ?,
  creator_set_visibility = ?,

  priority_level = 0,
  is_keepalive_required = FALSE,
  max_duration_seconds = 0,

  is_debug_request = FALSE,
  maybe_routing_tag = NULL,

  frontend_failure_category = ?,
  failure_reason = ?,

  status = ?
        "#,
        args.apriori_job_token.as_str(),
        args.uuid_idempotency_token,

        JOB_TYPE.to_str(),

        maybe_external_third_party.to_str(),
        args.maybe_external_third_party_id,

        product_category.to_str(),
        inference_category.to_str(),

        args.maybe_prompt_token.map(|t| t.to_string()),

        serialized_args_payload,

        args.maybe_creator_user_token.map(|t| t.to_string()),
        args.maybe_avt_token.map(|t| t.to_string()),
        args.creator_ip_address,
        args.creator_set_visibility.to_str(),

        maybe_frontend_failure_category_str,
        maybe_truncated_failure_reason,

        status.to_str(),
    );

  let query_result = query.execute(args.mysql_executor)
      .await;

  let record_id = match query_result {
    Err(err) => return Err(DatabaseQueryError::from(err)),
    Ok(res) => res.last_insert_id(),
  };

  info!("Insert generic inference job for FAL queue: {} with record ID {}", args.apriori_job_token, record_id);

  Ok(args.apriori_job_token.clone())
}
