//! Response types for `POST /v1/video_info/read_only`.
//!
//! The endpoint accepts a `multipart/form-data` video upload, inspects its
//! embedded provenance (C2PA manifests, AIGC labels, in-stream watermarks), and
//! returns what it found. These are the public, wire-stable API types — they
//! deliberately mirror, but do not re-export, the internal `video_info` crate
//! types so the parsing library can evolve independently of the HTTP contract.

use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

/// Response for `POST /v1/video_info/read_only`.
///
/// [`kind`](Self::kind) names the detected provenance family; the matching
/// `maybe_*` field carries its details (all others are `null`). `unrecognized`
/// means no supported provenance was found — [`maybe_encoder`](Self::maybe_encoder)
/// still reports the container encoder tag when present (an `Lavf…` value means
/// the file was re-encoded through ffmpeg, which strips provenance).
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct VideoInfoReadOnlyResponse {
  pub success: bool,

  /// Which provenance family was detected (if any).
  pub kind: VideoProvenanceKind,

  /// The container `©too` encoder tag, e.g. `"Lavf60.16.100"` or `"Google"`.
  pub maybe_encoder: Option<String>,

  /// Present when [`kind`](Self::kind) is [`VideoProvenanceKind::Seedance`].
  pub maybe_seedance: Option<SeedanceVideoInfo>,

  /// Present when [`kind`](Self::kind) is [`VideoProvenanceKind::Veo`].
  pub maybe_veo: Option<VeoVideoInfo>,

  /// Present when [`kind`](Self::kind) is [`VideoProvenanceKind::Sora`].
  pub maybe_sora: Option<SoraVideoInfo>,

  /// Present when [`kind`](Self::kind) is [`VideoProvenanceKind::Dreamina`].
  pub maybe_dreamina: Option<DreaminaVideoInfo>,

  /// Present when [`kind`](Self::kind) is [`VideoProvenanceKind::Kling`].
  pub maybe_kling: Option<KlingVideoInfo>,
}

/// The recognized AI-video provenance family.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum VideoProvenanceKind {
  /// ByteDance Seedance API (Volcengine / BytePlus C2PA).
  Seedance,
  /// Google Veo (Google Generative AI video C2PA).
  Veo,
  /// OpenAI Sora (OpenAI Generative AI video C2PA).
  Sora,
  /// Dreamina (ByteDance/CapCut consumer app `ilst` metadata).
  Dreamina,
  /// Kling (Kuaishou AIGC-label / in-stream watermark).
  Kling,
  /// No supported provenance was found (often a re-encoded / stripped file).
  Unrecognized,
}

/// Seedance (ByteDance) provenance from an embedded C2PA manifest.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct SeedanceVideoInfo {
  /// `"volcengine"` or `"byteplus"`.
  pub platform: String,
  /// C2PA `softwareAgent`, e.g. `"Volcengine_Ark_CN"`.
  pub software_agent: String,
  pub maybe_software_agent_version: Option<String>,
  /// Full model identifier, e.g. `"doubao-seedance-2-0-fast"`.
  pub model_name: String,
  pub maybe_model_brand: Option<String>,
  /// Parsed version, e.g. `"2.0"` / `"1.0"`.
  pub maybe_model_version: Option<String>,
  pub is_fast: bool,
  pub is_lite: bool,
  /// Raw generation timestamp string (RFC 3339).
  pub generated_at: String,
  /// Normalized RFC 3339 timestamp, when parseable.
  pub maybe_generated_at_utc: Option<String>,
  pub maybe_log_id: Option<String>,
  pub maybe_log_id_decoded_hex: Option<String>,
  pub maybe_digital_source_type: Option<String>,
  pub maybe_claim_generator: Option<String>,
  pub maybe_claim_generator_version: Option<String>,
  pub maybe_manifest_id: Option<String>,
  pub maybe_instance_id: Option<String>,
  pub maybe_signer_email: Option<String>,
  pub maybe_signer_org_id: Option<String>,
  pub maybe_signer_country: Option<String>,
  pub maybe_cert_serial: Option<String>,
}

/// Google Veo provenance.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct VeoVideoInfo {
  /// Always `"Google"`.
  pub producer: String,
  /// Whether a full Google C2PA manifest is present (`false` = recognized only
  /// by the `encoder=Google` tag, C2PA likely stripped by a re-encode).
  pub has_c2pa_manifest: bool,
  pub maybe_encoder: Option<String>,
  pub maybe_created_description: Option<String>,
  pub has_synthid_watermark: bool,
  pub maybe_synthid_description: Option<String>,
  pub maybe_digital_source_type: Option<String>,
  pub maybe_claim_generator: Option<String>,
  pub maybe_claim_generator_version: Option<String>,
  pub maybe_manifest_id: Option<String>,
  pub maybe_instance_id: Option<String>,
  pub maybe_cert_serial: Option<String>,
  /// Issuing intermediate-CA common name, e.g. `"Google C2PA Media Services 1P ICA G3"`.
  pub maybe_signer_ca: Option<String>,
  /// Whether the manifest carries an RFC 3161 trusted timestamp.
  pub is_timestamped: bool,
  pub maybe_timestamp_authority: Option<String>,
}

/// OpenAI Sora provenance.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct SoraVideoInfo {
  /// Always `"OpenAI"`.
  pub producer: String,
  pub maybe_model_name: Option<String>,
  pub maybe_created_description: Option<String>,
  pub maybe_digital_source_type: Option<String>,
  pub maybe_claim_generator: Option<String>,
  pub maybe_manifest_id: Option<String>,
  pub maybe_instance_id: Option<String>,
  pub maybe_cert_serial: Option<String>,
}

/// Dreamina (ByteDance/CapCut app) provenance from `ilst` metadata.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct DreaminaVideoInfo {
  /// The product string, e.g. `"dreamina"`.
  pub product: String,
  pub maybe_export_type: Option<String>,
  pub maybe_os: Option<String>,
  pub maybe_source_info: Option<String>,
  pub maybe_aigc_label_type: Option<i64>,
  pub maybe_video_id: Option<String>,
  pub has_c2pa: bool,
  pub maybe_signer_org_id: Option<String>,
  pub maybe_signer_country: Option<String>,
  pub maybe_cert_serial: Option<String>,
}

/// Kling (Kuaishou) provenance from the AIGC label and/or in-stream watermark.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct KlingVideoInfo {
  /// Model version when a clean export embeds it (e.g. `"2.5-pro"`); usually `null`.
  pub maybe_model_version: Option<String>,
  /// Whether labeled AI-generated (`Label == "1"`, per China GB 45438).
  pub is_ai_generated: bool,
  pub maybe_label: Option<String>,
  pub maybe_content_producer: Option<String>,
  pub maybe_produce_id: Option<String>,
  pub maybe_content_propagator: Option<String>,
  pub maybe_propagate_id: Option<String>,
  pub maybe_reserved_code_1: Option<String>,
  pub maybe_reserved_code_2: Option<String>,
  /// Whether the in-stream `kling-ai` SEI watermark is present.
  pub has_stream_watermark: bool,
  pub maybe_watermark_uuid: Option<String>,
}
