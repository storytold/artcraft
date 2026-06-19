//! Shared helpers for the video-info endpoints: mapping the internal
//! `video_info` types into the public API types, and deriving the database
//! `detected_model_type` / `detected_model_family` enums from a parse result.

use artcraft_api_defs::video_info::read_only::{
  DreaminaVideoInfo, KlingVideoInfo, SeedanceVideoInfo, SoraVideoInfo, VeoVideoInfo,
  VideoProvenanceKind,
};
use enums::by_table::uploaded_videos::uploaded_video_detected_model_family::UploadedVideoDetectedModelFamily;
use enums::by_table::uploaded_videos::uploaded_video_detected_model_type::UploadedVideoDetectedModelType;
use video_info::dreamina_info::DreaminaInfo;
use video_info::error::VideoInfoError;
use video_info::kling_info::KlingInfo;
use video_info::seedance_info::{SeedanceInfo, SeedancePlatform};
use video_info::sora_info::SoraInfo;
use video_info::veo_info::VeoInfo;
use video_info::VideoInfo;

/// The public-facing provenance for a parsed video — the shared body of both the
/// read-only and upload responses.
pub struct Provenance {
  pub kind: VideoProvenanceKind,
  pub maybe_encoder: Option<String>,
  pub maybe_seedance: Option<SeedanceVideoInfo>,
  pub maybe_veo: Option<VeoVideoInfo>,
  pub maybe_sora: Option<SoraVideoInfo>,
  pub maybe_dreamina: Option<DreaminaVideoInfo>,
  pub maybe_kling: Option<KlingVideoInfo>,
}

/// Map a `video_info` parse result into the public [`Provenance`]. Any parse
/// error (unrecognized or malformed) collapses to `Unrecognized` — internal
/// error types are never surfaced.
pub fn to_provenance(
  result: &Result<VideoInfo, VideoInfoError>,
  maybe_encoder: Option<String>,
) -> Provenance {
  let mut provenance = Provenance {
    kind: VideoProvenanceKind::Unrecognized,
    maybe_encoder,
    maybe_seedance: None,
    maybe_veo: None,
    maybe_sora: None,
    maybe_dreamina: None,
    maybe_kling: None,
  };

  match result {
    Ok(VideoInfo::Seedance(info)) => {
      provenance.kind = VideoProvenanceKind::Seedance;
      provenance.maybe_seedance = Some(to_seedance(info));
    }
    Ok(VideoInfo::Veo(info)) => {
      provenance.kind = VideoProvenanceKind::Veo;
      provenance.maybe_veo = Some(to_veo(info));
    }
    Ok(VideoInfo::Sora(info)) => {
      provenance.kind = VideoProvenanceKind::Sora;
      provenance.maybe_sora = Some(to_sora(info));
    }
    Ok(VideoInfo::Dreamina(info)) => {
      provenance.kind = VideoProvenanceKind::Dreamina;
      provenance.maybe_dreamina = Some(to_dreamina(info));
    }
    Ok(VideoInfo::Kling(info)) => {
      provenance.kind = VideoProvenanceKind::Kling;
      provenance.maybe_kling = Some(to_kling(info));
    }
    Err(_) => {}
  }

  provenance
}

// ── Model detection (for the `uploaded_videos` columns) ──

/// Best-effort specific model type. Only Seedance carries enough metadata to pin
/// an exact variant; other families return `None` (we can't honestly claim a
/// version we didn't observe).
pub fn detect_model_type(
  result: &Result<VideoInfo, VideoInfoError>,
) -> Option<UploadedVideoDetectedModelType> {
  match result.as_ref().ok()? {
    VideoInfo::Seedance(info) => seedance_model_type(info),
    _ => None,
  }
}

/// Map a known model type to its family. The requested
/// "family based on the model type" helper.
pub fn model_family_for_type(
  model_type: UploadedVideoDetectedModelType,
) -> UploadedVideoDetectedModelFamily {
  use UploadedVideoDetectedModelFamily as Family;
  use UploadedVideoDetectedModelType as Type;
  match model_type {
    Type::GrokVideo | Type::GrokImagineVideo | Type::GrokImagineVideo1p5 => Family::Grok,
    Type::Kling16Pro
    | Type::Kling21Pro
    | Type::Kling21Master
    | Type::Kling2p5TurboPro
    | Type::Kling2p6Pro
    | Type::Kling3p0Standard
    | Type::Kling3p0Pro => Family::Kling,
    Type::HappyHorse1p0 => Family::HappyHorse,
    Type::Seedance10Lite
    | Type::Seedance1p5Pro
    | Type::Seedance2p0
    | Type::Seedance2p0Fast
    | Type::Seedance2p0BytePlus
    | Type::Seedance2p0BytePlusFast
    | Type::Seedance2p0Ultra
    | Type::Seedance2p0UltraFast
    | Type::Seedance2p0BytePlusUltra
    | Type::Seedance2p0BytePlusUltraFast => Family::Seedance,
    Type::Sora2 | Type::Sora2Pro => Family::Sora,
    Type::Veo2 | Type::Veo3 | Type::Veo3Fast | Type::Veo3p1 | Type::Veo3p1Fast => Family::Veo,
  }
}

/// Family derived directly from the parsed variant. Used as a fallback when an
/// exact model type couldn't be pinned (e.g. Veo/Sora/Kling, whose version isn't
/// in the metadata). Dreamina is ByteDance's Seedance consumer app, so it maps
/// to the Seedance family.
pub fn detect_model_family(
  result: &Result<VideoInfo, VideoInfoError>,
) -> Option<UploadedVideoDetectedModelFamily> {
  use UploadedVideoDetectedModelFamily as Family;
  Some(match result.as_ref().ok()? {
    VideoInfo::Seedance(_) | VideoInfo::Dreamina(_) => Family::Seedance,
    VideoInfo::Veo(_) => Family::Veo,
    VideoInfo::Sora(_) => Family::Sora,
    VideoInfo::Kling(_) => Family::Kling,
  })
}

