use log::warn;

use enums::common::visibility::Visibility;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{
  insert_generic_inference_job_for_fal_queue_with_apriori_job_token,
  InsertGenericInferenceForFalWithAprioriJobTokenArgs,
};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

#[allow(clippy::too_many_arguments)]
pub async fn insert_fal_job(
  external_job_id: &str,
  apriori_job_token: &InferenceJobToken,
  idempotency_token: &str,
  user_token: &tokens::tokens::users::UserToken,
  maybe_avt_token: Option<&tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken>,
  ip_address: &str,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
) -> Result<InferenceJobToken, AdvancedCommonWebError> {
  let db_result = insert_generic_inference_job_for_fal_queue_with_apriori_job_token(
    InsertGenericInferenceForFalWithAprioriJobTokenArgs {
      apriori_job_token,
      uuid_idempotency_token: idempotency_token,
      maybe_external_third_party_id: external_job_id,
      fal_category: FalCategory::VideoGeneration,
      maybe_inference_args: None,
      maybe_prompt_token: None,
      maybe_creator_user_token: Some(user_token),
      maybe_avt_token,
      creator_ip_address: ip_address,
      creator_set_visibility: Visibility::Public,
      mysql_executor: &mut **transaction,
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
      Err(AdvancedCommonWebError::from_error(err))
    }
  }
}
