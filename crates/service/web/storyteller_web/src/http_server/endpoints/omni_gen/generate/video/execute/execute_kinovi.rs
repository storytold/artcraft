//! Seedance2Pro / Kinovi provider execution path.
//!
//! Downloads all referenced media from our CDN, re-uploads to Seedance2Pro's
//! CDN, then calls the Seedance2Pro generate endpoint.

use std::collections::HashMap;

use log::{info, warn};
use url::Url;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_video_model::CommonVideoModel;
use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro_client::requests::generate_video::generate_video::{
  generate_video, GenerateVideoArgs, GenerateVideoRequest, KinoviBatchCount, KinoviModelType, KinoviResolution,
};
use seedance2pro_client::requests::prepare_file_upload::prepare_file_upload::{
  prepare_file_upload, PrepareFileUploadArgs,
};
use seedance2pro_client::requests::upload_file::upload_file::{upload_file, UploadFileArgs};
use tokens::tokens::media_files::MediaFileToken;
use url_utils::extension::extract_extension_from_url::{
  extract_extension_from_url, ExtractExtensions,
};

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;

use super::super::distill_video_request::DistilledVideoRequest;
use super::execute_generation::GenerationResult;

pub(super) async fn execute_generation_kinovi(
  _distilled: &DistilledVideoRequest,
  request: &OmniGenVideoCostAndGenerateRequest,
  server_state: &ServerState,
  media_file_hydration_map: Option<&HashMap<MediaFileToken, Url>>,
  kinovi_character_ids: Option<Vec<String>>,
) -> Result<GenerationResult, AdvancedCommonWebError> {
  let session = Seedance2ProSession::from_cookies_string(
    server_state.seedance2pro.cookies.clone()
  );

  // TODO(bt): Move this logic to `artcraft_router` as an intermediate step between plan and execute.

  let empty_map = HashMap::new();
  let hydration_map = media_file_hydration_map.unwrap_or(&empty_map);

  // Upload each media reference to Seedance2Pro CDN.
  let start_frame_url = upload_token_to_seedance2pro(
    &session, hydration_map, request.start_frame_image_media_token.as_ref(),
  ).await?;

  let end_frame_url = upload_token_to_seedance2pro(
    &session, hydration_map, request.end_frame_image_media_token.as_ref(),
  ).await?;

  let reference_image_urls = upload_tokens_to_seedance2pro(
    &session, hydration_map, request.reference_image_media_tokens.as_deref(),
  ).await?;

  let reference_video_urls = upload_tokens_to_seedance2pro(
    &session, hydration_map, request.reference_video_media_tokens.as_deref(),
  ).await?;

  let reference_audio_urls = upload_tokens_to_seedance2pro(
    &session, hydration_map, request.reference_audio_media_tokens.as_deref(),
  ).await?;

  // Determine generation mode.
  let is_keyframe = request.start_frame_image_media_token.is_some()
      || request.end_frame_image_media_token.is_some();
  let is_reference = request.reference_image_media_tokens.as_ref().map_or(false, |t| !t.is_empty())
      || request.reference_video_media_tokens.as_ref().map_or(false, |t| !t.is_empty())
      || request.reference_audio_media_tokens.as_ref().map_or(false, |t| !t.is_empty());

  // TODO(bt): Move this logic to `artcraft_router` to the `execute` phase.

  let generation_mode = if is_keyframe {
    CommonGenerationMode::Keyframe
  } else if is_reference {
    CommonGenerationMode::Reference
  } else {
    CommonGenerationMode::Text
  };

  // Map aspect ratio / duration / batch from the request.
  let resolution = map_common_aspect_ratio_to_kinovi_resolution(request.aspect_ratio);

  let duration_seconds = request.duration_seconds.unwrap_or(5).clamp(4, 15) as u8;

  let batch_count = match request.video_batch_count {
    Some(2) => KinoviBatchCount::Two,
    Some(4) => KinoviBatchCount::Four,
    _ => KinoviBatchCount::One,
  };

  let prompt = request.prompt.clone().unwrap_or_default();

  let model_type = match request.model {
    Some(CommonVideoModel::Seedance2p0Fast) => KinoviModelType::Seedance2Fast,
    _ => KinoviModelType::Seedance2Pro,
  };

  let video_gen_args = GenerateVideoArgs {
    session: &session,
    host_override: None,
    request: GenerateVideoRequest {
      model_type,
      prompt,
      resolution,
      duration_seconds,
      batch_count,
      start_frame_url,
      end_frame_url,
      reference_image_urls,
      reference_video_urls,
      reference_audio_urls,
      character_ids: kinovi_character_ids,
      use_face_blur_hack: None,
      output_resolution: None,
    },
  };

  let gen_response = generate_video(video_gen_args).await
    .map_err(|err| {
      warn!("Seedance2Pro generate_video failed: {:?}", err);
      AdvancedCommonWebError::from_error(err)
    })?;

  info!(
    "Seedance2Pro generation: task_id={}, order_id={}",
    gen_response.task_id, gen_response.order_id
  );

  let order_ids: Vec<String> = match gen_response.order_ids {
    Some(ids) if !ids.is_empty() => ids,
    _ => vec![gen_response.order_id.clone()],
  };

  Ok(GenerationResult {
    external_job_id: gen_response.order_id,
    is_seedance2pro: true,
    maybe_seedance_order_ids: Some(order_ids),
    generation_mode,
  })
}

