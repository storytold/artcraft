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
use artcraft_api_defs::generate::video::multi_function::sora_2_multi_function_video_gen::{Sora2MultiFunctionVideoGenAspectRatio, Sora2MultiFunctionVideoGenDuration, Sora2MultiFunctionVideoGenRequest, Sora2MultiFunctionVideoGenResolution, Sora2MultiFunctionVideoGenResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use enums::common::visibility::Visibility;
use fal_client::creds::open_ai_api_key::OpenAiApiKey;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::video::image::enqueue_sora_2_image_to_video_webhook::{enqueue_sora_2_image_to_video_webhook, EnqueueSora2ImageToVideoArgs, EnqueueSora2ImageToVideoAspectRatio, EnqueueSora2ImageToVideoDurationSeconds, EnqueueSora2ImageToVideoResolution};
use fal_client::requests::webhook::video::text::enqueue_sora_2_text_to_video_webhook::{enqueue_sora_2_text_to_video_webhook, EnqueueSora2TextToVideoArgs, EnqueueSora2TextToVideoAspectRatio, EnqueueSora2TextToVideoDurationSeconds, EnqueueSora2TextToVideoResolution};
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{insert_generic_inference_job_for_fal_queue_with_apriori_job_token, InsertGenericInferenceForFalWithAprioriJobTokenArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::{batch_get_media_files_by_tokens, batch_get_media_files_by_tokens_with_connection};
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use server_environment::ServerEnvironment;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

/// Sora 2 Multi-Function (text and image to video)
#[utoipa::path(
  post,
  tag = "Generate Video (Multi-Function)",
  path = "/v1/generate/video/multi_function/sora_2",
  responses(
    (status = 200, description = "Success", body = Sora2MultiFunctionVideoGenResponse),
  ),
  params(
    ("request" = Sora2MultiFunctionVideoGenRequest, description = "Payload for Request"),
  )
)]
pub async fn sora_2_multi_function_video_gen_handler(
  http_request: HttpRequest,
  request: Json<Sora2MultiFunctionVideoGenRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<Sora2MultiFunctionVideoGenResponse>, CommonWebError> {
  
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

    // if let Some(end_frame_token) = request.end_frame_image_media_token.as_ref() {
    //   // NB: Masks are only relevant when this is an image editing exercise.
    //   tokens.push(end_frame_token.to_owned());
    // }

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

  let maybe_image_url = match request.image_media_token.as_ref() {
    None => None,
    Some(token) => match image_urls_by_token.get(token) {
      Some(url) => Some(url.to_string()),
      None => {
        return Err(CommonWebError::BadInputWithSimpleMessage("Media for start frame not found.".to_string()));
      }
    }
  };

  // let maybe_end_frame_image_url = match request.end_frame_image_media_token.as_ref() {
  //   None => None,
  //   Some(token) => match image_urls_by_token.get(token) {
  //     Some(url) => Some(url.to_string()),
  //     None => {
  //       return Err(CommonWebError::BadInputWithSimpleMessage("Media for end frame not found.".to_string()));
  //     }
  //   }
  // };
  
  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
      })?;

  info!("Fal webhook URL: {}", server_state.fal.webhook_url);

  let apriori_job_token = InferenceJobToken::generate();

  let fal_result;

  if let Some(image_url) = maybe_image_url {
    info!("image-to-video case");

    let duration = match request.duration {
      Some(Sora2MultiFunctionVideoGenDuration::FourSeconds) => EnqueueSora2ImageToVideoDurationSeconds::Four,
      Some(Sora2MultiFunctionVideoGenDuration::EightSeconds) => EnqueueSora2ImageToVideoDurationSeconds::Eight,
      Some(Sora2MultiFunctionVideoGenDuration::TwelveSeconds) => EnqueueSora2ImageToVideoDurationSeconds::Twelve,
      None => EnqueueSora2ImageToVideoDurationSeconds::Eight,
    };

    let aspect_ratio = match request.aspect_ratio {
      Some(Sora2MultiFunctionVideoGenAspectRatio::Auto) => EnqueueSora2ImageToVideoAspectRatio::Auto,
      Some(Sora2MultiFunctionVideoGenAspectRatio::SixteenByNine) => EnqueueSora2ImageToVideoAspectRatio::SixteenByNine,
      Some(Sora2MultiFunctionVideoGenAspectRatio::NineBySixteen) => EnqueueSora2ImageToVideoAspectRatio::NineBySixteen,
      None => EnqueueSora2ImageToVideoAspectRatio::SixteenByNine,
    };

    let resolution = match request.resolution {
      Some(Sora2MultiFunctionVideoGenResolution::Auto) => EnqueueSora2ImageToVideoResolution::Auto,
      Some(Sora2MultiFunctionVideoGenResolution::SevenTwentyP) => EnqueueSora2ImageToVideoResolution::SevenTwentyP,
      None => EnqueueSora2ImageToVideoResolution::SevenTwentyP,
    };

    let args = EnqueueSora2ImageToVideoArgs {
      image_url,
      prompt: request.prompt.as_deref().unwrap_or("").to_string(),
      duration: Some(duration),
      aspect_ratio: Some(aspect_ratio),
      resolution: Some(resolution),
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

    fal_result = enqueue_sora_2_image_to_video_webhook(args)
        .await
        .map_err(|err| {
          warn!("Error calling enqueue_sora_2_image_to_video_webhook: {:?}", err);
          CommonWebError::ServerError
        })?;

  } else {
    info!("text-to-video case");
    
    let duration = match request.duration {
      Some(Sora2MultiFunctionVideoGenDuration::FourSeconds) => EnqueueSora2TextToVideoDurationSeconds::Four,
      Some(Sora2MultiFunctionVideoGenDuration::EightSeconds) => EnqueueSora2TextToVideoDurationSeconds::Eight,
      Some(Sora2MultiFunctionVideoGenDuration::TwelveSeconds) => EnqueueSora2TextToVideoDurationSeconds::Twelve,
      None => EnqueueSora2TextToVideoDurationSeconds::Eight,
    };

    let aspect_ratio = match request.aspect_ratio {
      Some(Sora2MultiFunctionVideoGenAspectRatio::Auto) => EnqueueSora2TextToVideoAspectRatio::SixteenByNine,
      Some(Sora2MultiFunctionVideoGenAspectRatio::SixteenByNine) => EnqueueSora2TextToVideoAspectRatio::SixteenByNine,
      Some(Sora2MultiFunctionVideoGenAspectRatio::NineBySixteen) => EnqueueSora2TextToVideoAspectRatio::NineBySixteen,
      None => EnqueueSora2TextToVideoAspectRatio::SixteenByNine,
    };

    let resolution = match request.resolution {
      Some(Sora2MultiFunctionVideoGenResolution::Auto) => EnqueueSora2TextToVideoResolution::SevenTwentyP,
      Some(Sora2MultiFunctionVideoGenResolution::SevenTwentyP) => EnqueueSora2TextToVideoResolution::SevenTwentyP,
      None => EnqueueSora2TextToVideoResolution::SevenTwentyP,
    };

    let args = EnqueueSora2TextToVideoArgs {
      prompt: request.prompt.as_deref().unwrap_or("").to_string(),
      duration: Some(duration),
      aspect_ratio: Some(aspect_ratio),
      resolution: Some(resolution),
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

    fal_result = enqueue_sora_2_text_to_video_webhook(args)
        .await
        .map_err(|err| {
          warn!("Error calling enqueue_sora_2_text_to_video_webhook: {:?}", err);
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
    maybe_model_type: Some(ModelType::Sora2),
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

    // if let Some(media_token) = &request.end_frame_image_media_token {
    //   context_items.push(PromptContextItem {
    //     media_token: media_token.clone(),
    //     context_semantic_type: PromptContextSemanticType::VidEndFrame,
    //   });
    // }

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

  Ok(Json(Sora2MultiFunctionVideoGenResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
