//! `POST /v1/video_info/read_only` — inspect an uploaded video's embedded
//! AI-generation provenance and return what was detected.
//!
//! Stateless and read-only: the bytes are parsed in memory by the `video_info`
//! crate and nothing is persisted. The internal `video_info` types are mapped
//! into the public [`artcraft_api_defs`] wire types so the parsing library can
//! evolve independently of the HTTP contract.

use std::io::Read;
use std::sync::Arc;

use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::MultipartForm;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::error;
use utoipa::ToSchema;

use artcraft_api_defs::video_info::read_only::{
  DreaminaVideoInfo, KlingVideoInfo, SeedanceVideoInfo, SoraVideoInfo, VeoVideoInfo,
  VideoInfoReadOnlyResponse, VideoProvenanceKind,
};
use video_info::dreamina_info::DreaminaInfo;
use video_info::kling_info::KlingInfo;
use video_info::seedance_info::SeedanceInfo;
use video_info::sora_info::SoraInfo;
use video_info::veo_info::VeoInfo;
use video_info::VideoInfo;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::redis_rate_limiter::RateLimiterError;
use crate::state::server_state::ServerState;

/// Form-multipart request: a single video file under the `file` field.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct VideoInfoReadOnlyForm {
  /// The video file to inspect.
  #[multipart(limit = "256 MiB")]
  #[schema(value_type = Vec<u8>, format = Binary)]
  file: TempFile,
}

/// Detect the AI-generation provenance of an uploaded video.
#[utoipa::path(
  post,
  tag = "Video Info",
  path = "/v1/video_info/read_only",
  responses(
    (status = 200, description = "Detected provenance (or `unrecognized`)", body = VideoInfoReadOnlyResponse),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("request" = VideoInfoReadOnlyForm, description = "Multipart form with a single `file` video upload."),
  )
)]
pub async fn video_info_read_info_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  MultipartForm(mut form): MultipartForm<VideoInfoReadOnlyForm>,
) -> Result<Json<VideoInfoReadOnlyResponse>, CommonWebError> {
  // IP-based rate limit (1 req / 5s by default, configurable). Fails open: the
  // limiter already treats Redis/parse errors as allowed, and we allow on any
  // non-"limit exceeded" outcome here too.
  match server_state.redis_rate_limiters.video_info_read_only.rate_limit_request(&http_request).await {
    Ok(()) => {}
    Err(RateLimiterError::RateLimitExceededError) => return Err(CommonWebError::TooManyRequests),
    Err(RateLimiterError::ClientError) => {} // fail open
  }

  let mut bytes = Vec::new();
  form.file.file.read_to_end(&mut bytes).map_err(|err| {
    error!("video_info: problem reading uploaded file: {:?}", err);
    CommonWebError::server_error_with_message("could not read uploaded file")
  })?;

  if bytes.is_empty() {
    return Err(CommonWebError::BadInputWithSimpleMessage("empty file".to_string()));
  }

  let maybe_encoder = video_info::encoder_tag(&bytes);

  // Any parse error (unrecognized / malformed manifest) collapses to
  // `Unrecognized` — we never surface internal error types to clients.
  let response = match VideoInfo::from_bytes(&bytes) {
    Ok(info) => to_response(info, maybe_encoder),
    Err(_) => unrecognized_response(maybe_encoder),
  };

  Ok(Json(response))
}

// ── Mapping: internal `video_info` types → public API types ──

fn to_response(info: VideoInfo, maybe_encoder: Option<String>) -> VideoInfoReadOnlyResponse {
  let mut response = unrecognized_response(maybe_encoder);
  match info {
    VideoInfo::Seedance(seedance) => {
      response.kind = VideoProvenanceKind::Seedance;
      response.maybe_seedance = Some(to_seedance(seedance));
    }
    VideoInfo::Veo(veo) => {
      response.kind = VideoProvenanceKind::Veo;
      response.maybe_veo = Some(to_veo(veo));
    }
    VideoInfo::Sora(sora) => {
      response.kind = VideoProvenanceKind::Sora;
      response.maybe_sora = Some(to_sora(sora));
    }
    VideoInfo::Dreamina(dreamina) => {
      response.kind = VideoProvenanceKind::Dreamina;
      response.maybe_dreamina = Some(to_dreamina(dreamina));
    }
    VideoInfo::Kling(kling) => {
      response.kind = VideoProvenanceKind::Kling;
      response.maybe_kling = Some(to_kling(kling));
    }
  }
  response
}

