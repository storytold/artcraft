use std::collections::HashMap;
use std::sync::Arc;

use crate::billing::wallets::attempt_wallet_deduction::attempt_wallet_deduction_else_common_web_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoint_helpers::refund_wallet_after_api_failure::refund_wallet_after_api_failure;
use crate::http_server::endpoints::generate::common::payments_error_test::payments_error_test;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use crate::util::lookup::lookup_media_file_urls_as_map::lookup_media_file_urls_as_map;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
  Seedance2p0AspectRatio, Seedance2p0BatchCount, Seedance2p0MultiFunctionVideoGenRequest,
  Seedance2p0MultiFunctionVideoGenResponse,
};
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::visibility::Visibility;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
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
use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro_client::requests::generate_video::generate_video::{
  generate_video, BatchCount, GenerateVideoArgs, GenerateVideoResponse, Resolution,
};
use seedance2pro_client::requests::prepare_file_upload::prepare_file_upload::{
  prepare_file_upload, PrepareFileUploadArgs,
};
use seedance2pro_client::requests::upload_file::upload_file::{upload_file, UploadFileArgs};
use sqlx::Acquire;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use url::Url;
use url_utils::extension::extract_extension_from_url::{extract_extension_from_url, ExtractExtensions};
use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;

// ======================== Result of a successful generation ========================

/// Everything the caller needs after a successful upload + generate cycle.
struct SeedanceGenerationResult {
  gen_response: GenerateVideoResponse,
  generation_mode: CommonGenerationMode,
}

