use std::collections::BTreeMap;

use crate::sessions::user_sessions::http_user_session_payload_error::HttpUserSessionPayloadError;

#[derive(Clone)]
pub struct HttpUserSessionPayload {
  /// The database primary key for the session instance.
  pub session_token: String,

  /// The primary key identifier of the user.
  /// Version 1 cookies do not have a user token, hence it is optional.
  pub maybe_user_token: Option<String>,
}

impl HttpUserSessionPayload {
  pub fn from_map(
    map: BTreeMap<String, String>,
  ) -> Result<Self, HttpUserSessionPayloadError> {
    let session_token = map
        .get("session_token")
        .ok_or(HttpUserSessionPayloadError::MissingField("session_token"))?
        .clone();

    let maybe_user_token = map.get("user_token").map(|t| t.to_string());

    Ok(Self {
      session_token,
      maybe_user_token,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn map_of(pairs: &[(&str, &str)]) -> BTreeMap<String, String> {
    pairs.iter().map(|(k, v)| (k.to_string(), v.to_string())).collect()
  }

  #[test]
  fn from_map_with_session_and_user_tokens() {
    let payload = HttpUserSessionPayload::from_map(map_of(&[
      ("session_token", "ex_session_token"),
      ("user_token", "ex_user_token"),
      ("version", "3"),
    ])).unwrap();

    assert_eq!(payload.session_token, "ex_session_token");
    assert_eq!(payload.maybe_user_token.as_deref(), Some("ex_user_token"));
  }

  #[test]
  fn from_map_without_user_token_is_ok() {
    let payload = HttpUserSessionPayload::from_map(map_of(&[
      ("session_token", "ex_session_token"),
    ])).unwrap();

    assert_eq!(payload.session_token, "ex_session_token");
    assert!(payload.maybe_user_token.is_none());
  }

  #[test]
  fn from_map_missing_session_token_errors() {
    let result = HttpUserSessionPayload::from_map(map_of(&[
      ("user_token", "ex_user_token"),
    ]));

    match result.err().expect("expected error") {
      HttpUserSessionPayloadError::MissingField("session_token") => {}
      other => panic!("expected MissingField(session_token), got {:?}", other),
    }
  }
}
