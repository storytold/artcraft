// Mirrors the Rust `ProviderCredentialKey` (serialized names).
export type ProviderCredentialKey =
  | "byteplus_api_key"
  | "fal_api_key"
  | "mediakit_api_key"
  | "replicate_api_key"
  | "seed_audio_api_key"
  | "grok_web_login"
  | "higgsfield_web_login"
  | "midjourney_login"
  | "runway_web_login";

export type ProviderCredentialType = "api_key" | "web_login";

export interface ProviderCredentialEntry {
  provider_credential: ProviderCredentialKey;
  credential_type: ProviderCredentialType;
  has_credentials: boolean;
  maybe_details?: {
    // A redacted prefix such as "abc123********".
    maybe_key_start?: string | null;
    maybe_email_address?: string | null;
    maybe_username?: string | null;
  } | null;
}
