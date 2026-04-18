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
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::omni_gen::generate::video::distill_video_request::distill_video_request;
use crate::http_server::endpoints::omni_gen::generate::video::execute::execute_generation::execute_generation;
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
  // Look up media file tokens BEFORE distilling. distill_video_request takes
  // a pre-computed `MediaFileToken -> Url` map and does no I/O of its own.

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

  // ==================== RESOLVE CHARACTER TOKENS ==================== //

  let kinovi_character_ids = resolve_kinovi_character_ids(
    request.reference_character_tokens.as_deref(),
    &mut mysql_connection,
  ).await?;

  // ==================== DETERMINE PROVIDER ==================== //

  let execution_provider = match request.model {
    Some(CommonVideoModel::Seedance2p0) => Provider::Seedance2Pro,
    Some(CommonVideoModel::Seedance2p0Fast) => Provider::Seedance2Pro,
    _ => Provider::Fal,
  };

  // ==================== DISTILL ==================== //

  let distilled = distill_video_request(&request, media_file_hydration_map.as_ref(), execution_provider)?;

  info!("distilled plan: {:?}", distilled.plan);

  // ==================== BILLING ==================== //

  let cost = distilled.cost.cost_in_credits.unwrap_or(0);

  info!("Charging wallet: {} credits", cost);

  let apriori_job_token = InferenceJobToken::generate();

  if cost > 0 {
    attempt_wallet_deduction_else_common_web_error(
      user_token,
      Some(apriori_job_token.as_str()),
      cost,
      &mut mysql_connection,
    ).await?;
  }

  // ==================== EXECUTE GENERATION ==================== //

  let gen_result = execute_generation(
    &distilled,
    &request,
    &server_state,
    media_file_hydration_map.as_ref(),
    kinovi_character_ids,
  ).await?;

  // ==================== DB TRANSACTION ==================== //

  let ip_address = get_request_ip(&http_request);

  let mut transaction = mysql_connection
    .begin()
    .await
    .map_err(|err| {
      error!("Error starting MySQL transaction: {:?}", err);
      AdvancedCommonWebError::from_error(err)
    })?;

  // -- Prompt --

  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(user_token),
    maybe_model_type: maybe_prompt_model_type,
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: request.negative_prompt.as_deref(),
    maybe_other_args: None,
    maybe_generation_mode: Some(gen_result.generation_mode),
    maybe_aspect_ratio: None,
    maybe_resolution: None,
    maybe_batch_count: request.video_batch_count.map(|c| c as u8),
    maybe_generate_audio: request.generate_audio,
    maybe_duration_seconds: request.duration_seconds.map(|d| d as u32),
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

  // -- Prompt context items --

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
        transaction: &mut transaction,
      }).await {
        warn!("Error inserting batch prompt context items: {:?}", err);
      }
    }
  }

  // -- Inference job --

  let job_token = if gen_result.is_seedance2pro {
    // Seedance2Pro path: insert one job per order_id (batch support).
    let fallback_ids = vec![gen_result.external_job_id.clone()];
    let order_ids = gen_result.maybe_seedance_order_ids
        .as_deref()
        .unwrap_or(&fallback_ids);

    let mut all_job_tokens: Vec<InferenceJobToken> = Vec::with_capacity(order_ids.len());

    for (i, order_id) in order_ids.iter().enumerate() {
      let job_token = if i == 0 {
        apriori_job_token.clone()
      } else {
        InferenceJobToken::generate()
      };

      let idempotency_str = if i == 0 {
        idempotency_token.clone()
      } else {
        format!("{}-batch-{}", idempotency_token, i)
      };

      let db_result = insert_generic_inference_job_for_seedance2pro_queue_with_apriori_job_token(
        InsertGenericInferenceForSeedance2ProWithAprioriJobTokenArgs {
          apriori_job_token: &job_token,
          uuid_idempotency_token: &idempotency_str,
          maybe_external_third_party_id: order_id,
          maybe_inference_args: None,
          maybe_prompt_token: prompt_token.as_ref(),
          maybe_wallet_ledger_entry_token: None,
          maybe_creator_user_token: Some(user_token),
          maybe_avt_token: maybe_avt_token.as_ref(),
          creator_ip_address: &ip_address,
          creator_set_visibility: Visibility::Public,
          mysql_executor: &mut *transaction,
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
    })?
  } else {
    // Fal / other providers path.
    let db_result = insert_generic_inference_job_for_fal_queue_with_apriori_job_token(
      InsertGenericInferenceForFalWithAprioriJobTokenArgs {
        apriori_job_token: &apriori_job_token,
        uuid_idempotency_token: &idempotency_token,
        maybe_external_third_party_id: &gen_result.external_job_id,
        fal_category: FalCategory::VideoGeneration,
        maybe_inference_args: None,
        maybe_prompt_token: prompt_token.as_ref(),
        maybe_creator_user_token: Some(user_token),
        maybe_avt_token: maybe_avt_token.as_ref(),
        creator_ip_address: &ip_address,
        creator_set_visibility: Visibility::Public,
        mysql_executor: &mut *transaction,
        starting_job_status_override: None,
        maybe_frontend_failure_category: None,
        maybe_failure_reason: None,
        phantom: Default::default(),
      }
    ).await;

    match db_result {
      Ok(token) => token,
      Err(err) => {
        warn!("Error inserting inference job: {:?}", err);
        return Err(AdvancedCommonWebError::from_error(err));
      }
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
