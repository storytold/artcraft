use std::collections::HashMap;

use log::{error, info, warn};
use sqlx::pool::PoolConnection;
use artcraft_router::api::audio_list_ref::AudioListRef;
use artcraft_router::api::common_video_model::CommonVideoModel;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::api::video_list_ref::VideoListRef;
use artcraft_router::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use artcraft_router::generate::generate_video_v2::video_generation_draft_context::VideoGenerationDraftContext;
use artcraft_router::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::endpoint_helpers::refund_wallet_after_api_failure::refund_wallet_after_api_failure;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::bill_wallet::bill_wallet;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::build_router_client::build_router_client;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::pipeline_result::PipelineResult;
use crate::state::server_state::ServerState;

pub struct RunPipelineV2Args<'a> {
  pub router_builder: &'a GenerateVideoRequestBuilder,
  pub server_state: &'a ServerState,
  pub mysql_connection: &'a mut PoolConnection<sqlx::MySql>,
  pub user_token: &'a UserToken,
  pub media_file_to_url_map: &'a Option<HashMap<MediaFileToken, String>>,
  pub kinovi_character_id_map: &'a Option<HashMap<CharacterToken, String>>,
}

pub async fn run_pipeline_v2(args: RunPipelineV2Args<'_>) -> Result<PipelineResult, AdvancedCommonWebError> {
  let RunPipelineV2Args {
    router_builder,
    server_state,
    mysql_connection,
    user_token,
    media_file_to_url_map,
    kinovi_character_id_map,
  } = args;

  let provider = match router_builder.model {
    CommonVideoModel::HappyHorse1p0 => Provider::Seedance2Pro,
    CommonVideoModel::Seedance2p0 => Provider::Seedance2Pro,
    CommonVideoModel::Seedance2p0Fast => Provider::Seedance2Pro,
    CommonVideoModel::Seedance2p0Global => Provider::GmiCloud,
    CommonVideoModel::Seedance2p0FastGlobal => Provider::GmiCloud,
    _ => Provider::Fal,
  };

  // 1. Build execution request
  let mut exec_builder = router_builder.clone();
  exec_builder.provider = provider;

  // GmiCloud takes URLs directly (like Fal), not media file tokens.
  // Resolve tokens to URLs before building.
  if matches!(provider, Provider::GmiCloud) {
    resolve_media_tokens_to_urls(&mut exec_builder, media_file_to_url_map.as_ref());
  }

  let draft_or_request = exec_builder.build2()
      .map_err(|e| {
        warn!("Failed to build2 for v2 pipeline: {}", e);
        AdvancedCommonWebError::from_error(e)
      })?;

  // 2. Calculate cost.
  //    For Artcraft-billable models, swap provider to Artcraft so credits = cents.
  //    For GmiCloud, use the execution request's cost directly (no Artcraft equivalent).
  let cost = if matches!(provider, Provider::GmiCloud) {
    draft_or_request.estimate_cost()
      .map_err(|e| {
        warn!("Failed to estimate cost for v2 (GmiCloud): {}", e);
        AdvancedCommonWebError::from_error(e)
      })?
      .cost_in_usd_cents
      .unwrap_or(0)
  } else {
    let mut cost_builder = router_builder.clone();
    cost_builder.provider = Provider::Artcraft;

    cost_builder.build2()
      .map_err(|e| {
        warn!("Failed to build2 cost estimate for v2: {}", e);
        AdvancedCommonWebError::from_error(e)
      })?
      .estimate_cost()
      .map_err(|e| {
        warn!("Failed to estimate cost for v2: {}", e);
        AdvancedCommonWebError::from_error(e)
      })?
      .cost_in_credits
      .unwrap_or(0)
  };

  info!("v2 estimated cost: {} credits", cost);

  // 3. Bill wallet
  let billing = bill_wallet(user_token, cost, mysql_connection).await?;

  // 4. Upload media (if draft) and generate video.
  //    The entire block is wrapped so Kinovi failures trigger a refund.
  let result = upload_and_generate(
    draft_or_request,
    server_state,
    media_file_to_url_map.as_ref(),
    kinovi_character_id_map.as_ref(),
  ).await;

  // 5. On failure, refund wallet for Kinovi requests.
  if let Err(ref err) = result {
    if matches!(provider, Provider::Seedance2Pro) {
      if let Some(ledger_entry_token) = billing.maybe_wallet_ledger_entry_token.as_ref() {
        warn!("Kinovi v2 generation failed, issuing refund for {}: {:?}", ledger_entry_token.as_str(), err);

        let result = refund_wallet_after_api_failure(ledger_entry_token, mysql_connection).await;

        if let Err(refund_err) = result {
          error!("Failed to refund wallet after Kinovi v2 failure: {:?}", refund_err);
        }
      }
    }
  }

  let response = result?;

  info!("v2 generation response: {:?}", response);

  Ok(PipelineResult { billing, response })
}

