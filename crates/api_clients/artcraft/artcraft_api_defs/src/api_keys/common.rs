use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use tokens::tokens::api_keys::ApiKeyToken;
use tokens::tokens::users::UserToken;

/// Canonical wire shape for an API key, used by the list rows and the
/// single-key GET.
///
/// NB: the full secret `api_key` is NEVER included here — only
/// `truncated_api_key` (its first 20 characters), enough to disambiguate keys
/// in a UI. The full value is returned exactly once, at creation time.
#[derive(Clone, Debug, Serialize, Deserialize, ToSchema)]
pub struct ApiKeyInfo {
  pub token: ApiKeyToken,

  /// First 20 characters of the API key. The full secret is never returned
  /// after creation.
  pub truncated_api_key: String,

  pub name: String,
  pub maybe_description: Option<String>,

  pub owner_user_token: UserToken,

  pub ip_address_creation: String,
  pub ip_address_update: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  /// Soft-delete timestamp. `None` for live keys.
  pub maybe_deleted_at: Option<DateTime<Utc>>,
}

/// Path info for endpoints addressed by the API key's `token` (NOT the secret
/// `api_key` value): `GET` / `DELETE` / `PUT` `/v1/api_keys/{api_key_token}`.
#[derive(Deserialize, ToSchema)]
pub struct ApiKeyPathInfo {
  pub api_key_token: ApiKeyToken,
}
