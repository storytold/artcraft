use chrono::{DateTime, Utc};

use tokens::tokens::api_keys::ApiKeyToken;
use tokens::tokens::users::UserToken;

/// A materialized `api_keys` row, minus the internal `id` and the full secret
/// `api_key`. `api_key_prefix` is the first 20 characters of the key — enough to
/// disambiguate keys in a UI without ever exposing the secret value.
#[derive(Debug, Clone)]
pub struct ApiKeyRow {
  pub token: ApiKeyToken,

  /// First 20 characters of the `api_key`. The full secret is never returned.
  pub api_key_prefix: String,

  pub name: String,
  pub maybe_description: Option<String>,

  pub owner_user_token: UserToken,

  pub ip_address_creation: String,
  pub ip_address_update: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub maybe_deleted_at: Option<DateTime<Utc>>,
}