fn seedance_model_type(info: &SeedanceInfo) -> Option<UploadedVideoDetectedModelType> {
  use UploadedVideoDetectedModelType as Type;
  let is_byteplus = matches!(info.platform, SeedancePlatform::BytePlus);
  match (info.model_version.as_deref(), info.is_fast, info.is_lite, is_byteplus) {
    (Some("1.0"), _, true, _) => Some(Type::Seedance10Lite),
    (Some("1.5"), _, _, _) => Some(Type::Seedance1p5Pro),
    (Some("2.0"), false, _, false) => Some(Type::Seedance2p0),
    (Some("2.0"), true, _, false) => Some(Type::Seedance2p0Fast),
    (Some("2.0"), false, _, true) => Some(Type::Seedance2p0BytePlus),
    (Some("2.0"), true, _, true) => Some(Type::Seedance2p0BytePlusFast),
    _ => None,
  }
}

// ── Internal `video_info` → public API type converters ──

fn to_seedance(info: &SeedanceInfo) -> SeedanceVideoInfo {
  SeedanceVideoInfo {
    platform: info.platform.as_str().to_string(),
    software_agent: info.software_agent.clone(),
    maybe_software_agent_version: info.software_agent_version.clone(),
    model_name: info.model_name.clone(),
    maybe_model_brand: info.model_brand.clone(),
    maybe_model_version: info.model_version.clone(),
    is_fast: info.is_fast,
    is_lite: info.is_lite,
    generated_at: info.generated_at.clone(),
    maybe_generated_at_utc: info.generated_at_utc.map(|dt| dt.to_rfc3339()),
    maybe_log_id: info.log_id.clone(),
    maybe_log_id_decoded_hex: info.log_id_decoded_hex.clone(),
    maybe_digital_source_type: info.digital_source_type.clone(),
    maybe_claim_generator: info.claim_generator.clone(),
    maybe_claim_generator_version: info.claim_generator_version.clone(),
    maybe_manifest_id: info.manifest_id.clone(),
    maybe_instance_id: info.instance_id.clone(),
    maybe_signer_email: info.signer_email.clone(),
    maybe_signer_org_id: info.signer_org_id.clone(),
    maybe_signer_country: info.signer_country.clone(),
    maybe_cert_serial: info.cert_serial.clone(),
  }
}

fn to_veo(info: &VeoInfo) -> VeoVideoInfo {
  VeoVideoInfo {
    producer: info.producer.clone(),
    has_c2pa_manifest: info.has_c2pa_manifest,
    maybe_encoder: info.encoder.clone(),
    maybe_created_description: info.created_description.clone(),
    has_synthid_watermark: info.has_synthid_watermark,
    maybe_synthid_description: info.synthid_description.clone(),
    maybe_digital_source_type: info.digital_source_type.clone(),
    maybe_claim_generator: info.claim_generator.clone(),
    maybe_claim_generator_version: info.claim_generator_version.clone(),
    maybe_manifest_id: info.manifest_id.clone(),
    maybe_instance_id: info.instance_id.clone(),
    maybe_cert_serial: info.cert_serial.clone(),
    maybe_signer_ca: info.signer_ca.clone(),
    is_timestamped: info.is_timestamped,
    maybe_timestamp_authority: info.timestamp_authority.clone(),
  }
}

fn to_sora(info: &SoraInfo) -> SoraVideoInfo {
  SoraVideoInfo {
    producer: info.producer.clone(),
    maybe_model_name: info.model_name.clone(),
    maybe_created_description: info.created_description.clone(),
    maybe_digital_source_type: info.digital_source_type.clone(),
    maybe_claim_generator: info.claim_generator.clone(),
    maybe_manifest_id: info.manifest_id.clone(),
    maybe_instance_id: info.instance_id.clone(),
    maybe_cert_serial: info.cert_serial.clone(),
  }
}

fn to_dreamina(info: &DreaminaInfo) -> DreaminaVideoInfo {
  DreaminaVideoInfo {
    product: info.product.clone(),
    maybe_export_type: info.export_type.clone(),
    maybe_os: info.os.clone(),
    maybe_source_info: info.source_info.clone(),
    maybe_aigc_label_type: info.aigc_label_type,
    maybe_video_id: info.video_id.clone(),
    has_c2pa: info.has_c2pa,
    maybe_signer_org_id: info.signer_org_id.clone(),
    maybe_signer_country: info.signer_country.clone(),
    maybe_cert_serial: info.cert_serial.clone(),
  }
}

fn to_kling(info: &KlingInfo) -> KlingVideoInfo {
  KlingVideoInfo {
    maybe_model_version: info.model_version.clone(),
    is_ai_generated: info.is_ai_generated,
    maybe_label: info.label.clone(),
    maybe_content_producer: info.content_producer.clone(),
    maybe_produce_id: info.produce_id.clone(),
    maybe_content_propagator: info.content_propagator.clone(),
    maybe_propagate_id: info.propagate_id.clone(),
    maybe_reserved_code_1: info.reserved_code_1.clone(),
    maybe_reserved_code_2: info.reserved_code_2.clone(),
    has_stream_watermark: info.has_stream_watermark,
    maybe_watermark_uuid: info.watermark_uuid.clone(),
  }
}
