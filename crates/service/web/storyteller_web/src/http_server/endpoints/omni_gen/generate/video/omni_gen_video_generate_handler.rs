use std::collections::HashMap;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use sqlx::Acquire;
use url::Url;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::generate_response::omni_gen_video_generate_response::OmniGenVideoGenerateResponse;
use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation_provider::GenerationProvider;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{
  insert_generic_inference_job_for_fal_queue_with_apriori_job_token,
  InsertGenericInferenceForFalWithAprioriJobTokenArgs,
};
use mysql_queries::queries::generic_inference::seedance2pro::insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token::{
  insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token,
  InsertGenericInferenceForSeedance2ProWithAprioriJobTokenArgs,
};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{
  insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem,
};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::bill_wallet::bill_wallet;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::distill_helper::hydrate_to_router_request::hydrate_to_router_request;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::distill_video_request::distill_video_request;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::execute::execute_generation::execute_generation;
use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v2::execute::execute_pipeline_v2;
use crate::http_server::endpoints::omni_gen::generate::video::request_helper::resolve_kinovi_character_ids::resolve_kinovi_character_ids;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_image_urls_as_map::lookup_image_urls_as_map;

/// Generate a video using the omni-gen unified endpoint.
#[utoipa::path(
  post,
  tag = "Omni Gen",
  path = "/v1/omni_gen/generate/video",
  request_body = OmniGenVideoCostAndGenerateRequest,
  responses(
    (status = 200, description = "Success", body = OmniGenVideoGenerateResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Unauthorized"),
    (status = 402, description = "Payment required"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_video_generate_handler(
  http_request: HttpRequest,
  request: Json<OmniGenVideoCostAndGenerateRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<OmniGenVideoGenerateResponse>, AdvancedCommonWebError> {

  info!("request: {:?}", request);

  payments_error_test(&request.prompt.as_deref().unwrap_or(""))?;

  let maybe_prompt_model_type: Option<CommonModelType> = request.model
    .as_ref()
    .map(|m| m.to_common_model_type());

  // ==================== SESSION ==================== //

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let maybe_user_session = server_state
    .session_checker
    .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      AdvancedCommonWebError::from(e)
    })?;

  let user_token = match maybe_user_session.as_ref() {
    Some(session) => &session.user_token,
    None => return Err(AdvancedCommonWebError::NotAuthorized),
  };

  let maybe_avt_token = server_state
    .avt_cookie_manager
    .get_avt_token_from_request(&http_request);

  // ==================== IDEMPOTENCY ==================== //

  let idempotency_token = request.idempotency_token.as_deref()
    .unwrap_or("")
    .to_string();

  if let Err(reason) = validate_idempotency_token_format(&idempotency_token) {
    return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(reason));
  }

  insert_idempotency_token(&idempotency_token, &mut *mysql_connection)
    .await
    .map_err(|err| {
      error!("Error inserting idempotency token: {:?}", err);
      AdvancedCommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
    })?;

  // ==================== RESOLVE MEDIA TOKENS ==================== //

  let media_file_hydration_map: Option<HashMap<MediaFileToken, Url>> = {
    let mut all_tokens: Vec<MediaFileToken> = Vec::new();

    if let Some(token) = &request.start_frame_image_media_token {
      all_tokens.push(token.clone());
    }
    if let Some(token) = &request.end_frame_image_media_token {
      all_tokens.push(token.clone());
    }
    if let Some(tokens) = &request.reference_image_media_tokens {
      all_tokens.extend(tokens.iter().cloned());
    }
    if let Some(tokens) = &request.reference_video_media_tokens {
      all_tokens.extend(tokens.iter().cloned());
    }
    if let Some(tokens) = &request.reference_audio_media_tokens {
      all_tokens.extend(tokens.iter().cloned());
    }

    if all_tokens.is_empty() {
      None
    } else {
      info!("Resolving {} media file tokens to CDN URLs", all_tokens.len());
      let raw = lookup_image_urls_as_map(
        &http_request,
        &mut mysql_connection,
        server_state.server_environment,
        &all_tokens,
      ).await?;
      let parsed: HashMap<MediaFileToken, Url> = raw.into_iter()
        .filter_map(|(token, url_str)| match Url::parse(&url_str) {
          Ok(url) => Some((token, url)),
          Err(err) => {
            warn!("Failed to parse media file URL {:?}: {:?}", url_str, err);
            None
          }
        })
        .collect();
      Some(parsed)
    }
  };

  // ==================== PIPELINE DECISION ==================== //

  let use_v2 = matches!(
    request.model,
    Some(CommonVideoModel::Seedance2p0) | Some(CommonVideoModel::Seedance2p0Fast)
  );

  if use_v2 {
    execute_v2_pipeline(
      &http_request,
      &request,
      &server_state,
      &mut mysql_connection,
      user_token,
      maybe_avt_token.as_ref(),
      &idempotency_token,
      maybe_prompt_model_type,
      media_file_hydration_map,
    ).await
  } else {
    execute_v1_pipeline(
      &http_request,
      &request,
      &server_state,
      &mut mysql_connection,
      user_token,
      maybe_avt_token.as_ref(),
      &idempotency_token,
      maybe_prompt_model_type,
      media_file_hydration_map,
    ).await
  }
}

// ==================== PIPELINE V1 (existing) ==================== //

#[allow(clippy::too_many_arguments)]
async fn execute_v1_pipeline(
  http_request: &HttpRequest,
  request: &OmniGenVideoCostAndGenerateRequest,
  server_state: &ServerState,
  mysql_connection: &mut sqlx::pool::PoolConnection<sqlx::MySql>,
  user_token: &tokens::tokens::users::UserToken,
  maybe_avt_token: Option<&tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken>,
  idempotency_token: &str,
  maybe_prompt_model_type: Option<CommonModelType>,
  media_file_hydration_map: Option<HashMap<MediaFileToken, Url>>,
) -> Result<Json<OmniGenVideoGenerateResponse>, AdvancedCommonWebError> {
  let kinovi_character_ids = resolve_kinovi_character_ids(
    request.reference_character_tokens.as_deref(),
    mysql_connection,
  ).await?;

  let execution_provider = match request.model {
    Some(CommonVideoModel::Seedance2p0) => Provider::Seedance2Pro,
    Some(CommonVideoModel::Seedance2p0Fast) => Provider::Seedance2Pro,
    _ => Provider::Fal,
  };

  let distilled = distill_video_request(request, media_file_hydration_map.as_ref(), execution_provider)?;

  info!("v1 distilled plan: {:?}", distilled.plan);

  let cost = distilled.cost.cost_in_credits.unwrap_or(0);
  let billing = bill_wallet(user_token, cost, mysql_connection).await?;

  let gen_result = execute_generation(
    &distilled,
    request,
    server_state,
    media_file_hydration_map.as_ref(),
    kinovi_character_ids,
    billing.maybe_wallet_ledger_entry_token.as_ref(),
    mysql_connection,
  ).await?;

  // -- DB writes --
  let ip_address = get_request_ip(http_request);
  let mut transaction = mysql_connection.begin().await.map_err(|err| {
    error!("Error starting MySQL transaction: {:?}", err);
    AdvancedCommonWebError::from_error(err)
  })?;

  let prompt_token = insert_prompt_and_context(
    request, &mut transaction, user_token, maybe_prompt_model_type,
    Some(gen_result.generation_mode), &ip_address,
  ).await;

  let job_token = if gen_result.is_seedance2pro {
    insert_seedance2pro_jobs(
      &gen_result.external_job_id,
      gen_result.maybe_seedance_order_ids.as_deref(),
      &billing.apriori_job_token,
      idempotency_token,
      prompt_token.as_ref(),
      billing.maybe_wallet_ledger_entry_token.as_ref(),
      user_token,
      maybe_avt_token,
      &ip_address,
      &mut transaction,
    ).await?
  } else {
    insert_fal_job(
      &gen_result.external_job_id,
      &billing.apriori_job_token,
      idempotency_token,
      prompt_token.as_ref(),
      user_token,
      maybe_avt_token,
      &ip_address,
      &mut transaction,
    ).await?
  };

  transaction.commit().await.map_err(|err| {
    error!("Error committing transaction: {:?}", err);
    AdvancedCommonWebError::from_error(err)
  })?;

  Ok(Json(OmniGenVideoGenerateResponse {
    success: true,
    inference_job_token: job_token,
  }))
}

// ==================== PIPELINE V2 (new) ==================== //

#[allow(clippy::too_many_arguments)]
async fn execute_v2_pipeline(
  http_request: &HttpRequest,
  request: &OmniGenVideoCostAndGenerateRequest,
  server_state: &ServerState,
  mysql_connection: &mut sqlx::pool::PoolConnection<sqlx::MySql>,
  user_token: &tokens::tokens::users::UserToken,
  maybe_avt_token: Option<&tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken>,
  idempotency_token: &str,
  maybe_prompt_model_type: Option<CommonModelType>,
  media_file_hydration_map: Option<HashMap<MediaFileToken, Url>>,
) -> Result<Json<OmniGenVideoGenerateResponse>, AdvancedCommonWebError> {
  // 1. Build execution request (provider = Seedance2Pro for Kinovi execution)
  let mut exec_builder = hydrate_to_router_request(request)?;
  exec_builder.provider = Provider::Seedance2Pro;

  let draft_or_request = exec_builder.build2().map_err(|e| {
    warn!("Failed to build2 for v2 pipeline: {}", e);
    AdvancedCommonWebError::from_error(e)
  })?;

  // 2. Calculate cost (swap provider to Artcraft for billing)
  let mut cost_builder = hydrate_to_router_request(request)?;
  cost_builder.provider = Provider::Artcraft;

  let cost_estimate = cost_builder.build2()
    .map_err(|e| {
      warn!("Failed to build2 cost estimate for v2 pipeline: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?
    .estimate_cost()
    .map_err(|e| {
      warn!("Failed to estimate cost for v2 pipeline: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?;

  let cost = cost_estimate.cost_in_credits.unwrap_or(0);
  info!("v2 estimated cost: {} credits", cost);

  // 3. Bill wallet
  let billing = bill_wallet(user_token, cost, mysql_connection).await?;

  // 4. Build context maps for draft finalization
  let media_file_urls_as_strings: Option<HashMap<MediaFileToken, String>> =
    media_file_hydration_map.as_ref().map(|map| {
      map.iter().map(|(k, v)| (k.clone(), v.to_string())).collect()
    });

  let kinovi_character_id_map: Option<HashMap<CharacterToken, String>> =
    resolve_kinovi_character_id_map(
      request.reference_character_tokens.as_deref(),
      mysql_connection,
    ).await?;

  // 5. Execute: finalize draft (upload to Kinovi if needed) → send
  let gen_response = execute_pipeline_v2(
    draft_or_request,
    server_state,
    media_file_urls_as_strings.as_ref(),
    kinovi_character_id_map.as_ref(),
    billing.maybe_wallet_ledger_entry_token.as_ref(),
    mysql_connection,
  ).await?;

  // 6. DB writes
  let ip_address = get_request_ip(http_request);
  let mut transaction = mysql_connection.begin().await.map_err(|err| {
    error!("Error starting MySQL transaction: {:?}", err);
    AdvancedCommonWebError::from_error(err)
  })?;

  let prompt_token = insert_prompt_and_context(
    request, &mut transaction, user_token, maybe_prompt_model_type,
    None, // TODO: determine generation_mode from v2 response
    &ip_address,
  ).await;

  let job_token = match gen_response {
    GenerateVideoResponse::Seedance2Pro(ref payload) => {
      insert_seedance2pro_jobs(
        &payload.order_id,
        None, // v2 Kinovi returns single order_id per request
        &billing.apriori_job_token,
        idempotency_token,
        prompt_token.as_ref(),
        billing.maybe_wallet_ledger_entry_token.as_ref(),
        user_token,
        maybe_avt_token,
        &ip_address,
        &mut transaction,
      ).await?
    }
    GenerateVideoResponse::Artcraft(ref payload) => {
      // Artcraft recursive: job was already created by the inner omni call
      payload.inference_job_token.clone()
    }
    GenerateVideoResponse::Fal(ref payload) => {
      let external_id = payload.request_id.clone().unwrap_or_default();
      insert_fal_job(
        &external_id,
        &billing.apriori_job_token,
        idempotency_token,
        prompt_token.as_ref(),
        user_token,
        maybe_avt_token,
        &ip_address,
        &mut transaction,
      ).await?
    }
    _ => {
      error!("Unexpected v2 response variant: {:?}", gen_response);
      return Err(AdvancedCommonWebError::server_error_with_message("Unexpected v2 response"));
    }
  };

  transaction.commit().await.map_err(|err| {
    error!("Error committing transaction: {:?}", err);
    AdvancedCommonWebError::from_error(err)
  })?;

  Ok(Json(OmniGenVideoGenerateResponse {
    success: true,
    inference_job_token: job_token,
  }))
}

// ==================== SHARED HELPERS ==================== //

/// Insert prompt and prompt context items. Returns the prompt token if successful.
async fn insert_prompt_and_context(
  request: &OmniGenVideoCostAndGenerateRequest,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
  user_token: &tokens::tokens::users::UserToken,
  maybe_prompt_model_type: Option<CommonModelType>,
  maybe_generation_mode: Option<enums::common::generation::common_generation_mode::CommonGenerationMode>,
  ip_address: &str,
) -> Option<tokens::tokens::prompts::PromptToken> {
  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(user_token),
    maybe_model_type: maybe_prompt_model_type,
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: request.negative_prompt.as_deref(),
    maybe_other_args: None,
    maybe_generation_mode,
    maybe_aspect_ratio: None,
    maybe_resolution: None,
    maybe_batch_count: request.video_batch_count.map(|c| c as u8),
    maybe_generate_audio: request.generate_audio,
    maybe_duration_seconds: request.duration_seconds.map(|d| d as u32),
    creator_ip_address: ip_address,
    mysql_executor: &mut **transaction,
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
    let mut context_items = Vec::new();

    if let Some(media_token) = &request.start_frame_image_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::VidStartFrame,
      });
    }
    if let Some(media_token) = &request.end_frame_image_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::VidEndFrame,
      });
    }
    if let Some(ref_tokens) = &request.reference_image_media_tokens {
      for media_token in ref_tokens {
        context_items.push(PromptContextItem {
          media_token: media_token.clone(),
          context_semantic_type: PromptContextSemanticType::Imgref,
        });
      }
    }
    if let Some(ref_tokens) = &request.reference_video_media_tokens {
      for media_token in ref_tokens {
        context_items.push(PromptContextItem {
          media_token: media_token.clone(),
          context_semantic_type: PromptContextSemanticType::VidRef,
        });
      }
    }

    if !context_items.is_empty() {
      if let Err(err) = insert_batch_prompt_context_items(InsertBatchArgs {
        prompt_token: token.clone(),
        items: context_items,
        transaction,
      }).await {
        warn!("Error inserting batch prompt context items: {:?}", err);
      }
    }
  }

  prompt_token
}

