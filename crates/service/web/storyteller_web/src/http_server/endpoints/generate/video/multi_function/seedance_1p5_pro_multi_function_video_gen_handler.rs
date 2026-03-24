use std::collections::HashMap;
use std::sync::Arc;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::lookup::lookup_image_urls_as_map::lookup_image_urls_as_map;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::video::multi_function::seedance_1p5_pro_multi_function_video_gen::{Seedance1p5ProMultiFunctionVideoGenAspectRatio, Seedance1p5ProMultiFunctionVideoGenDuration, Seedance1p5ProMultiFunctionVideoGenRequest, Seedance1p5ProMultiFunctionVideoGenResolution, Seedance1p5ProMultiFunctionVideoGenResponse};
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::visibility::Visibility;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::video::image::enqueue_seedance_1p5_pro_image_to_video_webhook::{enqueue_seedance_1p5_pro_image_to_video_webhook, EnqueueSeedance1p5ProImageToVideoArgs, EnqueueSeedance1p5ProImageToVideoAspectRatio, EnqueueSeedance1p5ProImageToVideoDuration, EnqueueSeedance1p5ProImageToVideoResolution};
use fal_client::requests::webhook::video::text::enqueue_seedance_1p5_pro_text_to_video_webhook::{enqueue_seedance_1p5_pro_text_to_video_webhook, EnqueueSeedance1p5ProTextToVideoArgs, EnqueueSeedance1p5ProTextToVideoAspectRatio, EnqueueSeedance1p5ProTextToVideoDuration, EnqueueSeedance1p5ProTextToVideoResolution};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{insert_generic_inference_job_for_fal_queue_with_apriori_job_token, InsertGenericInferenceForFalWithAprioriJobTokenArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use sqlx::Acquire;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;


/// Seedance 1.5 Pro Multi-Function (text and image to video)
#[utoipa::path(
  post,
  tag = "Generate Video (Multi-Function)",
  path = "/v1/generate/video/multi_function/seedance_1p5_pro",
  responses(
    (status = 200, description = "Success", body = Seedance1p5ProMultiFunctionVideoGenResponse),
  ),
  params(
    ("request" = Seedance1p5ProMultiFunctionVideoGenRequest, description = "Payload for Request"),
  )
)]
pub async fn seedance_1p5_pro_multi_function_video_gen_handler(
  http_request: HttpRequest,
  request: Json<Seedance1p5ProMultiFunctionVideoGenRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<Seedance1p5ProMultiFunctionVideoGenResponse>, CommonWebError> {

  info!("Request: {:?}", request);
  
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

  // Collect media tokens to look up
  let mut query_media_tokens = Vec::new();

  if let Some(start_frame_token) = request.start_frame_image_media_token.as_ref() {
    query_media_tokens.push(start_frame_token.to_owned());
  }

  if let Some(end_frame_token) = request.end_frame_image_media_token.as_ref() {
    query_media_tokens.push(end_frame_token.to_owned());
  }

  let image_urls_by_token = if query_media_tokens.is_empty() {
    HashMap::new()
  } else {
    info!("Looking up image media tokens: {:?}", query_media_tokens);
    lookup_image_urls_as_map(
      &http_request,
      &mut mysql_connection,
      server_state.server_environment,
      &query_media_tokens,
    ).await?
  };

  let maybe_image_url = match request.start_frame_image_media_token.as_ref() {
    None => None,
    Some(token) => match image_urls_by_token.get(token) {
      Some(url) => Some(url.to_string()),
      None => {
        return Err(CommonWebError::BadInputWithSimpleMessage("Media for start frame not found.".to_string()));
      }
    }
  };

  let maybe_end_image_url = match request.end_frame_image_media_token.as_ref() {
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

  if let Some(image_url) = maybe_image_url {
    info!("image-to-video case");
    generation_mode = CommonGenerationMode::Keyframe;

    let duration = map_duration_i2v(request.duration);
    let aspect_ratio = map_aspect_ratio_i2v(request.aspect_ratio);
    let resolution = map_resolution_i2v(request.resolution);

    let args = EnqueueSeedance1p5ProImageToVideoArgs {
      image_url,
      end_image_url: maybe_end_image_url,
      prompt: request.prompt.as_deref().unwrap_or("").to_string(),
      duration: Some(duration),
      aspect_ratio: Some(aspect_ratio),
      resolution: Some(resolution),
      generate_audio: Some(generate_audio),
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

    fal_result = enqueue_seedance_1p5_pro_image_to_video_webhook(args)
        .await
        .map_err(|err| {
          warn!("Error calling enqueue_seedance_1p5_pro_image_to_video_webhook: {:?}", err);
          CommonWebError::ServerError
        })?;

  } else {
    info!("text-to-video case");
    generation_mode = CommonGenerationMode::Text;

    let duration = map_duration_t2v(request.duration);
    let aspect_ratio = map_aspect_ratio_t2v(request.aspect_ratio);
    let resolution = map_resolution_t2v(request.resolution);

    let args = EnqueueSeedance1p5ProTextToVideoArgs {
      prompt: request.prompt.as_deref().unwrap_or("").to_string(),
      duration: Some(duration),
      aspect_ratio: Some(aspect_ratio),
      resolution: Some(resolution),
      generate_audio: Some(generate_audio),
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

    fal_result = enqueue_seedance_1p5_pro_text_to_video_webhook(args)
        .await
        .map_err(|err| {
          warn!("Error calling enqueue_seedance_1p5_pro_text_to_video_webhook: {:?}", err);
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
    maybe_model_type: Some(CommonModelType::Seedance1p5Pro),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: Some(generation_mode),
    maybe_aspect_ratio: request.aspect_ratio.as_ref().map(|ar| match ar {
      Seedance1p5ProMultiFunctionVideoGenAspectRatio::Auto => CommonAspectRatio::Auto,
      Seedance1p5ProMultiFunctionVideoGenAspectRatio::TwentyOneByNine => CommonAspectRatio::WideTwentyOneByNine,
      Seedance1p5ProMultiFunctionVideoGenAspectRatio::SixteenByNine => CommonAspectRatio::WideSixteenByNine,
      Seedance1p5ProMultiFunctionVideoGenAspectRatio::FourByThree => CommonAspectRatio::WideFourByThree,
      Seedance1p5ProMultiFunctionVideoGenAspectRatio::Square => CommonAspectRatio::Square,
      Seedance1p5ProMultiFunctionVideoGenAspectRatio::ThreeByFour => CommonAspectRatio::TallThreeByFour,
      Seedance1p5ProMultiFunctionVideoGenAspectRatio::NineBySixteen => CommonAspectRatio::TallNineBySixteen,
    }),
    maybe_resolution: None,
    maybe_batch_count: None,
    maybe_generate_audio: Some(generate_audio),
    maybe_duration_seconds: request.duration.as_ref().map(|d| match d {
      Seedance1p5ProMultiFunctionVideoGenDuration::FourSeconds => 4,
      Seedance1p5ProMultiFunctionVideoGenDuration::FiveSeconds => 5,
      Seedance1p5ProMultiFunctionVideoGenDuration::SixSeconds => 6,
      Seedance1p5ProMultiFunctionVideoGenDuration::SevenSeconds => 7,
      Seedance1p5ProMultiFunctionVideoGenDuration::EightSeconds => 8,
      Seedance1p5ProMultiFunctionVideoGenDuration::NineSeconds => 9,
      Seedance1p5ProMultiFunctionVideoGenDuration::TenSeconds => 10,
      Seedance1p5ProMultiFunctionVideoGenDuration::ElevenSeconds => 11,
      Seedance1p5ProMultiFunctionVideoGenDuration::TwelveSeconds => 12,
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

  Ok(Json(Seedance1p5ProMultiFunctionVideoGenResponse {
    success: true,
    inference_job_token: job_token,
  }))
}

fn map_duration_i2v(d: Option<Seedance1p5ProMultiFunctionVideoGenDuration>) -> EnqueueSeedance1p5ProImageToVideoDuration {
  match d {
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::FourSeconds) => EnqueueSeedance1p5ProImageToVideoDuration::FourSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::FiveSeconds) => EnqueueSeedance1p5ProImageToVideoDuration::FiveSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::SixSeconds) => EnqueueSeedance1p5ProImageToVideoDuration::SixSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::SevenSeconds) => EnqueueSeedance1p5ProImageToVideoDuration::SevenSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::EightSeconds) => EnqueueSeedance1p5ProImageToVideoDuration::EightSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::NineSeconds) => EnqueueSeedance1p5ProImageToVideoDuration::NineSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::TenSeconds) => EnqueueSeedance1p5ProImageToVideoDuration::TenSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::ElevenSeconds) => EnqueueSeedance1p5ProImageToVideoDuration::ElevenSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::TwelveSeconds) => EnqueueSeedance1p5ProImageToVideoDuration::TwelveSeconds,
    None => EnqueueSeedance1p5ProImageToVideoDuration::FiveSeconds,
  }
}

