use log::warn;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::util::encrypted_sort_id::SortKeyCrypto;

/// [`SortKeyCrypto`] with a web-facing interface: results map to
/// [`CommonWebError`] so handlers can use `?` directly, with the right HTTP
/// status for each direction. This is the flavor injected into Actix via
/// `ServerState`.
#[derive(Clone)]
pub struct WebSortKeyCrypto {
  crypto: SortKeyCrypto,
}

impl WebSortKeyCrypto {
  pub fn new(secret: &str) -> Self {
    Self {
      crypto: SortKeyCrypto::new(secret),
    }
  }

  /// Encrypt a row id into an opaque pagination cursor.
  /// Failure is a genuine server fault (500).
  pub fn encrypt_id(&self, id: u64) -> Result<String, CommonWebError> {
    self.crypto.encrypt_id(id)
        .map_err(|err| {
          warn!("Failed to encrypt pagination cursor: {:?}", err);
          CommonWebError::from_anyhow_error(err)
        })
  }

  /// Decrypt a client-supplied pagination cursor.
  /// Cursors arrive from clients verbatim, so garbage is bad input (400),
  /// not a server fault — a 500 here would trip the error-alerting
  /// middleware on any bot or stale client.
  pub fn decrypt_id(&self, cursor: &str) -> Result<u64, CommonWebError> {
    self.crypto.decrypt_id(cursor)
        .map_err(|err| {
          warn!("Invalid pagination cursor: {:?}", err);
          CommonWebError::BadInputWithSimpleMessage("Invalid pagination cursor.".to_string())
        })
  }
}
