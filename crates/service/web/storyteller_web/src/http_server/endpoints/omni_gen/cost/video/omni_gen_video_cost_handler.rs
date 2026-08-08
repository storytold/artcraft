use std::convert::TryFrom;
use std::sync::Arc;

use actix_web::web::{self, Json};
use actix_web::HttpRequest;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_response::omni_gen_video_cost_response::OmniGenVideoCostResponse;
use artcraft_router::api::router_provider::RouterProvider;
use enums::common::generation::common_video_model::CommonVideoModel;
use log::warn;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::generate::common::probed_reference_videos::{
  download_and_probe_reference_videos, fetch_reference_video_sources,
};
use crate::http_server::endpoints::omni_gen::shared_utils::map_router_cost_error::map_router_cost_error;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::hydrate_router_request::hydrate_to_router_request;
use crate::state::server_state::ServerState;

/// Estimate the cost of a video generation.
#[utoipa::path(
  post,
  tag = "Omni Gen",
  path = "/v1/omni_gen/cost/video",
  request_body = OmniGenVideoCostAndGenerateRequest,
  responses(
    (status = 200, description = "Success", body = OmniGenVideoCostResponse),
    (status = 400, description = "Bad input"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn omni_gen_video_cost_handler(
  http_request: HttpRequest,
  request: Json<OmniGenVideoCostAndGenerateRequest>,
  maybe_server_state: Option<web::Data<Arc<ServerState>>>,
) -> Result<Json<OmniGenVideoCostResponse>, CommonWebError> {
  // NB: Deliberately no input validation here. The UI polls this endpoint
  // while the user is still composing the request (no prompt typed, nothing
  // attached), and pricing is a total function of the model and options.
  // Bad requests are rejected by the generate endpoint.
  let mut builder = hydrate_to_router_request(&request)?;

  builder.provider = RouterProvider::Artcraft; // NB: User is paying for ArtCraft credits / generation

  // Seedance 2.5 bills reference-video input seconds on top of the output
  // duration, so the quote needs the combined input duration. Prefer the
  // frontend-supplied `estimate_only` hint (cheap — the UI polls this
  // endpoint while composing); fall back to a best-effort server-side
  // download + ffprobe when it's absent. Either way this only shapes the
  // QUOTE: the generate endpoint always measures the inputs itself and
  // bills from its own measurement.
  if matches!(request.model, Some(CommonVideoModel::Seedance2p5)) {
    let frontend_input_seconds = request.estimate_only
      .and_then(|estimate| estimate.total_input_video_duration_millis)
      .map(millis_to_whole_seconds);

    if let Some(input_seconds) = frontend_input_seconds {
      builder.total_reference_video_input_seconds = Some(input_seconds);
    } else if let (Some(server_state), Some(video_tokens)) = (
      maybe_server_state.as_ref(),
      request.reference_video_media_tokens.as_deref().filter(|tokens| !tokens.is_empty()),
    ) {
      builder.total_reference_video_input_seconds =
        probe_input_seconds_best_effort(&http_request, server_state, video_tokens).await;
    }
  }

  let estimate = builder.build2()
    .map_err(map_router_cost_error)?
    .estimate_cost()
    .map_err(map_router_cost_error)?;

  Ok(Json(OmniGenVideoCostResponse {
    success: true,
    cost_in_credits: estimate.cost_in_credits,
    cost_in_usd_cents: estimate.cost_in_usd_cents,
    is_free: estimate.is_free,
    is_unlimited: estimate.is_unlimited,
    is_rate_limited: estimate.is_rate_limited,
    has_watermark: estimate.has_watermark,
    failures_are_refunded: estimate.failures_are_refunded,
  }))
}

/// Round a frontend-supplied millisecond duration UP to whole seconds,
/// saturating to `u16` (the router clamps to the model's max regardless).
fn millis_to_whole_seconds(millis: u32) -> u16 {
  u16::try_from(u64::from(millis).div_ceil(1_000)).unwrap_or(u16::MAX)
}

/// Probe the combined reference-video runtime for the quote, failing open.
/// The downloaded files are dropped after probing — only the generate
/// endpoint keeps them for the provider upload.
async fn probe_input_seconds_best_effort(
  http_request: &HttpRequest,
  server_state: &ServerState,
  video_tokens: &[MediaFileToken],
) -> Option<u16> {
  let video_sources = {
    // Scoped so the pool slot is released before the (slow) download+probe.
    let mut mysql_connection = match server_state.mysql_pool.acquire().await {
      Ok(connection) => connection,
      Err(err) => {
        warn!("Cost quote: failed to acquire connection for reference video probe: {:?}", err);
        return None;
      }
    };

    match fetch_reference_video_sources(
      video_tokens,
      http_request,
      server_state.server_environment,
      &mut mysql_connection,
    ).await {
      Ok(sources) => sources,
      Err(err) => {
        warn!("Cost quote: failed to fetch reference video sources: {:?}", err);
        return None;
      }
    }
  };

  match download_and_probe_reference_videos(&video_sources).await {
    Ok(probed) => Some(probed.total_input_seconds),
    Err(err) => {
      warn!("Cost quote: failed to probe reference video durations: {:?}", err);
      None
    }
  }
}

#[cfg(test)]
mod tests {
  use actix_http::StatusCode;
  use actix_web::test::TestRequest;
  use actix_web::ResponseError;
  use enums::common::generation::common_resolution::CommonResolution;
  use enums::common::generation::common_video_model::CommonVideoModel;

  use super::*;

  mod cost_without_inputs_tests {
    use super::*;

    /// Regression: xAI's v1.5 rejects text-to-video at generation time, but
    /// the cost endpoint must still quote an image-less request — the cost
    /// UI polls for a price before the user attaches an image. This request
    /// shape used to be rejected (handler validation, then a router build
    /// error that surfaced as a 500).
    #[tokio::test]
    async fn grok_1p5_without_an_image_gets_a_quote() {
      let response = post_cost_request(base_request(CommonVideoModel::GrokImagineVideo1p5))
        .await
        .expect("image-less grok 1.5 cost estimate should succeed");
      assert!(response.success);
      assert!(response.cost_in_credits.unwrap() > 0);
    }

    /// Flux 3 defaults (5s, 720p) quote at 98 credits; the 1080p tier quotes
    /// at 167 for 5s. Flux 3 Draft (always 720p) quotes at 35 for 5s.
    #[tokio::test]
    async fn flux_3_quotes_by_variant_and_resolution_tier() {
      let full_default = post_cost_request(base_request(CommonVideoModel::Flux3))
        .await
        .expect("flux 3 default cost estimate should succeed");
      assert_eq!(full_default.cost_in_credits, Some(98));

      let mut full_high_res = base_request(CommonVideoModel::Flux3);
      full_high_res.resolution = Some(CommonResolution::TenEightyP);
      let full_high_res_quote = post_cost_request(full_high_res)
        .await
        .expect("flux 3 1080p cost estimate should succeed");
      assert_eq!(full_high_res_quote.cost_in_credits, Some(167));

      let draft_default = post_cost_request(base_request(CommonVideoModel::Flux3Draft))
        .await
        .expect("flux 3 draft cost estimate should succeed");
      assert_eq!(draft_default.cost_in_credits, Some(35));
    }

    /// MiniMax H3 defaults (5s, 2K) quote at 150 credits; the 768P tier
    /// (720p and below) quotes at 92 for 5s.
    #[tokio::test]
    async fn minimax_h3_quotes_by_resolution_tier() {
      let default_quote = post_cost_request(base_request(CommonVideoModel::MinimaxH3))
        .await
        .expect("minimax h3 default cost estimate should succeed");
      assert_eq!(default_quote.cost_in_credits, Some(150));

      let mut low_res = base_request(CommonVideoModel::MinimaxH3);
      low_res.resolution = Some(CommonResolution::SevenTwentyP);
      let low_res_quote = post_cost_request(low_res)
        .await
        .expect("minimax h3 768P-tier cost estimate should succeed");
      assert_eq!(low_res_quote.cost_in_credits, Some(92));
    }

    #[tokio::test]
    async fn bare_model_gets_a_quote_for_representative_models() {
      for model in [
        CommonVideoModel::Flux3,
        CommonVideoModel::Flux3Draft,
        CommonVideoModel::GrokImagineVideo,
        CommonVideoModel::Kling3p0Pro,
        CommonVideoModel::MinimaxH3,
        CommonVideoModel::Seedance2p0,
        CommonVideoModel::Sora2,
        CommonVideoModel::Veo3p1,
        CommonVideoModel::ViduQ3,
      ] {
        let response = post_cost_request(base_request(model))
          .await
          .unwrap_or_else(|e| panic!("bare-model cost estimate should succeed for {model:?}: {e:?}"));
        assert!(response.cost_in_credits.unwrap() > 0, "no cost for {model:?}");
      }
    }
  }

  mod error_mapping_tests {
    use super::*;

    #[tokio::test]
    async fn unroutable_model_returns_400_not_500() {
      // grok_video has no Artcraft route in the router; this must surface
      // as a 400, not a 500 (it 500'd in production before the
      // map_router_cost_error mapping).
      let err = post_cost_request(base_request(CommonVideoModel::GrokVideo))
        .await
        .expect_err("unroutable model should be rejected");
      assert_eq!(err.status_code(), StatusCode::BAD_REQUEST);
    }
  }

  async fn post_cost_request(
    body: OmniGenVideoCostAndGenerateRequest,
  ) -> Result<OmniGenVideoCostResponse, CommonWebError> {
    let http_request = TestRequest::post()
      .uri("/v1/omni_gen/cost/video")
      .to_http_request();
    // No ServerState in unit tests: the reference-video probe is skipped and
    // quotes come from the router alone.
    omni_gen_video_cost_handler(http_request, Json(body), None)
      .await
      .map(Json::into_inner)
  }

  fn base_request(model: CommonVideoModel) -> OmniGenVideoCostAndGenerateRequest {
    OmniGenVideoCostAndGenerateRequest {
      idempotency_token: None,
      model: Some(model),
      prompt: None,
      negative_prompt: None,
      start_frame_image_media_token: None,
      end_frame_image_media_token: None,
      reference_image_media_tokens: None,
      reference_video_media_tokens: None,
      reference_audio_media_tokens: None,
      reference_character_tokens: None,
      resolution: None,
      aspect_ratio: None,
      bitrate: None,
      quality: None,
      duration_seconds: None,
      video_batch_count: None,
      generate_audio: None,
      estimate_only: None,
    }
  }
}