fn map_duration_t2v(d: Option<Seedance1p5ProMultiFunctionVideoGenDuration>) -> EnqueueSeedance1p5ProTextToVideoDuration {
  match d {
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::FourSeconds) => EnqueueSeedance1p5ProTextToVideoDuration::FourSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::FiveSeconds) => EnqueueSeedance1p5ProTextToVideoDuration::FiveSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::SixSeconds) => EnqueueSeedance1p5ProTextToVideoDuration::SixSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::SevenSeconds) => EnqueueSeedance1p5ProTextToVideoDuration::SevenSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::EightSeconds) => EnqueueSeedance1p5ProTextToVideoDuration::EightSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::NineSeconds) => EnqueueSeedance1p5ProTextToVideoDuration::NineSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::TenSeconds) => EnqueueSeedance1p5ProTextToVideoDuration::TenSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::ElevenSeconds) => EnqueueSeedance1p5ProTextToVideoDuration::ElevenSeconds,
    Some(Seedance1p5ProMultiFunctionVideoGenDuration::TwelveSeconds) => EnqueueSeedance1p5ProTextToVideoDuration::TwelveSeconds,
    None => EnqueueSeedance1p5ProTextToVideoDuration::FiveSeconds,
  }
}

fn map_aspect_ratio_i2v(ar: Option<Seedance1p5ProMultiFunctionVideoGenAspectRatio>) -> EnqueueSeedance1p5ProImageToVideoAspectRatio {
  match ar {
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::TwentyOneByNine) => EnqueueSeedance1p5ProImageToVideoAspectRatio::TwentyOneByNine,
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::SixteenByNine) => EnqueueSeedance1p5ProImageToVideoAspectRatio::SixteenByNine,
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::FourByThree) => EnqueueSeedance1p5ProImageToVideoAspectRatio::FourByThree,
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::Square) => EnqueueSeedance1p5ProImageToVideoAspectRatio::Square,
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::ThreeByFour) => EnqueueSeedance1p5ProImageToVideoAspectRatio::ThreeByFour,
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::NineBySixteen) => EnqueueSeedance1p5ProImageToVideoAspectRatio::NineBySixteen,
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::Auto) => EnqueueSeedance1p5ProImageToVideoAspectRatio::Auto,
    None => EnqueueSeedance1p5ProImageToVideoAspectRatio::SixteenByNine,
  }
}

