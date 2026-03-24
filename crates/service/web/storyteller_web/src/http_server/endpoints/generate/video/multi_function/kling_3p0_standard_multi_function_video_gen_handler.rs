use std::collections::{HashMap, HashSet};
use std::iter::FromIterator;
use std::sync::Arc;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_image_urls_as_map::lookup_image_urls_as_map;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::video::multi_function::kling_3p0_standard_multi_function_video_gen::{Kling3p0StandardMultiFunctionVideoGenAspectRatio, Kling3p0StandardMultiFunctionVideoGenDuration, Kling3p0StandardMultiFunctionVideoGenRequest, Kling3p0StandardMultiFunctionVideoGenResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::visibility::Visibility;
use fal_client::creds::open_ai_api_key::OpenAiApiKey;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::video::image::enqueue_kling_3p0_standard_image_to_video_webhook::{enqueue_kling_3p0_standard_image_to_video_webhook, EnqueueKling3p0StandardImageToVideoArgs, EnqueueKling3p0StandardImageToVideoAspectRatio, EnqueueKling3p0StandardImageToVideoDuration};
use fal_client::requests::webhook::video::text::enqueue_kling_3p0_standard_text_to_video_webhook::{enqueue_kling_3p0_standard_text_to_video_webhook, EnqueueKling3p0StandardTextToVideoArgs, EnqueueKling3p0StandardTextToVideoAspectRatio, EnqueueKling3p0StandardTextToVideoDuration};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{insert_generic_inference_job_for_fal_queue_with_apriori_job_token, InsertGenericInferenceForFalWithAprioriJobTokenArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::{batch_get_media_files_by_tokens, batch_get_media_files_by_tokens_with_connection};
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use mysql_queries::queries::wallets::spend::wallet_spend_error::WalletSpendError;
use server_environment::ServerEnvironment;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

/// Kling 3.0 Standard Multi-Function (text and image to video)
#[utoipa::path(
  post,
  tag = "Generate Video (Multi-Function)",
  path = "/v1/generate/video/multi_function/kling_3p0_standard",
  responses(
    (status = 200, description = "Success", body = Kling3p0StandardMultiFunctionVideoGenResponse),
  ),
  params(
    ("request" = Kling3p0StandardMultiFunctionVideoGenRequest, description = "Payload for Request"),
  )
)]
pub async fn kling_3p0_standard_multi_function_video_gen_handler(
  http_request: HttpRequest,
  request: Json<Kling3p0StandardMultiFunctionVideoGenRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<Kling3p0StandardMultiFunctionVideoGenResponse>, CommonWebError> {

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

  let mut query_media_tokens = None;

  if let Some(start_frame_token) = request.image_media_token.as_ref() {
    let mut tokens = Vec::new();
    tokens.push(start_frame_token.to_owned());

    if let Some(end_frame_token) = request.end_image_media_token.as_ref() {
      tokens.push(end_frame_token.to_owned());
    }

    query_media_tokens = Some(tokens);
  }

  let image_urls_by_token = match query_media_tokens {
    None => HashMap::new(),
    Some(media_tokens) => {
      info!("Looking up image media tokens: {:?}", media_tokens);
      lookup_image_urls_as_map(
        &http_request,
        &mut mysql_connection,
        server_state.server_environment,
        &media_tokens,
      ).await?
    }
  };

  let maybe_start_frame_image_url = match request.image_media_token.as_ref() {
    None => None,
    Some(token) => match image_urls_by_token.get(token) {
      Some(url) => Some(url.to_string()),
      None => {
        return Err(CommonWebError::BadInputWithSimpleMessage("Media for start frame not found.".to_string()));
      }
    }
  };

  let maybe_end_frame_image_url = match request.end_image_media_token.as_ref() {
    None => None,
    Some(token) => match image_urls_by_token.get(token) {
      Some(url) => Some(url.to_string()),
      None => {
        return Err(CommonWebError::BadInputWithSimpleMessage("Media for end frame not found.".to_string()));
      }
    }
  };

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
      })?;

  info!("Fal webhook URL: {}", server_state.fal.webhook_url);

  let apriori_job_token = InferenceJobToken::generate();

  // Most people will want audio
  let generate_audio = request.generate_audio.unwrap_or(true);
  
  let fal_result;
  let generation_mode;

  if let Some(start_frame_url) = maybe_start_frame_image_url {
    info!("image-to-video case");
    generation_mode = CommonGenerationMode::Keyframe;

    let duration = map_duration_i2v(request.duration);
    let aspect_ratio = map_aspect_ratio_i2v(request.aspect_ratio);

    let args = EnqueueKling3p0StandardImageToVideoArgs {
      prompt: request.prompt.as_deref().unwrap_or("").to_string(),
      image_url: start_frame_url,
      end_image_url: maybe_end_frame_image_url,
      generate_audio: Some(generate_audio),
      negative_prompt: request.negative_prompt.clone(),
      duration: Some(duration),
      aspect_ratio,
      shot_type: None,
      webhook_url: &server_state.fal.webhook_url,
      api_key: &server_state.fal.api_key,
    };

    let cost = args.calculate_cost_in_cents();

    info!("Charging wallet: {}", cost);

    attempt_wallet_deduction_else_common_web_error(
      user_token,
      Some(apriori_job_token.as_str()),
      cost,
      &mut mysql_connection,
    ).await?;

    fal_result = enqueue_kling_3p0_standard_image_to_video_webhook(args)
        .await
        .map_err(|err| {
          warn!("Error calling enqueue_kling_3p0_standard_image_to_video_webhook: {:?}", err);
          CommonWebError::ServerError
        })?;

  } else {
    info!("text-to-video case");
    generation_mode = CommonGenerationMode::Text;

    let duration = map_duration_t2v(request.duration);

    let aspect_ratio = map_aspect_ratio_t2v(request.aspect_ratio);

    let args = EnqueueKling3p0StandardTextToVideoArgs {
      prompt: request.prompt.as_deref().unwrap_or("").to_string(),
      negative_prompt: request.negative_prompt.clone(),
      generate_audio: Some(generate_audio),
      duration: Some(duration),
      aspect_ratio: Some(aspect_ratio),
      shot_type: None,
      webhook_url: &server_state.fal.webhook_url,
      api_key: &server_state.fal.api_key,
    };

    let cost = args.calculate_cost_in_cents();

    info!("Charging wallet...");

    attempt_wallet_deduction_else_common_web_error(
      user_token,
      Some(apriori_job_token.as_str()),
      cost,
      &mut mysql_connection,
    ).await?;

    fal_result = enqueue_kling_3p0_standard_text_to_video_webhook(args)
        .await
        .map_err(|err| {
          warn!("Error calling enqueue_kling_3p0_standard_text_to_video_webhook: {:?}", err);
          CommonWebError::ServerError
        })?;
  }

  let external_job_id = fal_result.request_id
      .ok_or_else(|| {
        warn!("Fal request_id is None");
        CommonWebError::ServerError
      })?;

  info!("Fal request_id: {}", external_job_id);

  let ip_address = get_request_ip(&http_request);

  let mut transaction = mysql_connection
      .begin()
      .await
      .map_err(|err| {
        error!("Error starting MySQL transaction: {:?}", err);
        CommonWebError::ServerError
      })?;

  // NB: Don't fail the job if the query fails.
  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: maybe_user_session
        .as_ref()
        .map(|s| &s.user_token),
    maybe_model_type: Some(CommonModelType::Kling3p0Standard),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: Some(generation_mode),
    maybe_aspect_ratio: request.aspect_ratio.as_ref().map(|ar| match ar {
      Kling3p0StandardMultiFunctionVideoGenAspectRatio::Square => CommonAspectRatio::Square,
      Kling3p0StandardMultiFunctionVideoGenAspectRatio::SixteenByNine => CommonAspectRatio::WideSixteenByNine,
      Kling3p0StandardMultiFunctionVideoGenAspectRatio::NineBySixteen => CommonAspectRatio::TallNineBySixteen,
    }),
    maybe_resolution: None,
    maybe_batch_count: None,
    maybe_generate_audio: Some(generate_audio),
    maybe_duration_seconds: request.duration.as_ref().map(|d| match d {
      Kling3p0StandardMultiFunctionVideoGenDuration::ThreeSeconds => 3,
      Kling3p0StandardMultiFunctionVideoGenDuration::FourSeconds => 4,
      Kling3p0StandardMultiFunctionVideoGenDuration::FiveSeconds => 5,
      Kling3p0StandardMultiFunctionVideoGenDuration::SixSeconds => 6,
      Kling3p0StandardMultiFunctionVideoGenDuration::SevenSeconds => 7,
      Kling3p0StandardMultiFunctionVideoGenDuration::EightSeconds => 8,
      Kling3p0StandardMultiFunctionVideoGenDuration::NineSeconds => 9,
      Kling3p0StandardMultiFunctionVideoGenDuration::TenSeconds => 10,
      Kling3p0StandardMultiFunctionVideoGenDuration::ElevenSeconds => 11,
      Kling3p0StandardMultiFunctionVideoGenDuration::TwelveSeconds => 12,
      Kling3p0StandardMultiFunctionVideoGenDuration::ThirteenSeconds => 13,
      Kling3p0StandardMultiFunctionVideoGenDuration::FourteenSeconds => 14,
      Kling3p0StandardMultiFunctionVideoGenDuration::FifteenSeconds => 15,
    }),
    creator_ip_address: &ip_address,
    mysql_executor: &mut *transaction,
    phantom: Default::default(),
  }).await;

  let prompt_token = match prompt_result {
    Ok(token) => Some(token),
    Err(err) => {
      warn!("Error inserting prompt: {:?}", err);
      None // Don't fail the job if the prompt insertion fails.
    }
  };

  if let Some(token) = prompt_token.as_ref() {
    let mut context_items = Vec::with_capacity(2);

    if let Some(media_token) = &request.image_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::VidStartFrame,
      });
    }

    if let Some(media_token) = &request.end_image_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::VidEndFrame,
      });
    }

    if !context_items.is_empty() {
      let result = insert_batch_prompt_context_items(InsertBatchArgs {
        prompt_token: token.clone(),
        items: context_items,
        transaction: &mut transaction,
      }).await;

      if let Err(err) = result {
        // NB: Fail open.
        warn!("Error inserting batch prompt context items: {:?}", err);
      }
    }
  }

  let db_result = insert_generic_inference_job_for_fal_queue_with_apriori_job_token(InsertGenericInferenceForFalWithAprioriJobTokenArgs {
    apriori_job_token: &apriori_job_token,
    uuid_idempotency_token: &request.uuid_idempotency_token,
    maybe_external_third_party_id: &external_job_id,
    fal_category: FalCategory::VideoGeneration,
    maybe_inference_args: None,
    maybe_prompt_token: prompt_token.as_ref(),
    maybe_creator_user_token: maybe_user_session.as_ref().map(|s| &s.user_token),
    maybe_avt_token: maybe_avt_token.as_ref(),
    creator_ip_address: &ip_address,
    creator_set_visibility: Visibility::Public,
    mysql_executor: &mut *transaction,
    starting_job_status_override: None,
    maybe_frontend_failure_category: None,
    maybe_failure_reason: None,
    phantom: Default::default(),
  }).await;

  let job_token = match db_result {
    Ok(token) => token,
    Err(err) => {
      warn!("Error inserting generic inference job for FAL queue: {:?}", err);
      return Err(CommonWebError::ServerError);
    }
  };

  let _r = transaction
      .commit()
      .await
      .map_err(|err| {
        error!("Error committing MySQL transaction: {:?}", err);
        CommonWebError::ServerError
      })?;

  Ok(Json(Kling3p0StandardMultiFunctionVideoGenResponse {
    success: true,
    inference_job_token: job_token,
  }))
}

