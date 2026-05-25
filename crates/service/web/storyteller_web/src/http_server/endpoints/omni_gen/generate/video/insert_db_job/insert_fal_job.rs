use log::warn;

use enums::common::visibility::Visibility;
use mysql_queries::queries::generic_inference::api_providers::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::api_providers::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{
  insert_generic_inference_job_for_fal_queue_with_apriori_job_token,
  InsertGenericInferenceForFalWithAprioriJobTokenArgs,
};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;

use super::shared_job_args::SharedJobArgs;

pub struct InsertFalJobArgs<'a, 'tx> {
  pub external_job_id: &'a str,
  pub shared: SharedJobArgs<'a, 'tx>,
}

pub async fn insert_fal_job(args: InsertFalJobArgs<'_, '_>) -> Result<InferenceJobToken, CommonWebError> {
  let InsertFalJobArgs { 
    external_job_id,
    shared,
  } = args;

  let db_result = insert_generic_inference_job_for_fal_queue_with_apriori_job_token(
    InsertGenericInferenceForFalWithAprioriJobTokenArgs {
      apriori_job_token: shared.apriori_job_token,
      uuid_idempotency_token: shared.idempotency_token,
      maybe_external_third_party_id: external_job_id,
      fal_category: FalCategory::VideoGeneration,
      maybe_model_type: shared.maybe_model_type,
      maybe_prompt_token: shared.maybe_prompt_token,
      maybe_creator_user_token: Some(shared.user_token),
      maybe_avt_token: shared.maybe_avt_token,
      creator_ip_address: shared.ip_address,
      creator_set_visibility: Visibility::Public,
      maybe_debug_log_event_token: shared.maybe_debug_log_event_token,
      mysql_executor: &mut **shared.transaction,
      maybe_inference_args: None,
      starting_job_status_override: None,
      maybe_frontend_failure_category: None,
      maybe_failure_reason: None,
      phantom: Default::default(),
    }
  ).await;

  match db_result {
    Ok(token) => Ok(token),
    Err(err) => {
      warn!("Error inserting fal inference job: {:?}", err);
      Err(CommonWebError::from_error(err))
    }
  }
}