fn map_aspect_ratio_t2v(ar: Option<Seedance1p5ProMultiFunctionVideoGenAspectRatio>) -> EnqueueSeedance1p5ProTextToVideoAspectRatio {
  match ar {
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::TwentyOneByNine) => EnqueueSeedance1p5ProTextToVideoAspectRatio::TwentyOneByNine,
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::SixteenByNine) => EnqueueSeedance1p5ProTextToVideoAspectRatio::SixteenByNine,
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::FourByThree) => EnqueueSeedance1p5ProTextToVideoAspectRatio::FourByThree,
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::Square) => EnqueueSeedance1p5ProTextToVideoAspectRatio::Square,
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::ThreeByFour) => EnqueueSeedance1p5ProTextToVideoAspectRatio::ThreeByFour,
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::NineBySixteen) => EnqueueSeedance1p5ProTextToVideoAspectRatio::NineBySixteen,
    Some(Seedance1p5ProMultiFunctionVideoGenAspectRatio::Auto) => EnqueueSeedance1p5ProTextToVideoAspectRatio::SixteenByNine,
    None => EnqueueSeedance1p5ProTextToVideoAspectRatio::SixteenByNine,
  }
}

fn map_resolution_i2v(r: Option<Seedance1p5ProMultiFunctionVideoGenResolution>) -> EnqueueSeedance1p5ProImageToVideoResolution {
  match r {
    Some(Seedance1p5ProMultiFunctionVideoGenResolution::FourEightyP) => EnqueueSeedance1p5ProImageToVideoResolution::FourEightyP,
    Some(Seedance1p5ProMultiFunctionVideoGenResolution::SevenTwentyP) => EnqueueSeedance1p5ProImageToVideoResolution::SevenTwentyP,
    Some(Seedance1p5ProMultiFunctionVideoGenResolution::TenEightyP) => EnqueueSeedance1p5ProImageToVideoResolution::TenEightyP,
    None => EnqueueSeedance1p5ProImageToVideoResolution::SevenTwentyP,
  }
}

fn map_resolution_t2v(r: Option<Seedance1p5ProMultiFunctionVideoGenResolution>) -> EnqueueSeedance1p5ProTextToVideoResolution {
  match r {
    Some(Seedance1p5ProMultiFunctionVideoGenResolution::FourEightyP) => EnqueueSeedance1p5ProTextToVideoResolution::FourEightyP,
    Some(Seedance1p5ProMultiFunctionVideoGenResolution::SevenTwentyP) => EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP,
    Some(Seedance1p5ProMultiFunctionVideoGenResolution::TenEightyP) => EnqueueSeedance1p5ProTextToVideoResolution::TenEightyP,
    None => EnqueueSeedance1p5ProTextToVideoResolution::SevenTwentyP,
  }
}