fn unrecognized_response(maybe_encoder: Option<String>) -> VideoInfoReadOnlyResponse {
  VideoInfoReadOnlyResponse {
    success: true,
    kind: VideoProvenanceKind::Unrecognized,
    maybe_encoder,
    maybe_seedance: None,
    maybe_veo: None,
    maybe_sora: None,
    maybe_dreamina: None,
    maybe_kling: None,
  }
}

fn to_seedance(info: SeedanceInfo) -> SeedanceVideoInfo {
  SeedanceVideoInfo {
    platform: info.platform.as_str().to_string(),
    software_agent: info.software_agent,
    maybe_software_agent_version: info.software_agent_version,
    model_name: info.model_name,
    maybe_model_brand: info.model_brand,
    maybe_model_version: info.model_version,
    is_fast: info.is_fast,
    is_lite: info.is_lite,
    generated_at: info.generated_at,
    maybe_generated_at_utc: info.generated_at_utc.map(|dt| dt.to_rfc3339()),
    maybe_log_id: info.log_id,
    maybe_log_id_decoded_hex: info.log_id_decoded_hex,
    maybe_digital_source_type: info.digital_source_type,
    maybe_claim_generator: info.claim_generator,
    maybe_claim_generator_version: info.claim_generator_version,
    maybe_manifest_id: info.manifest_id,
    maybe_instance_id: info.instance_id,
    maybe_signer_email: info.signer_email,
    maybe_signer_org_id: info.signer_org_id,
    maybe_signer_country: info.signer_country,
    maybe_cert_serial: info.cert_serial,
  }
}

fn to_veo(info: VeoInfo) -> VeoVideoInfo {
  VeoVideoInfo {
    producer: info.producer,
    has_c2pa_manifest: info.has_c2pa_manifest,
    maybe_encoder: info.encoder,
    maybe_created_description: info.created_description,
    has_synthid_watermark: info.has_synthid_watermark,
    maybe_synthid_description: info.synthid_description,
    maybe_digital_source_type: info.digital_source_type,
    maybe_claim_generator: info.claim_generator,
    maybe_claim_generator_version: info.claim_generator_version,
    maybe_manifest_id: info.manifest_id,
    maybe_instance_id: info.instance_id,
    maybe_cert_serial: info.cert_serial,
    maybe_signer_ca: info.signer_ca,
    is_timestamped: info.is_timestamped,
    maybe_timestamp_authority: info.timestamp_authority,
  }
}

fn to_sora(info: SoraInfo) -> SoraVideoInfo {
  SoraVideoInfo {
    producer: info.producer,
    maybe_model_name: info.model_name,
    maybe_created_description: info.created_description,
    maybe_digital_source_type: info.digital_source_type,
    maybe_claim_generator: info.claim_generator,
    maybe_manifest_id: info.manifest_id,
    maybe_instance_id: info.instance_id,
    maybe_cert_serial: info.cert_serial,
  }
}

fn to_dreamina(info: DreaminaInfo) -> DreaminaVideoInfo {
  DreaminaVideoInfo {
    product: info.product,
    maybe_export_type: info.export_type,
    maybe_os: info.os,
    maybe_source_info: info.source_info,
    maybe_aigc_label_type: info.aigc_label_type,
    maybe_video_id: info.video_id,
    has_c2pa: info.has_c2pa,
    maybe_signer_org_id: info.signer_org_id,
    maybe_signer_country: info.signer_country,
    maybe_cert_serial: info.cert_serial,
  }
}

fn to_kling(info: KlingInfo) -> KlingVideoInfo {
  KlingVideoInfo {
    maybe_model_version: info.model_version,
    is_ai_generated: info.is_ai_generated,
    maybe_label: info.label,
    maybe_content_producer: info.content_producer,
    maybe_produce_id: info.produce_id,
    maybe_content_propagator: info.content_propagator,
    maybe_propagate_id: info.propagate_id,
    maybe_reserved_code_1: info.reserved_code_1,
    maybe_reserved_code_2: info.reserved_code_2,
    has_stream_watermark: info.has_stream_watermark,
    maybe_watermark_uuid: info.watermark_uuid,
  }
}