fn map_duration_i2v(duration: Option<Kling3p0StandardMultiFunctionVideoGenDuration>) -> EnqueueKling3p0StandardImageToVideoDuration {
  match duration {
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::ThreeSeconds) => EnqueueKling3p0StandardImageToVideoDuration::ThreeSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::FourSeconds) => EnqueueKling3p0StandardImageToVideoDuration::FourSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::FiveSeconds) => EnqueueKling3p0StandardImageToVideoDuration::FiveSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::SixSeconds) => EnqueueKling3p0StandardImageToVideoDuration::SixSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::SevenSeconds) => EnqueueKling3p0StandardImageToVideoDuration::SevenSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::EightSeconds) => EnqueueKling3p0StandardImageToVideoDuration::EightSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::NineSeconds) => EnqueueKling3p0StandardImageToVideoDuration::NineSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::TenSeconds) => EnqueueKling3p0StandardImageToVideoDuration::TenSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::ElevenSeconds) => EnqueueKling3p0StandardImageToVideoDuration::ElevenSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::TwelveSeconds) => EnqueueKling3p0StandardImageToVideoDuration::TwelveSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::ThirteenSeconds) => EnqueueKling3p0StandardImageToVideoDuration::ThirteenSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::FourteenSeconds) => EnqueueKling3p0StandardImageToVideoDuration::FourteenSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::FifteenSeconds) => EnqueueKling3p0StandardImageToVideoDuration::FifteenSeconds,
    None => EnqueueKling3p0StandardImageToVideoDuration::FiveSeconds,
  }
}

