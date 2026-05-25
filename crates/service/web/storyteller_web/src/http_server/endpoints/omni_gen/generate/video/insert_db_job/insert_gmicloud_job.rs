use log::warn;

use mysql_queries::queries::generic_inference::api_providers::gmicloud::insert_generic_inference_job_for_gmicloud::{
  insert_generic_inference_job_for_gmicloud, InsertGmiCloudInferenceJobArgs,
};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;

use super::shared_job_args::SharedJobArgs;

pub struct InsertGmiCloudJobArgs<'a, 'tx> {
  pub external_request_id: &'a str,
  pub shared: SharedJobArgs<'a, 'tx>,
}

pub async fn insert_gmicloud_job(args: InsertGmiCloudJobArgs<'_, '_>) -> Result<InferenceJobToken, CommonWebError> {
  let InsertGmiCloudJobArgs {
    external_request_id,
    shared,
  } = args;

  let db_result = insert_generic_inference_job_for_gmicloud(
    InsertGmiCloudInferenceJobArgs {
      apriori_job_token: shared.apriori_job_token,
      uuid_idempotency_token: shared.idempotency_token,
      external_request_id,
      maybe_model_type: shared.maybe_model_type,
      maybe_prompt_token: shared.maybe_prompt_token,
      maybe_creator_user_token: Some(shared.user_token),
      maybe_avt_token: shared.maybe_avt_token,
      creator_ip_address: shared.ip_address,
      maybe_debug_log_event_token: shared.maybe_debug_log_event_token,
      mysql_executor: &mut **shared.transaction,
      phantom: Default::default(),
    }
  ).await;

  match db_result {
    Ok(token) => Ok(token),
    Err(err) => {
      warn!("Error inserting GmiCloud inference job: {:?}", err);
      Err(CommonWebError::from_error(err))
    }
  }
}
