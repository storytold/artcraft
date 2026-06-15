use artcraft_api_defs::api_keys::common::ApiKeyInfo;
use mysql_queries::queries::api_keys::api_key_row::ApiKeyRow;

/// Convert a data-access `ApiKeyRow` into the public `ApiKeyInfo` wire shape.
/// The row only ever carries the truncated key prefix (never the full secret),
/// so this is a straight field map.
pub fn api_key_row_to_info(row: ApiKeyRow) -> ApiKeyInfo {
  ApiKeyInfo {
    token: row.token,
    truncated_api_key: row.api_key_prefix,
    name: row.name,
    maybe_description: row.maybe_description,
    owner_user_token: row.owner_user_token,
    ip_address_creation: row.ip_address_creation,
    ip_address_update: row.ip_address_update,
    created_at: row.created_at,
    updated_at: row.updated_at,
    maybe_deleted_at: row.maybe_deleted_at,
  }
}