fn map_duration_t2v(duration: Option<Kling3p0StandardMultiFunctionVideoGenDuration>) -> EnqueueKling3p0StandardTextToVideoDuration {
  match duration {
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::ThreeSeconds) => EnqueueKling3p0StandardTextToVideoDuration::ThreeSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::FourSeconds) => EnqueueKling3p0StandardTextToVideoDuration::FourSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::FiveSeconds) => EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::SixSeconds) => EnqueueKling3p0StandardTextToVideoDuration::SixSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::SevenSeconds) => EnqueueKling3p0StandardTextToVideoDuration::SevenSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::EightSeconds) => EnqueueKling3p0StandardTextToVideoDuration::EightSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::NineSeconds) => EnqueueKling3p0StandardTextToVideoDuration::NineSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::TenSeconds) => EnqueueKling3p0StandardTextToVideoDuration::TenSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::ElevenSeconds) => EnqueueKling3p0StandardTextToVideoDuration::ElevenSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::TwelveSeconds) => EnqueueKling3p0StandardTextToVideoDuration::TwelveSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::ThirteenSeconds) => EnqueueKling3p0StandardTextToVideoDuration::ThirteenSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::FourteenSeconds) => EnqueueKling3p0StandardTextToVideoDuration::FourteenSeconds,
    Some(Kling3p0StandardMultiFunctionVideoGenDuration::FifteenSeconds) => EnqueueKling3p0StandardTextToVideoDuration::FifteenSeconds,
    None => EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds,
  }
}

