use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_gen::shared_utils::map_router_cost_error::map_router_cost_error;
use crate::http_server::endpoints::omni_gen::generate::video::helpers::hydrate_router_request::hydrate_to_router_request;
use actix_web::web::Json;
use actix_web::HttpRequest;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_response::omni_gen_video_cost_response::OmniGenVideoCostResponse;
use artcraft_router::api::router_provider::RouterProvider;

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
  _http_request: HttpRequest,
  request: Json<OmniGenVideoCostAndGenerateRequest>,
) -> Result<Json<OmniGenVideoCostResponse>, CommonWebError> {
  // NB: Deliberately no input validation here. The UI polls this endpoint
  // while the user is still composing the request (no prompt typed, nothing
  // attached), and pricing is a total function of the model and options.
  // Bad requests are rejected by the generate endpoint.
  let mut builder = hydrate_to_router_request(&request)?;

  builder.provider = RouterProvider::Artcraft; // NB: User is paying for ArtCraft credits / generation

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
    omni_gen_video_cost_handler(http_request, Json(body))
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
    }
  }
}
