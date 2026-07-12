use log::warn;

use opaque_cursors::v2::opaque_cursor_encoder_v2::OpaqueCursorEncoderV2;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// [`OpaqueCursorEncoderV2`] with a web-facing interface: results map to
/// [`CommonWebError`] so handlers can use `?` directly, with the right HTTP
/// status for each direction. This is the flavor injected into Actix via
/// `ServerState` (same treatment as `WebSortKeyCrypto`).
#[derive(Clone)]
pub struct WebOpaqueCursorEncoderV2 {
  encoder: OpaqueCursorEncoderV2,
}

impl WebOpaqueCursorEncoderV2 {
  pub fn new(secret: &str) -> Self {
    Self {
      encoder: OpaqueCursorEncoderV2::new(secret),
    }
  }

  /// Encode a last-id cursor into an opaque string.
  /// Failure is a genuine server fault (500).
  pub fn encode_last_id_cursor(&self, name: &str, id: u64) -> Result<String, CommonWebError> {
    self.encoder.encode_last_id_cursor(name, id)
        .map_err(|err| {
          warn!("Failed to encode pagination cursor for {:?}: {:?}", name, err);
          CommonWebError::server_error_with_message("Failed to encode cursor")
        })
  }

  /// Decode a client-supplied last-id cursor, verifying it belongs to the
  /// list named `name` and carries a `last_id`.
  ///
  /// Cursors arrive from clients verbatim, so garbage, cross-list reuse,
  /// and missing ids are all bad input (400), not a server fault — a 500
  /// here would trip the error-alerting middleware on any bot or stale
  /// client.
  pub fn decode_last_id_cursor(&self, name: &str, cursor: &str) -> Result<u64, CommonWebError> {
    let decoded = self.encoder.decode_cursor_expecting_name(name, cursor)
        .map_err(|err| {
          warn!("Invalid pagination cursor for {:?}: {:?}", name, err);
          CommonWebError::BadInputWithSimpleMessage("Invalid pagination cursor.".to_string())
        })?;

    decoded.last_id.ok_or_else(|| {
      warn!("Pagination cursor for {:?} carries no last_id", name);
      CommonWebError::BadInputWithSimpleMessage("Invalid pagination cursor.".to_string())
    })
  }
}