fn map_aspect_ratio_t2v(aspect_ratio: Option<Kling3p0StandardMultiFunctionVideoGenAspectRatio>) -> EnqueueKling3p0StandardTextToVideoAspectRatio {
  match aspect_ratio {
    Some(Kling3p0StandardMultiFunctionVideoGenAspectRatio::Square) => EnqueueKling3p0StandardTextToVideoAspectRatio::Square,
    Some(Kling3p0StandardMultiFunctionVideoGenAspectRatio::SixteenByNine) => EnqueueKling3p0StandardTextToVideoAspectRatio::SixteenByNine,
    Some(Kling3p0StandardMultiFunctionVideoGenAspectRatio::NineBySixteen) => EnqueueKling3p0StandardTextToVideoAspectRatio::NineBySixteen,
    None => EnqueueKling3p0StandardTextToVideoAspectRatio::Square,
  }
}

fn map_aspect_ratio_i2v(aspect_ratio: Option<Kling3p0StandardMultiFunctionVideoGenAspectRatio>) -> Option<EnqueueKling3p0StandardImageToVideoAspectRatio> {
  aspect_ratio.map(|ar| match ar {
    Kling3p0StandardMultiFunctionVideoGenAspectRatio::Square => EnqueueKling3p0StandardImageToVideoAspectRatio::Square,
    Kling3p0StandardMultiFunctionVideoGenAspectRatio::SixteenByNine => EnqueueKling3p0StandardImageToVideoAspectRatio::SixteenByNine,
    Kling3p0StandardMultiFunctionVideoGenAspectRatio::NineBySixteen => EnqueueKling3p0StandardImageToVideoAspectRatio::NineBySixteen,
  })
}
