use log::warn;

use enums::common::visibility::Visibility;
use mysql_queries::queries::generic_inference::api_providers::kinovi_web::insert_generic_inference_job_for_kinovi_web_queue_with_apriori_job_token::{
  insert_generic_inference_job_for_kinovi_web_queue_with_apriori_job_token,
  InsertGenericInferenceForKinoviWebWithAprioriJobTokenArgs,
  KinoviVersion,
};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_gen::generate::video::insert_db_job::shared_job_args::SharedJobArgs;

pub struct InsertKinoviWebJobArgs<'a, 'tx> {
  pub order_id: &'a str,
  pub maybe_wallet_ledger_entry_token: Option<&'a WalletLedgerEntryToken>,
  pub kinovi_version: KinoviVersion,
  pub shared: SharedJobArgs<'a, 'tx>,
}

pub async fn insert_kinovi_web_job(args: InsertKinoviWebJobArgs<'_, '_>) -> Result<InferenceJobToken, CommonWebError> {
  let InsertKinoviWebJobArgs {
    order_id,
    maybe_wallet_ledger_entry_token,
    kinovi_version,
    shared,
  } = args;

  let db_result = insert_generic_inference_job_for_kinovi_web_queue_with_apriori_job_token(
    InsertGenericInferenceForKinoviWebWithAprioriJobTokenArgs {
      kinovi_version,
      apriori_job_token: shared.apriori_job_token,
      uuid_idempotency_token: shared.idempotency_token,
      maybe_external_third_party_id: order_id,
      maybe_model_type: shared.maybe_model_type,
      maybe_prompt_token: shared.maybe_prompt_token,
      maybe_wallet_ledger_entry_token,
      maybe_creator_user_token: Some(shared.user_token),
      maybe_avt_token: shared.maybe_avt_token,
      creator_ip_address: shared.ip_address,
      creator_set_visibility: Visibility::Public,
      maybe_platform_type: shared.maybe_platform_type,
      maybe_cost_estimates: shared.maybe_cost_estimates,
      maybe_debug_log_event_token: shared.maybe_debug_log_event_token,
      mysql_executor: &mut **shared.transaction,
      maybe_inference_args: None,
      phantom: Default::default(),
    }
  ).await;

  match db_result {
    Ok(token) => Ok(token),
    Err(err) => {
      warn!("Error inserting kinovi_web audio inference job (order_id={}): {:?}", order_id, err);
      Err(CommonWebError::from_error(err))
    }
  }
}
