//! Enqueue flow for first-party Minimax H3 (Turbo / Ultra) video generation.
//!
//! These models run on our own GPU inference, so unlike the provider-backed
//! models there is no external generation call: we bill (Ultra only), write
//! the prompt + job records, and return. A scheduler will pick the pending
//! jobs up later.

use std::convert::TryFrom;

use actix_web::web::Json;
use log::{error, info};
use sqlx::Acquire;

use artcraft_api_defs::omni_api::generate_requests::omni_api_video_generate_request::OmniApiVideoGenerateRequest;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_video_generate_response::OmniGenVideoGenerateResponse;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::platform_type::PlatformType;
use enums::common::visibility::Visibility;
use mysql_queries::queries::generic_inference::first_party::minimax_h3::insert_generic_inference_job_for_first_party_minimax_h3_with_apriori_job_token::{
  insert_generic_inference_job_for_first_party_minimax_h3_with_apriori_job_token,
  FirstPartyMinimaxH3Model,
  InsertGenericInferenceForFirstPartyMinimaxH3WithAprioriJobTokenArgs,
};
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_api::generate::video::first_party_minimax_h3::minimax_h3_ultra_cost::estimate_minimax_h3_ultra_cost_usd_cents;
use crate::http_server::endpoints::omni_api::generate::video::helpers::bill_wallet::bill_wallet;
use crate::http_server::endpoints::omni_api::generate::video::helpers::write_prompt_records::{
  write_prompt_records, WritePromptRecordsArgs,
};

pub struct EnqueueFirstPartyMinimaxH3JobArgs<'a> {
  pub minimax_model: FirstPartyMinimaxH3Model,
  pub request: &'a OmniApiVideoGenerateRequest,
  pub user_token: &'a UserToken,
  pub maybe_prompt_model_type: Option<CommonModelType>,
  pub idempotency_token: &'a str,
  pub ip_address: &'a str,
  pub debug_log_event_token: &'a DebugLogEventToken,
  pub mysql_connection: sqlx::pool::PoolConnection<sqlx::MySql>,
}

/// Map the requested video model to a first-party Minimax H3 tier.
///
/// Returns `None` for every other model — including the bare `MinimaxH3`,
/// which stays on its existing third-party (Fal) route.
pub fn first_party_minimax_h3_model(
  maybe_model: Option<CommonVideoModel>,
) -> Option<FirstPartyMinimaxH3Model> {
  match maybe_model {
    Some(CommonVideoModel::MinimaxH3Turbo) => Some(FirstPartyMinimaxH3Model::Turbo),
    Some(CommonVideoModel::MinimaxH3Ultra) => Some(FirstPartyMinimaxH3Model::Ultra),
    _ => None,
  }
}

pub async fn enqueue_first_party_minimax_h3_job(
  args: EnqueueFirstPartyMinimaxH3JobArgs<'_>,
) -> Result<Json<OmniGenVideoGenerateResponse>, CommonWebError> {
  let EnqueueFirstPartyMinimaxH3JobArgs {
    minimax_model,
    request,
    user_token,
    maybe_prompt_model_type,
    idempotency_token,
    ip_address,
    debug_log_event_token,
    mut mysql_connection,
  } = args;

  // System credits = cents (same convention as the v2 pipeline).
  let maybe_system_cost_usd_cents: Option<u64> = match minimax_model {
    FirstPartyMinimaxH3Model::Turbo => {
      // Turbo is free: no wallet charge.
      // TODO: Gate free Turbo generations on how many jobs the user has
      //  already submitted. The count queries and checks land with the
      //  scheduler work.
      None
    }
    FirstPartyMinimaxH3Model::Ultra => {
      Some(estimate_minimax_h3_ultra_cost_usd_cents(request))
    }
  };

  info!("First-party Minimax H3 ({:?}) estimated cost: {:?} credits",
    minimax_model, maybe_system_cost_usd_cents);

  // Bill the wallet (no-op deduction for the free Turbo tier) and generate
  // the apriori job token.
  let billing = bill_wallet(
    user_token,
    maybe_system_cost_usd_cents.unwrap_or(0),
    &mut mysql_connection,
  ).await?;

  let mut transaction = mysql_connection.begin().await.map_err(|err| {
    error!("Error starting MySQL transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let prompt_token = write_prompt_records(WritePromptRecordsArgs {
    request,
    user_token,
    maybe_prompt_model_type,
    ip_address,
    transaction: &mut transaction,
  }).await;

  let maybe_system_cost_u32 = maybe_system_cost_usd_cents
    .and_then(|cents| u32::try_from(cents).ok());

  let job_token = insert_generic_inference_job_for_first_party_minimax_h3_with_apriori_job_token(
    InsertGenericInferenceForFirstPartyMinimaxH3WithAprioriJobTokenArgs {
      minimax_model,
      uuid_idempotency_token: idempotency_token,
      apriori_job_token: &billing.apriori_job_token,
      maybe_inference_args: None,
      maybe_prompt_token: prompt_token.as_ref(),
      maybe_wallet_ledger_entry_token: billing.maybe_wallet_ledger_entry_token.as_ref(),
      maybe_system_cost_credits: maybe_system_cost_u32,
      maybe_system_cost_usd_cents: maybe_system_cost_u32,
      maybe_creator_user_token: Some(user_token),
      maybe_avt_token: None, // AVT tokens are web-session only; API-key callers have none.
      creator_ip_address: ip_address,
      creator_set_visibility: Visibility::Public,
      // Omni API requests are always API-key authenticated.
      maybe_platform_type: Some(PlatformType::ApiKey),
      maybe_debug_log_event_token: Some(debug_log_event_token),
      mysql_executor: &mut *transaction,
      phantom: Default::default(),
    }
  ).await.map_err(|err| {
    error!("Error inserting first-party Minimax H3 job: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  transaction.commit().await.map_err(|err| {
    error!("Error committing transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(OmniGenVideoGenerateResponse {
    success: true,
    inference_job_token: job_token.clone(),
    all_job_tokens: vec![job_token],
  }))
}