// ======================== Handler ========================

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

  let maybe_avt_token = server_state
      .avt_cookie_manager
      .get_avt_token_from_request(&http_request);

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      return Err(CommonWebError::NotAuthorized);
    }
  };

  let user_token = &user_session.user_token;

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
  }

  // --- Collect all media tokens to look up ---

  let mut all_media_tokens: Vec<MediaFileToken> = Vec::new();

  if let Some(token) = request.start_frame_media_token.as_ref() {
    all_media_tokens.push(token.clone());
  }
  if let Some(token) = request.end_frame_media_token.as_ref() {
    all_media_tokens.push(token.clone());
  }
  if let Some(tokens) = request.reference_image_media_tokens.as_ref() {
    all_media_tokens.extend(tokens.iter().cloned());
  }
  if let Some(tokens) = request.reference_video_media_tokens.as_ref() {
    all_media_tokens.extend(tokens.iter().cloned());
  }
  if let Some(tokens) = request.reference_audio_media_tokens.as_ref() {
    all_media_tokens.extend(tokens.iter().cloned());
  }

  let file_urls_by_token = if all_media_tokens.is_empty() {
    HashMap::new()
  } else {
    info!("Looking up media file tokens: {:?}", all_media_tokens);
    lookup_media_file_urls_as_map(
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

  // --- Calculate cost and charge wallet upfront (before uploads) ---

  let resolution = map_resolution(request.aspect_ratio);
  let batch_count = map_batch_count(request.batch_count);
  let duration_seconds = request.duration_seconds.unwrap_or(5).clamp(4, 15);

  let cost_in_cents = estimate_cost_upfront(resolution, batch_count, duration_seconds);

  let apriori_job_token = InferenceJobToken::generate();

  info!("Charging wallet: {} cents ({} credits)", cost_in_cents, cost_in_cents);

  let deduction_result = attempt_wallet_deduction_else_common_web_error(
    user_token,
    Some(apriori_job_token.as_str()),
    cost_in_cents,
    &mut mysql_connection,
  ).await?;

  // --- Determine session and generate ---

  let user_feature_flags =
      UserSessionFeatureFlags::new(user_session.maybe_feature_flags.as_deref());

  let is_whitelisted = user_feature_flags.has_seedance_whitelist();

  let gen_result = if is_whitelisted {
    info!("User {:?} is seedance-whitelisted, trying whitelist session first", user_token);

    let whitelist_session = Seedance2ProSession::from_cookies_string(
      server_state.seedance2pro.cookies_whitelist.clone()
    );

    let result = upload_and_generate(
      &whitelist_session,
      &request,
      &file_urls_by_token,
      resolution,
      batch_count,
      duration_seconds,
    ).await;

    match result {
      Ok(result) => {
        info!("Whitelist session succeeded for user {:?}", user_token);
        result
      }
      Err(err) => {
        warn!("Whitelist session failed for user {:?}: {:?}, falling back to regular session", user_token, err);

        let regular_session = Seedance2ProSession::from_cookies_string(
          server_state.seedance2pro.cookies.clone()
        );

        let result = upload_and_generate(
          &regular_session,
          &request,
          &file_urls_by_token,
          resolution,
          batch_count,
          duration_seconds,
        ).await;

        match result {
          Ok(result) => {
            info!("Regular session fallback succeeded for whitelisted user {:?}", user_token);
            result
          }
          Err(err) => {
            warn!("Regular session fallback also failed for user {:?}: {:?}", user_token, err);
            refund_wallet_after_api_failure(&deduction_result.ledger_entry_token, &mut mysql_connection).await?;
            return Err(CommonWebError::ServerError);
          }
        }
      }
    }
  } else {
    info!("User {:?} using regular seedance session", user_token);

    let regular_session = Seedance2ProSession::from_cookies_string(
      server_state.seedance2pro.cookies.clone()
    );

    let result = upload_and_generate(
      &regular_session,
      &request,
      &file_urls_by_token,
      resolution,
      batch_count,
      duration_seconds,
    ).await;

    match result {
      Ok(result) => result,
      Err(err) => {
        warn!("Error calling seedance2pro generate_video: {:?}", err);
        refund_wallet_after_api_failure(&deduction_result.ledger_entry_token, &mut mysql_connection).await?;
        return Err(CommonWebError::ServerError);
      }
    }
  };

  let gen_response = gen_result.gen_response;
  let generation_mode = gen_result.generation_mode;

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
    maybe_creator_user_token: Some(user_token),
    maybe_model_type: Some(CommonModelType::Seedance2p0),
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: None,
    maybe_other_args: None,
    maybe_generation_mode: Some(generation_mode),
    maybe_aspect_ratio: request.aspect_ratio.as_ref().map(|ar| match ar {
      Seedance2p0AspectRatio::Landscape16x9 => CommonAspectRatio::WideSixteenByNine,
      Seedance2p0AspectRatio::Portrait9x16 => CommonAspectRatio::TallNineBySixteen,
      Seedance2p0AspectRatio::Square1x1 => CommonAspectRatio::Square,
      Seedance2p0AspectRatio::Standard4x3 => CommonAspectRatio::WideFourByThree,
      Seedance2p0AspectRatio::Portrait3x4 => CommonAspectRatio::TallThreeByFour,
    }),
    maybe_resolution: None,
    maybe_batch_count: request.batch_count.map(|bc| match bc {
      Seedance2p0BatchCount::One => 1,
      Seedance2p0BatchCount::Two => 2,
      Seedance2p0BatchCount::Four => 4,
    }),
    maybe_generate_audio: None,
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

    let ref_token_groups: [(Option<&[MediaFileToken]>, PromptContextSemanticType); 3] = [
      (request.reference_image_media_tokens.as_deref(), PromptContextSemanticType::Imgref),
      (request.reference_video_media_tokens.as_deref(), PromptContextSemanticType::VidRef),
      (request.reference_audio_media_tokens.as_deref(), PromptContextSemanticType::Audioref),
    ];

    for (maybe_tokens, semantic_type) in ref_token_groups {
      if let Some(tokens) = maybe_tokens {
        for media_token in tokens {
          context_items.push(PromptContextItem {
            media_token: media_token.clone(),
            context_semantic_type: semantic_type,
          });
        }
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
        maybe_creator_user_token: Some(user_token),
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

// ======================== Helpers ========================

fn map_resolution(aspect_ratio: Option<Seedance2p0AspectRatio>) -> Resolution {
  match aspect_ratio {
    Some(Seedance2p0AspectRatio::Landscape16x9) => Resolution::Landscape16x9,
    Some(Seedance2p0AspectRatio::Portrait9x16) => Resolution::Portrait9x16,
    Some(Seedance2p0AspectRatio::Square1x1) => Resolution::Square1x1,
    Some(Seedance2p0AspectRatio::Standard4x3) => Resolution::Standard4x3,
    Some(Seedance2p0AspectRatio::Portrait3x4) => Resolution::Portrait3x4,
    None => Resolution::Landscape16x9,
  }
}

fn map_batch_count(batch_count: Option<Seedance2p0BatchCount>) -> BatchCount {
  match batch_count {
    Some(Seedance2p0BatchCount::One) | None => BatchCount::One,
    Some(Seedance2p0BatchCount::Two) => BatchCount::Two,
    Some(Seedance2p0BatchCount::Four) => BatchCount::Four,
  }
}

/// Estimate the cost without needing uploaded URLs. We construct a temporary
/// `GenerateVideoArgs` with dummy values for the session and URL fields.
fn estimate_cost_upfront(resolution: Resolution, batch_count: BatchCount, duration_seconds: u8) -> u64 {
  let dummy_session = Seedance2ProSession::from_cookies_string(String::new());
  let args = GenerateVideoArgs {
    session: &dummy_session,
    prompt: String::new(),
    resolution,
    duration_seconds,
    batch_count,
    start_frame_url: None,
    end_frame_url: None,
    reference_image_urls: None,
    reference_video_urls: None,
    reference_audio_urls: None,
    use_face_blur_hack: None,
    host_override: None,
  };
  args.estimate_cost_in_usd_cents()
}

/// Uploads all media files and calls generate_video using the given session.
/// Returns the generation response and the computed generation mode.
async fn upload_and_generate(
  session: &Seedance2ProSession,
  request: &Seedance2p0MultiFunctionVideoGenRequest,
  file_urls_by_token: &HashMap<MediaFileToken, Url>,
  resolution: Resolution,
  batch_count: BatchCount,
  duration_seconds: u8,
) -> Result<SeedanceGenerationResult, CommonWebError> {

  // --- Upload files to seedance2pro CDN ---

  let start_frame_url = match request.start_frame_media_token.as_ref() {
    None => None,
    Some(token) => match file_urls_by_token.get(token) {
      None => return Err(CommonWebError::BadInputWithSimpleMessage("Start frame media not found.".to_string())),
      Some(url) => Some(upload_to_seedance2pro(session, url).await?),
    }
  };

  let end_frame_url = match request.end_frame_media_token.as_ref() {
    None => None,
    Some(token) => match file_urls_by_token.get(token) {
      None => return Err(CommonWebError::BadInputWithSimpleMessage("End frame media not found.".to_string())),
      Some(url) => Some(upload_to_seedance2pro(session, url).await?),
    }
  };

  let reference_image_urls = upload_reference_tokens_to_seedance2pro(
    session,
    file_urls_by_token,
    request.reference_image_media_tokens.as_deref(),
    "Reference image",
  ).await?;

  let reference_video_urls = upload_reference_tokens_to_seedance2pro(
    session,
    file_urls_by_token,
    request.reference_video_media_tokens.as_deref(),
    "Reference video",
  ).await?;

  let reference_audio_urls = upload_reference_tokens_to_seedance2pro(
    session,
    file_urls_by_token,
    request.reference_audio_media_tokens.as_deref(),
    "Reference audio",
  ).await?;

  // --- Determine generation mode ---

  let is_keyframe = request.start_frame_media_token.is_some()
      || request.end_frame_media_token.is_some();

  let is_reference = request.reference_image_media_tokens.is_some()
      || request.reference_video_media_tokens.is_some()
      || request.reference_audio_media_tokens.is_some();

  let generation_mode = if is_keyframe {
    CommonGenerationMode::Keyframe
  } else if is_reference {
    CommonGenerationMode::Reference
  } else {
    CommonGenerationMode::Text
  };

  // --- Build args and generate ---

  let prompt = request.prompt.clone().unwrap_or_else(|| "".to_string());

  let video_gen_args = GenerateVideoArgs {
    session,
    prompt,
    resolution,
    duration_seconds,
    batch_count,
    start_frame_url,
    end_frame_url,
    reference_image_urls,
    reference_video_urls,
    reference_audio_urls,
    use_face_blur_hack: None,
    host_override: None,
  };

  let gen_response = generate_video(video_gen_args).await
    .map_err(|err| {
      warn!("Error calling seedance2pro generate_video: {:?}", err);
      CommonWebError::ServerError
    })?;

  Ok(SeedanceGenerationResult {
    gen_response,
    generation_mode,
  })
}

/// Uploads a list of reference media tokens to seedance2pro, returning the resulting URLs.
/// Returns `None` if the token list is absent or empty.
async fn upload_reference_tokens_to_seedance2pro(
  session: &Seedance2ProSession,
  file_urls_by_token: &HashMap<MediaFileToken, Url>,
  maybe_tokens: Option<&[MediaFileToken]>,
  label: &str,
) -> Result<Option<Vec<String>>, CommonWebError> {
  let tokens = match maybe_tokens {
    None => return Ok(None),
    Some(tokens) if tokens.is_empty() => return Ok(None),
    Some(tokens) => tokens,
  };

  let mut urls = Vec::with_capacity(tokens.len());

  for token in tokens {
    match file_urls_by_token.get(token) {
      None => return Err(CommonWebError::BadInputWithSimpleMessage(
        format!("{} media not found: {:?}", label, token),
      )),
      Some(url) => {
        let seedance_url = upload_to_seedance2pro(session, url).await?;
        urls.push(seedance_url);
      }
    }
  }
  Ok(Some(urls))
}

async fn upload_to_seedance2pro(
  session: &Seedance2ProSession,
  our_cdn_url: &Url,
) -> Result<String, CommonWebError> {
  let extension = extract_extension_from_url(our_cdn_url, &ExtractExtensions::All)
      .map(|ext| ext.without_period().to_string())
      .unwrap_or_else(|| "png".to_string());

  let cdn_url_str = our_cdn_url.as_str();

  let file_bytes = http_download_url_to_bytes(cdn_url_str)
      .await
      .map_err(|err| {
        warn!("Error downloading media file from CDN: {:?}", err);
        CommonWebError::ServerError
      })?
      .to_vec();

  let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
    session,
    extension,
    host_override: None,
  })
      .await
      .map_err(|err| {
        warn!("Error preparing seedance2pro file upload: {:?}", err);
        CommonWebError::ServerError
      })?;

  let upload_result = upload_file(UploadFileArgs {
    upload_url: prepare_result.upload_url,
    file_bytes,
    host_override: None,
  })
      .await
      .map_err(|err| {
        warn!("Error uploading file to seedance2pro: {:?}", err);
        CommonWebError::ServerError
      })?;

  Ok(upload_result.public_url)
}