#[allow(clippy::too_many_arguments)]
async fn insert_seedance2pro_jobs(
  primary_order_id: &str,
  maybe_additional_order_ids: Option<&[String]>,
  apriori_job_token: &InferenceJobToken,
  idempotency_token: &str,
  prompt_token: Option<&tokens::tokens::prompts::PromptToken>,
  maybe_wallet_ledger_entry_token: Option<&tokens::tokens::wallet_ledger_entries::WalletLedgerEntryToken>,
  user_token: &tokens::tokens::users::UserToken,
  maybe_avt_token: Option<&tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken>,
  ip_address: &str,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
) -> Result<InferenceJobToken, AdvancedCommonWebError> {
  let fallback_ids = vec![primary_order_id.to_string()];
  let order_ids = maybe_additional_order_ids.unwrap_or(&fallback_ids);

  let mut all_job_tokens: Vec<InferenceJobToken> = Vec::with_capacity(order_ids.len());

  for (i, order_id) in order_ids.iter().enumerate() {
    let job_token = if i == 0 {
      apriori_job_token.clone()
    } else {
      InferenceJobToken::generate()
    };

    let idempotency_str = if i == 0 {
      idempotency_token.to_string()
    } else {
      format!("{}-batch-{}", idempotency_token, i)
    };

    let db_result = insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token(
      InsertGenericInferenceForSeedance2ProWithAprioriJobTokenArgs {
        apriori_job_token: &job_token,
        uuid_idempotency_token: &idempotency_str,
        maybe_external_third_party_id: order_id,
        maybe_inference_args: None,
        maybe_prompt_token: prompt_token,
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
        if i == 0 {
          return Err(AdvancedCommonWebError::from_error(err));
        }
      }
    }
  }

  all_job_tokens.first().cloned().ok_or_else(|| {
    error!("No inference job token was created");
    AdvancedCommonWebError::server_error_with_message("No inference job token was created")
  })
}