/// Finalize the draft (uploading media if needed), then send the generation request.
///
/// This is the block that gets refunded on failure for Kinovi providers.
async fn upload_and_generate(
  draft_or_request: VideoGenerationDraftOrRequest,
  server_state: &ServerState,
  media_file_urls_by_token: Option<&HashMap<MediaFileToken, String>>,
  kinovi_character_ids: Option<&HashMap<CharacterToken, String>>,
) -> Result<GenerateVideoResponse, AdvancedCommonWebError> {

  let provider = draft_or_request.get_provider();
  let client = build_router_client(provider, server_state)?;

  let video_request = match draft_or_request {
    VideoGenerationDraftOrRequest::Request(request) => request,
    VideoGenerationDraftOrRequest::Draft(draft) => {
      let draft_context = VideoGenerationDraftContext {
        client: Some(&client),
        media_file_to_artcraft_url_map: media_file_urls_by_token,
        character_token_to_kinovi_id_map: kinovi_character_ids,
      };

      draft.finalize(draft_context)
          .await
          .map_err(|err| {
            warn!("Failed to finalize v2 draft: {:?}", err);
            AdvancedCommonWebError::from_error(err)
          })?
    }
  };

  video_request.send_request(&client)
      .await
      .map_err(|err| {
        warn!("v2 video generation failed: {:?}", err);
        AdvancedCommonWebError::from_error(err)
      })
}

/// For providers that take URLs directly (GmiCloud, Fal), swap
/// `ImageRef::MediaFileToken` → `ImageRef::Url` using the resolved map.
fn resolve_media_tokens_to_urls(
  builder: &mut GenerateVideoRequestBuilder,
  url_map: Option<&HashMap<MediaFileToken, String>>,
) {
  let map = match url_map {
    Some(m) => m,
    None => return,
  };

  // start_frame
  if let Some(ImageRef::MediaFileToken(ref token)) = builder.start_frame {
    if let Some(url) = map.get(token) {
      builder.start_frame = Some(ImageRef::Url(url.clone()));
    }
  }

  // end_frame
  if let Some(ImageRef::MediaFileToken(ref token)) = builder.end_frame {
    if let Some(url) = map.get(token) {
      builder.end_frame = Some(ImageRef::Url(url.clone()));
    }
  }

  // reference_images
  if let Some(ImageListRef::MediaFileTokens(ref tokens)) = builder.reference_images {
    let urls: Vec<String> = tokens.iter()
      .filter_map(|t| map.get(t).cloned())
      .collect();
    if !urls.is_empty() {
      builder.reference_images = Some(ImageListRef::Urls(urls));
    }
  }

  // reference_videos
  if let Some(VideoListRef::MediaFileTokens(ref tokens)) = builder.reference_videos {
    let urls: Vec<String> = tokens.iter()
      .filter_map(|t| map.get(t).cloned())
      .collect();
    if !urls.is_empty() {
      builder.reference_videos = Some(VideoListRef::Urls(urls));
    }
  }

  // reference_audio
  if let Some(AudioListRef::MediaFileTokens(ref tokens)) = builder.reference_audio {
    let urls: Vec<String> = tokens.iter()
      .filter_map(|t| map.get(t).cloned())
      .collect();
    if !urls.is_empty() {
      builder.reference_audio = Some(AudioListRef::Urls(urls));
    }
  }
}
