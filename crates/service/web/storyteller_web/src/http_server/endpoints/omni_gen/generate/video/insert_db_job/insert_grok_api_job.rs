use log::warn;

use mysql_queries::queries::generic_inference::api_providers::grok_api::insert_generic_inference_job_for_grok_api::{
  insert_generic_inference_job_for_grok_api, InsertGrokApiInferenceJobArgs,
};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;

use super::shared_job_args::SharedJobArgs;

pub struct InsertGrokApiJobArgs<'a, 'tx> {
  pub external_request_id: &'a str,
  pub shared: SharedJobArgs<'a, 'tx>,
}

pub async fn insert_grok_api_job(args: InsertGrokApiJobArgs<'_, '_>) -> Result<InferenceJobToken, CommonWebError> {
  let InsertGrokApiJobArgs {
    external_request_id,
    shared,
  } = args;

  let db_result = insert_generic_inference_job_for_grok_api(
    InsertGrokApiInferenceJobArgs {
      apriori_job_token: shared.apriori_job_token,
      uuid_idempotency_token: shared.idempotency_token,
      external_request_id,
      maybe_model_type: shared.maybe_model_type,
      maybe_prompt_token: shared.maybe_prompt_token,
      maybe_creator_user_token: Some(shared.user_token),
      maybe_avt_token: shared.maybe_avt_token,
      creator_ip_address: shared.ip_address,
      maybe_platform_type: shared.maybe_platform_type,
      maybe_debug_log_event_token: shared.maybe_debug_log_event_token,
      mysql_executor: &mut **shared.transaction,
      phantom: Default::default(),
    }
  ).await;

  match db_result {
    Ok(token) => Ok(token),
    Err(err) => {
      warn!("Error inserting Grok (xAI) API inference job: {:?}", err);
      Err(CommonWebError::from_error(err))
    }
  }
}
