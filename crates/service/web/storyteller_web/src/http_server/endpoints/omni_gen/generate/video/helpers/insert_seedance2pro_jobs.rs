use log::{error, warn};

use enums::common::visibility::Visibility;
use mysql_queries::queries::generic_inference::seedance2pro::insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token::{
  insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token,
  InsertGenericInferenceForSeedance2ProWithAprioriJobTokenArgs,
};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::prompts::PromptToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

#[allow(clippy::too_many_arguments)]
pub async fn insert_seedance2pro_jobs(
  primary_order_id: &str,
  maybe_additional_order_ids: Option<&[String]>,
  apriori_job_token: &InferenceJobToken,
  idempotency_token: &str,
  maybe_wallet_ledger_entry_token: Option<&tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken>,
  user_token: &tokens::tokens::users::UserToken,
  maybe_avt_token: Option<&tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken>,
  maybe_prompt_token: Option<&PromptToken>,
  ip_address: &str,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
) -> Result<InferenceJobToken, AdvancedCommonWebError> {
  let fallback_ids = vec![primary_order_id.to_string()];
  let order_ids = maybe_additional_order_ids.unwrap_or(&fallback_ids);

  let mut all_job_tokens: Vec<InferenceJobToken> = Vec::with_capacity(order_ids.len());

  for (i, order_id) in order_ids.iter().enumerate() {
    let job_token = if i == 0 { apriori_job_token.clone() } else { InferenceJobToken::generate() };
    let idempotency_str = if i == 0 { idempotency_token.to_string() } else { format!("{}-batch-{}", idempotency_token, i) };

    let db_result = insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token(
      InsertGenericInferenceForSeedance2ProWithAprioriJobTokenArgs {
        apriori_job_token: &job_token,
        uuid_idempotency_token: &idempotency_str,
        maybe_external_third_party_id: order_id,
        maybe_inference_args: None,
        maybe_prompt_token,
        maybe_wallet_ledger_entry_token,
        maybe_creator_user_token: Some(user_token),
        maybe_avt_token,
        creator_ip_address: ip_address,
        creator_set_visibility: Visibility::Public,
        mysql_executor: &mut **transaction,
        phantom: Default::default(),
      }
    ).await;

    match db_result {
      Ok(token) => all_job_tokens.push(token),
      Err(err) => {
        warn!("Error inserting seedance2pro inference job (order_id={}): {:?}", order_id, err);
        if i == 0 { return Err(AdvancedCommonWebError::from_error(err)); }
      }
    }
  }

  all_job_tokens.first().cloned().ok_or_else(|| {
    error!("No inference job token was created");
    AdvancedCommonWebError::server_error_with_message("No inference job token was created")
  })
}
