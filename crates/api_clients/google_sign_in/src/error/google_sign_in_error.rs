use std::error::Error;
use std::fmt::{Display, Formatter};

/// All failure modes surfaced by the `google_sign_in` crate.
///
/// Kept as a single flat enum on purpose — the crate is small enough that
/// splitting into client/api/specific tiers (like beeble_client / gmicloud_client
/// do) is overkill here.
#[derive(Debug)]
pub enum GoogleSignInError {
  // ── Cert download (Google's JWK endpoint) ──

  /// HTTP error talking to Google's JWK cert endpoint.
  CertDownloadHttpError(reqwest::Error),

  /// Google's cert endpoint returned a non-2xx status.
  CertDownloadBadStatus(reqwest::StatusCode),

  // ── JWK parse ──

  /// Failed to parse Google's JWK payload as JSON.
  JwkJsonParseFailed(serde_json::Error),

  /// Failed to base64-decode a JWK key component (`n` or `e`).
  JwkBase64DecodeFailed(base64::DecodeError),

  /// Failed to construct an RSA public key from JWK components.
  /// The wrapped string is `jwt_simple`'s formatted error.
  JwkRsaKeyConstructionFailed(String),

  /// JWK payload contained no usable signing keys.
  JwkNoKeysFound,

  // ── JWT header decode ──

  /// JWT was malformed — couldn't split off the header segment.
  JwtMalformed,

  /// Failed to base64-decode the JWT header segment.
  /// The wrapped string is `ct_codecs`'s formatted error.
  JwtHeaderBase64DecodeFailed(String),

  /// Failed to parse the JWT header as JSON.
  JwtHeaderJsonParseFailed(serde_json::Error),

  // ── JWT claim verification ──

  /// JWT carried no `kid` and the keymap is empty — no key to verify with.
  JwtNoKeyId,

  /// JWT requested a `kid` not present in the JWK keymap.
  /// Refreshing the JWK keymap may resolve.
  JwtKeyMissing { requested_key: String },

  /// JWT has expired (was issued before the current clock + skew tolerance).
  JwtExpired,

  /// JWT audience claim is absent or doesn't match the configured allowlist.
  JwtInvalidAudience,

  /// JWT issuer claim is absent or doesn't match the configured allowlist.
  JwtInvalidIssuer,

  /// JWT signature verification failed for some other reason.
  /// The wrapped string is `jwt_simple`'s formatted error.
  JwtVerifyFailed(String),

  // ── Claims helpers ──

  /// `audience_matches()` was called on claims that have no audience field.
  AudienceMissing,
}

impl Error for GoogleSignInError {}

impl Display for GoogleSignInError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}