#[allow(clippy::too_many_arguments)]
async fn insert_fal_job(
  external_job_id: &str,
  apriori_job_token: &InferenceJobToken,
  idempotency_token: &str,
  prompt_token: Option<&tokens::tokens::prompts::PromptToken>,
  user_token: &tokens::tokens::users::UserToken,
  maybe_avt_token: Option<&tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken>,
  ip_address: &str,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
) -> Result<InferenceJobToken, AdvancedCommonWebError> {
  // TODO: Pass maybe_wallet_ledger_entry_token to fal jobs once the fal insert supports it.
  let db_result = insert_generic_inference_job_for_fal_queue_with_apriori_job_token(
    InsertGenericInferenceForFalWithAprioriJobTokenArgs {
      apriori_job_token,
      uuid_idempotency_token: idempotency_token,
      maybe_external_third_party_id: external_job_id,
      fal_category: FalCategory::VideoGeneration,
      maybe_inference_args: None,
      maybe_prompt_token: prompt_token,
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

/// Resolve character tokens to a map of CharacterToken → Kinovi character ID.
/// Used by pipeline v2's draft context.
async fn resolve_kinovi_character_id_map(
  maybe_tokens: Option<&[CharacterToken]>,
  connection: &mut sqlx::pool::PoolConnection<sqlx::MySql>,
) -> Result<Option<HashMap<CharacterToken, String>>, AdvancedCommonWebError> {
  use mysql_queries::queries::characters::batch_lookup_characters_by_token_for_prompting::batch_lookup_characters_by_token_for_prompting;

  let tokens = match maybe_tokens {
    None => return Ok(None),
    Some(tokens) if tokens.is_empty() => return Ok(None),
    Some(tokens) => tokens,
  };

  let characters = batch_lookup_characters_by_token_for_prompting(tokens, connection).await?;

  let map: HashMap<CharacterToken, String> = characters.iter()
    .filter(|c| c.is_active)
    .filter_map(|c| {
      c.kinovi_character_id.as_ref().map(|kid| (c.token.clone(), kid.clone()))
    })
    .collect();

  if map.is_empty() { Ok(None) } else { Ok(Some(map)) }
}
