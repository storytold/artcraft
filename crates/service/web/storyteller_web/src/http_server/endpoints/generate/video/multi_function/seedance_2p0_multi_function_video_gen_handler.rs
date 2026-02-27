use std::sync::Arc;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use crate::util::lookup::lookup_image_urls_as_map::lookup_image_urls_as_map;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
  Seedance2p0AspectRatio, Seedance2p0BatchCount, Seedance2p0MultiFunctionVideoGenRequest,
  Seedance2p0MultiFunctionVideoGenResponse,
};
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::seedance2pro::insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token::{
  insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token,
  InsertGenericInferenceForSeedance2ProWithAprioriJobTokenArgs,
};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{
  insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem,
};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use mysql_queries::queries::wallets::refund::try_to_refund_ledger_entry::{try_to_refund_ledger_entry, WalletRefundOutcome};
use seedance2pro::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro::requests::generate_video::generate_video::{
  generate_video, BatchCount, GenerateVideoArgs, Resolution,
};
use seedance2pro::requests::prepare_image_upload::prepare_image_upload::{
  prepare_image_upload, PrepareImageUploadArgs,
};
use seedance2pro::requests::upload_image::upload_image::{upload_image, UploadImageArgs};
use sqlx::Acquire;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

/// Seedance 2.0 Multi-Function video generation (text-to-video, keyframe, and reference).
#[utoipa::path(
  post,
  tag = "Generate Video (Multi-Function)",
  path = "/v1/generate/video/multi_function/seedance_2p0",
  responses(
    (status = 200, description = "Success", body = Seedance2p0MultiFunctionVideoGenResponse),
  ),
  params(
    ("request" = Seedance2p0MultiFunctionVideoGenRequest, description = "Payload for Request"),
  )
)]
pub async fn seedance_2p0_multi_function_video_gen_handler(
  http_request: HttpRequest,
  request: Json<Seedance2p0MultiFunctionVideoGenRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<Seedance2p0MultiFunctionVideoGenResponse>, CommonWebError> {

  payments_error_test(&request.prompt.as_deref().unwrap_or(""))?;

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::ServerError
      })?;

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  let user_token = match maybe_user_session.as_ref() {
    Some(session) => &session.user_token,
    None => {
      return Err(CommonWebError::NotAuthorized);
    }
  };

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  // --- Collect all media tokens to look up ---

  let mut all_media_tokens = Vec::new();
  if let Some(token) = request.start_frame_media_token.as_ref() {
    all_media_tokens.push(token.clone());
  }
  if let Some(token) = request.end_frame_media_token.as_ref() {
    all_media_tokens.push(token.clone());
  }
  if let Some(tokens) = request.reference_image_media_tokens.as_ref() {
    all_media_tokens.extend(tokens.iter().cloned());
  }

  let image_urls_by_token = if all_media_tokens.is_empty() {
    std::collections::HashMap::new()
  } else {
    info!("Looking up image media tokens: {:?}", all_media_tokens);
    lookup_image_urls_as_map(
      &http_request,
      &mut mysql_connection,
      server_state.server_environment,
      &all_media_tokens,
    ).await?
  };

  // --- Insert idempotency token ---

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
      })?;

  // --- Build seedance2pro session ---

  let session = Seedance2ProSession::from_cookies_string(
    server_state.seedance2pro.cookies.clone()
  );

  // --- Upload images to seedance2pro CDN ---

  let start_frame_url = match request.start_frame_media_token.as_ref() {
    None => None,
    Some(token) => match image_urls_by_token.get(token) {
      None => return Err(CommonWebError::BadInputWithSimpleMessage("Start frame media not found.".to_string())),
      Some(url) => Some(upload_to_seedance2pro(&session, url).await?),
    }
  };

  let end_frame_url = match request.end_frame_media_token.as_ref() {
    None => None,
    Some(token) => match image_urls_by_token.get(token) {
      None => return Err(CommonWebError::BadInputWithSimpleMessage("End frame media not found.".to_string())),
      Some(url) => Some(upload_to_seedance2pro(&session, url).await?),
    }
  };

  let reference_image_urls: Option<Vec<String>> = match request.reference_image_media_tokens.as_ref() {
    None => None,
    Some(tokens) if tokens.is_empty() => None,
    Some(tokens) => {
      let mut urls = Vec::with_capacity(tokens.len());
      for token in tokens {
        match image_urls_by_token.get(token) {
          None => return Err(CommonWebError::BadInputWithSimpleMessage("Reference image media not found.".to_string())),
          Some(url) => {
            let seedance_url = upload_to_seedance2pro(&session, url).await?;
            urls.push(seedance_url);
          }
        }
      }
      Some(urls)
    }
  };

  // --- Map request params to seedance2pro types ---

  let resolution = match request.aspect_ratio {
    Some(Seedance2p0AspectRatio::Landscape16x9) => Resolution::Landscape16x9,
    Some(Seedance2p0AspectRatio::Portrait9x16) => Resolution::Portrait9x16,
    Some(Seedance2p0AspectRatio::Square1x1) => Resolution::Square1x1,
    Some(Seedance2p0AspectRatio::Standard4x3) => Resolution::Standard4x3,
    Some(Seedance2p0AspectRatio::Portrait3x4) => Resolution::Portrait3x4,
    None => Resolution::Landscape16x9,
  };

  let batch_count = match request.batch_count {
    Some(Seedance2p0BatchCount::One) | None => BatchCount::One,
    Some(Seedance2p0BatchCount::Two) => BatchCount::Two,
    Some(Seedance2p0BatchCount::Four) => BatchCount::Four,
  };

  let duration_seconds = request.duration_seconds.unwrap_or(5).clamp(4, 15);
  let prompt = request.prompt.clone().unwrap_or_else(|| "".to_string());

  let video_gen_args = GenerateVideoArgs {
    session: &session,
    prompt,
    resolution,
    duration_seconds,
    batch_count,
    start_frame_url,
    end_frame_url,
    reference_image_urls,
  };

  // --- Calculate cost and charge wallet ---

  let cost_in_cents = video_gen_args.estimate_cost_in_usd_cents(); // NB: ArtCraft credits are 1:1 with USD cents.

  let apriori_job_token = InferenceJobToken::generate();

  info!("Charging wallet: {} cents ({} credits)", cost_in_cents, cost_in_cents);

  let deduction_result = attempt_wallet_deduction_else_common_web_error(
    user_token,
    Some(apriori_job_token.as_str()),
    cost_in_cents,
    &mut mysql_connection,
  ).await?;

  // --- Call seedance2pro API ---

  // TODO: The refund logic here could use work. We shouldn't hold MySQL transactions open during the HTTP
  //  transaction (as that could last forever), but this is slightly risky in that a tiny percentage of errors
  //  may leak. We need to engineer two-phase transactions (a lot of work) to make every step atomic.

  let gen_response = match generate_video(video_gen_args).await {
    Ok(resp) => resp,
    Err(err) => {
      warn!("Error calling seedance2pro generate_video: {:?}", err);
      refund_after_api_failure(&deduction_result.ledger_entry_token, &mut mysql_connection).await;

      // TODO: We need to start returning robust failure messages to the caller.
      return Err(CommonWebError::ServerError);
    }
  };

  info!(
    "Seedance2pro task_id={}, order_id={}",
    gen_response.task_id, gen_response.order_id
  );

  // --- DB writes in a transaction ---

  let ip_address = get_request_ip(&http_request);

  let mut transaction = mysql_connection
      .begin()
      .await
      .map_err(|err| {
        error!("Error starting MySQL transaction: {:?}", err);
        CommonWebError::ServerError
      })?;

  // NB: Don't fail the job if the prompt insert fails.
  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: maybe_user_session.as_ref().map(|s| &s.user_token),
    maybe_model_type: Some(ModelType::Seedance2p0),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    creator_ip_address: &ip_address,
    mysql_executor: &mut *transaction,
    phantom: Default::default(),
  }).await;

  let prompt_token = match prompt_result {
    Ok(token) => Some(token),
    Err(err) => {
      warn!("Error inserting prompt: {:?}", err);
      None
    }
  };

  if let Some(token) = prompt_token.as_ref() {
    let mut context_items: Vec<PromptContextItem> = Vec::new();

    if let Some(media_token) = &request.start_frame_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::VidStartFrame,
      });
    }
    if let Some(media_token) = &request.end_frame_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::VidEndFrame,
      });
    }

    if !context_items.is_empty() {
      if let Err(err) = insert_batch_prompt_context_items(InsertBatchArgs {
        prompt_token: token.clone(),
        items: context_items,
        transaction: &mut transaction,
      }).await {
        warn!("Error inserting batch prompt context items: {:?}", err);
      }
    }
  }

  // Insert one DB job per order_id in the batch.
  let order_ids: Vec<String> = match gen_response.order_ids {
    Some(ids) if !ids.is_empty() => ids,
    _ => vec![gen_response.order_id],
  };

  let mut all_job_tokens: Vec<InferenceJobToken> = Vec::with_capacity(order_ids.len());

  for (i, order_id) in order_ids.iter().enumerate() {
    let job_token = if i == 0 {
      apriori_job_token.clone()
    } else {
      InferenceJobToken::generate()
    };

    // For batch jobs beyond the first, generate a unique idempotency key.
    let idempotency_str = if i == 0 {
      request.uuid_idempotency_token.clone()
    } else {
      format!("{}-batch-{}", request.uuid_idempotency_token, i)
    };

    let db_result = insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token(
      InsertGenericInferenceForSeedance2ProWithAprioriJobTokenArgs {
        apriori_job_token: &job_token,
        uuid_idempotency_token: &idempotency_str,
        maybe_external_third_party_id: order_id,
        maybe_inference_args: None,
        maybe_prompt_token: prompt_token.as_ref(),
        maybe_wallet_ledger_entry_token: Some(&deduction_result.ledger_entry_token),
        maybe_creator_user_token: maybe_user_session.as_ref().map(|s| &s.user_token),
        maybe_avt_token: maybe_avt_token.as_ref(),
        creator_ip_address: &ip_address,
        creator_set_visibility: Visibility::Public,
        mysql_executor: &mut *transaction,
        phantom: Default::default(),
      }
    ).await;

    match db_result {
      Ok(token) => {
        all_job_tokens.push(token);
      }
      Err(err) => {
        warn!("Error inserting seedance2pro inference job (order_id={}): {:?}", order_id, err);
        if i == 0 {
          return Err(CommonWebError::ServerError);
        }
      }
    }
  }

  let first_job_token = all_job_tokens.first().cloned().ok_or_else(|| {
    error!("No inference job token was created");
    CommonWebError::ServerError
  })?;

  transaction
      .commit()
      .await
      .map_err(|err| {
        error!("Error committing MySQL transaction: {:?}", err);
        CommonWebError::ServerError
      })?;

  Ok(Json(Seedance2p0MultiFunctionVideoGenResponse {
    success: true,
    inference_job_token: first_job_token,
    all_inference_job_tokens: all_job_tokens,
  }))
}

