use std::sync::Arc;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::lookup::fetch_all_required_media_files::fetch_all_required_media_files;
use crate::util::traits::into_media_links_trait::IntoMediaLinks;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::video::generate_kling_2_1_pro_image_to_video::{GenerateKling21ProAspectRatio, GenerateKling21ProImageToVideoRequest};
use artcraft_api_defs::generate::video::generate_kling_2_1_pro_image_to_video::{GenerateKling21ProDuration, GenerateKling21ProImageToVideoResponse};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::visibility::Visibility;
use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
use fal_client::requests::webhook::video::image::enqueue_kling_v2p1_pro_image_to_video_webhook::enqueue_kling_v2p1_pro_image_to_video_webhook;
use fal_client::requests::webhook::video::image::enqueue_kling_v2p1_pro_image_to_video_webhook::Kling2p1ProArgs;
use fal_client::requests::webhook::video::image::enqueue_kling_v2p1_pro_image_to_video_webhook::Kling2p1ProAspectRatio;
use fal_client::requests::webhook::video::image::enqueue_kling_v2p1_pro_image_to_video_webhook::Kling2p1ProDuration;
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::insert_generic_inference_job_for_fal_queue;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::FalCategory;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue::InsertGenericInferenceForFalArgs;
use mysql_queries::queries::generic_inference::fal::insert_generic_inference_job_for_fal_queue_with_apriori_job_token::{insert_generic_inference_job_for_fal_queue_with_apriori_job_token, InsertGenericInferenceForFalWithAprioriJobTokenArgs};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::media_files::get::get_media_file::{get_media_file, get_media_file_with_connection};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use sqlx::Acquire;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use utoipa::ToSchema;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_generation_mode::CommonGenerationMode;

/// Kling 2.1 Pro Image to Video
#[utoipa::path(
  post,
  tag = "Generate Videos",
  path = "/v1/generate/video/kling_2.1_pro_image_to_video",
  responses(
    (status = 200, description = "Success", body = GenerateKling21ProImageToVideoResponse),
  ),
  params(
    ("request" = GenerateKling21ProImageToVideoRequest, description = "Payload for Request"),
  )
)]
pub async fn generate_kling_2_1_pro_video_handler(
  http_request: HttpRequest,
  request: Json<GenerateKling21ProImageToVideoRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<Json<GenerateKling21ProImageToVideoResponse>, CommonWebError> {

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

  let start_frame_media_file_token = match &request.media_file_token {
    Some(token) => token,
    None => {
      warn!("No media file token provided");
      return Err(CommonWebError::BadInputWithSimpleMessage("No media file token provided".to_string()));
    }
  };

  let mut tokens = vec![
    start_frame_media_file_token.clone(),
  ];

  let maybe_end_frame_image_media_token = request.end_frame_image_media_token.as_ref();

  if let Some(end_frame_token) = maybe_end_frame_image_media_token {
    tokens.push(end_frame_token.clone());
  }

  let media_files = fetch_all_required_media_files(
    &mut mysql_connection,
    &tokens,
  ).await?;

  for media_file in media_files.iter() {
    if !media_file.media_type.is_jpg_or_png_or_legacy_image() {
      return Err(CommonWebError::BadInputWithSimpleMessage("Media file must be a JPG or PNG image".to_string()));
    }
  }

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("invalid idempotency token".to_string())
      })?;

  let media_domain = get_media_domain(&http_request);

  let start_frame_url = media_files.iter()
      .find(|file| &file.token == start_frame_media_file_token)
      .map(|file| file.to_media_links(media_domain, server_state.server_environment))
      .map(|file| file.cdn_url)
      .ok_or_else(|| {
        warn!("Start frame media file not found after fetch");
        CommonWebError::NotFound
      })?;

  let maybe_end_frame_url = match maybe_end_frame_image_media_token {
    None => None,
    Some(end_frame_token) => Some(media_files.iter()
        .find(|file| &file.token == end_frame_token)
        .map(|file| file.to_media_links(media_domain, server_state.server_environment))
        .map(|file| file.cdn_url)
        .ok_or_else(|| {
          warn!("End frame media file not found after fetch");
          CommonWebError::NotFound
        })?),
  };

  info!("Fal webhook URL: {}", server_state.fal.webhook_url);
  
  let apriori_job_token = InferenceJobToken::generate();
  
  let prompt = request.prompt
      .as_deref()
      .map(|prompt| prompt.trim())
      .unwrap_or_else(|| "");
  
  let aspect_ratio = match &request.aspect_ratio {
    Some(GenerateKling21ProAspectRatio::Square) => Kling2p1ProAspectRatio::Square,
    Some(GenerateKling21ProAspectRatio::WideSixteenNine) => Kling2p1ProAspectRatio::WideSixteenNine,
    Some(GenerateKling21ProAspectRatio::TallNineSixteen) => Kling2p1ProAspectRatio::TallNineSixteen,
    None => Kling2p1ProAspectRatio::WideSixteenNine, // Default to 16:9
  };
  
  let duration = match &request.duration {
    Some(GenerateKling21ProDuration::FiveSeconds) => Kling2p1ProDuration::FiveSeconds,
    Some(GenerateKling21ProDuration::TenSeconds) => Kling2p1ProDuration::TenSeconds,
    None => Kling2p1ProDuration::FiveSeconds, 
  };
  
  let args = Kling2p1ProArgs {
    image_url: start_frame_url,
    end_frame_image_url: maybe_end_frame_url,
    webhook_url: &server_state.fal.webhook_url,
    duration,
    prompt,
    aspect_ratio,
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

  let fal_result = enqueue_kling_v2p1_pro_image_to_video_webhook(args)
      .await
      .map_err(|err| {
        warn!("Error calling enqueue_kling_21_pro_image_to_video_webhook: {:?}", err);
        CommonWebError::ServerError
      })?;

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
    maybe_model_type: Some(CommonModelType::Kling21Pro),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: Some(prompt),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: Some(CommonGenerationMode::Keyframe), // TODO: This endpoint only supports keyframes for now
    maybe_aspect_ratio: request.aspect_ratio.as_ref().map(|ar| match ar {
      GenerateKling21ProAspectRatio::Square => CommonAspectRatio::Square,
      GenerateKling21ProAspectRatio::WideSixteenNine => CommonAspectRatio::WideSixteenByNine,
      GenerateKling21ProAspectRatio::TallNineSixteen => CommonAspectRatio::TallNineBySixteen,
    }),
    maybe_resolution: None,
    maybe_batch_count: None,
    maybe_generate_audio: None,
    maybe_duration_seconds: request.duration.as_ref().map(|d| match d {
      GenerateKling21ProDuration::FiveSeconds => 5,
      GenerateKling21ProDuration::TenSeconds => 10,
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

  Ok(Json(GenerateKling21ProImageToVideoResponse {
    success: true,
    inference_job_token: job_token,
  }))
}
