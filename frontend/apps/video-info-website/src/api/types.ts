// Mirrors `artcraft_api_defs::video_info::read_only` (serde snake_case JSON).

export type VideoProvenanceKind =
  | 'seedance'
  | 'veo'
  | 'sora'
  | 'dreamina'
  | 'kling'
  | 'unrecognized';

export interface SeedanceVideoInfo {
  platform: string;
  software_agent: string;
  maybe_software_agent_version: string | null;
  model_name: string;
  maybe_model_brand: string | null;
  maybe_model_version: string | null;
  is_fast: boolean;
  is_lite: boolean;
  generated_at: string;
  maybe_generated_at_utc: string | null;
  maybe_log_id: string | null;
  maybe_log_id_decoded_hex: string | null;
  maybe_digital_source_type: string | null;
  maybe_claim_generator: string | null;
  maybe_claim_generator_version: string | null;
  maybe_manifest_id: string | null;
  maybe_instance_id: string | null;
  maybe_signer_email: string | null;
  maybe_signer_org_id: string | null;
  maybe_signer_country: string | null;
  maybe_cert_serial: string | null;
}

export interface VeoVideoInfo {
  producer: string;
  has_c2pa_manifest: boolean;
  maybe_encoder: string | null;
  maybe_created_description: string | null;
  has_synthid_watermark: boolean;
  maybe_synthid_description: string | null;
  maybe_digital_source_type: string | null;
  maybe_claim_generator: string | null;
  maybe_claim_generator_version: string | null;
  maybe_manifest_id: string | null;
  maybe_instance_id: string | null;
  maybe_cert_serial: string | null;
  maybe_signer_ca: string | null;
  is_timestamped: boolean;
  maybe_timestamp_authority: string | null;
}

export interface SoraVideoInfo {
  producer: string;
  maybe_model_name: string | null;
  maybe_created_description: string | null;
  maybe_digital_source_type: string | null;
  maybe_claim_generator: string | null;
  maybe_manifest_id: string | null;
  maybe_instance_id: string | null;
  maybe_cert_serial: string | null;
}

export interface DreaminaVideoInfo {
  product: string;
  maybe_export_type: string | null;
  maybe_os: string | null;
  maybe_source_info: string | null;
  maybe_aigc_label_type: number | null;
  maybe_video_id: string | null;
  has_c2pa: boolean;
  maybe_signer_org_id: string | null;
  maybe_signer_country: string | null;
  maybe_cert_serial: string | null;
}

export interface KlingVideoInfo {
  maybe_model_version: string | null;
  is_ai_generated: boolean;
  maybe_label: string | null;
  maybe_content_producer: string | null;
  maybe_produce_id: string | null;
  maybe_content_propagator: string | null;
  maybe_propagate_id: string | null;
  maybe_reserved_code_1: string | null;
  maybe_reserved_code_2: string | null;
  has_stream_watermark: boolean;
  maybe_watermark_uuid: string | null;
}

export interface VideoInfoReadOnlyResponse {
  success: boolean;
  kind: VideoProvenanceKind;
  maybe_encoder: string | null;
  maybe_seedance: SeedanceVideoInfo | null;
  maybe_veo: VeoVideoInfo | null;
  maybe_sora: SoraVideoInfo | null;
  maybe_dreamina: DreaminaVideoInfo | null;
  maybe_kling: KlingVideoInfo | null;
}