async fn refund_after_api_failure(
  ledger_entry_token: &tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken,
  connection: &mut sqlx::pool::PoolConnection<sqlx::MySql>,
) {
  let mut transaction = match connection.begin().await {
    Ok(tx) => tx,
    Err(err) => {
      error!(
        "Failed to begin refund transaction after API failure (ledger {}): {:?}",
        ledger_entry_token.as_str(), err
      );
      return;
    }
  };

  match try_to_refund_ledger_entry(ledger_entry_token, &mut transaction).await {
    Ok(WalletRefundOutcome::Refunded(summary)) => {
      info!(
        "Refunded {} credits after API failure (ledger {} → refund ledger {}).",
        summary.refund_amount,
        ledger_entry_token.as_str(),
        summary.refund_ledger_entry_token.as_str(),
      );
      if let Err(err) = transaction.commit().await {
        error!(
          "Failed to commit refund after API failure (ledger {}): {:?}",
          ledger_entry_token.as_str(), err
        );
      }
    }
    Ok(WalletRefundOutcome::AlreadyRefunded) => {
      info!(
        "Ledger entry {} was already refunded; no action needed.",
        ledger_entry_token.as_str()
      );
      let _ = transaction.rollback().await;
    }
    Err(err) => {
      error!(
        "Failed to refund ledger entry {} after API failure: {:?}",
        ledger_entry_token.as_str(), err
      );
      let _ = transaction.rollback().await;
    }
  }
}

async fn upload_to_seedance2pro(
  session: &Seedance2ProSession,
  our_cdn_url: &str,
) -> Result<String, CommonWebError> {
  let image_bytes = http_download_url_to_bytes(our_cdn_url)
      .await
      .map_err(|err| {
        warn!("Error downloading media file from CDN: {:?}", err);
        CommonWebError::ServerError
      })?
      .to_vec();

  let prepare_result = prepare_image_upload(PrepareImageUploadArgs { session })
      .await
      .map_err(|err| {
        warn!("Error preparing seedance2pro image upload: {:?}", err);
        CommonWebError::ServerError
      })?;

  let upload_result = upload_image(UploadImageArgs {
    upload_url: prepare_result.upload_url,
    image_bytes,
  })
      .await
      .map_err(|err| {
        warn!("Error uploading image to seedance2pro: {:?}", err);
        CommonWebError::ServerError
      })?;

  Ok(upload_result.public_url)
}