// --- Upload helpers ---

/// Upload a single media token (if present) to Seedance2Pro CDN.
async fn upload_token_to_seedance2pro(
  session: &Seedance2ProSession,
  hydration_map: &HashMap<MediaFileToken, Url>,
  maybe_token: Option<&MediaFileToken>,
) -> Result<Option<String>, AdvancedCommonWebError> {
  let token = match maybe_token {
    None => return Ok(None),
    Some(t) => t,
  };

  let url = hydration_map.get(token).ok_or_else(|| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      format!("Media token not found in hydration map: {:?}", token))
  })?;

  let uploaded = upload_url_to_seedance2pro(session, url).await?;
  Ok(Some(uploaded))
}

/// Upload a list of media tokens (if present) to Seedance2Pro CDN.
async fn upload_tokens_to_seedance2pro(
  session: &Seedance2ProSession,
  hydration_map: &HashMap<MediaFileToken, Url>,
  maybe_tokens: Option<&[MediaFileToken]>,
) -> Result<Option<Vec<String>>, AdvancedCommonWebError> {
  let tokens = match maybe_tokens {
    None => return Ok(None),
    Some(tokens) if tokens.is_empty() => return Ok(None),
    Some(tokens) => tokens,
  };

  let mut urls = Vec::with_capacity(tokens.len());
  for token in tokens {
    let url = hydration_map.get(token).ok_or_else(|| {
      AdvancedCommonWebError::BadInputWithSimpleMessage(
        format!("Media token not found in hydration map: {:?}", token))
    })?;
    urls.push(upload_url_to_seedance2pro(session, url).await?);
  }
  Ok(Some(urls))
}

/// Download from our CDN and re-upload to Seedance2Pro.
async fn upload_url_to_seedance2pro(
  session: &Seedance2ProSession,
  our_cdn_url: &Url,
) -> Result<String, AdvancedCommonWebError> {
  let extension = extract_extension_from_url(our_cdn_url, &ExtractExtensions::All)
      .map(|ext| ext.without_period().to_string())
      .unwrap_or_else(|| "png".to_string());

  let file_bytes = http_download_url_to_bytes(our_cdn_url.as_str())
      .await
      .map_err(|err| {
        warn!("Error downloading media from CDN for Seedance2Pro upload: {:?}", err);
        AdvancedCommonWebError::from_error(err)
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
        AdvancedCommonWebError::from_error(err)
      })?;

  let upload_result = upload_file(UploadFileArgs {
    upload_url: prepare_result.upload_url,
    file_bytes,
    host_override: None,
  })
      .await
      .map_err(|err| {
        warn!("Error uploading file to seedance2pro: {:?}", err);
        AdvancedCommonWebError::from_error(err)
      })?;

  Ok(upload_result.public_url)
}

/// Map a CommonAspectRatio to the Seedance2Pro KinoviResolution enum.
fn map_common_aspect_ratio_to_kinovi_resolution(aspect_ratio: Option<CommonAspectRatio>) -> KinoviResolution {
  match aspect_ratio {
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => KinoviResolution::Landscape16x9,
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => KinoviResolution::Portrait9x16,
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => KinoviResolution::Square1x1,
    Some(CommonAspectRatio::WideFourByThree) => KinoviResolution::Standard4x3,
    Some(CommonAspectRatio::TallThreeByFour) => KinoviResolution::Portrait3x4,
    // For unsupported aspect ratios, pick the nearest match.
    Some(CommonAspectRatio::WideFiveByFour) | Some(CommonAspectRatio::WideThreeByTwo) => KinoviResolution::Standard4x3,
    Some(CommonAspectRatio::WideTwentyOneByNine) => KinoviResolution::Landscape16x9,
    Some(CommonAspectRatio::TallFourByFive) | Some(CommonAspectRatio::TallTwoByThree) => KinoviResolution::Portrait3x4,
    Some(CommonAspectRatio::TallNineByTwentyOne) => KinoviResolution::Portrait9x16,
    // Auto or None — default to landscape.
    _ => KinoviResolution::Landscape16x9,
  }
}
