use once_cell::sync::Lazy;
use regex::Regex;

/// Username may be up to this many characters, but not more.
pub const USERNAME_MAX_LENGTH: usize = 16;

/// Prefixes a username may not start with (case-insensitively), because each
/// collides with one of our token / ID namespaces. Keeping usernames clear of
/// these prevents a username from ever being mistaken for an entity token.
const RESERVED_USERNAME_PREFIXES: &[(&str, &str)] = &[
  // user tokens
  ("user_", "Username can't start with 'user_'."),
  // wallet tokens
  ("wallet_", "Username can't start with 'wallet_'."),
  // stripe customer IDs
  ("cus_", "Username can't start with 'cus_'."),
  // media file tokens
  ("m_", "Username can't start with 'm_'."),
  // close analogue to media file tokens
  ("media_", "Username can't start with 'media_'."),
  // folder tokens
  ("folder_", "Username can't start with 'folder_'."),
  // session tokens
  ("session_", "Username can't start with 'session_'."),
  // comment tokens
  ("comment_", "Username can't start with 'comment_'."),
  // inference job tokens
  ("jinf_", "Username can't start with 'jinf_'."),
  // hypothetical job tokens
  ("job_", "Username can't start with 'job_'."),
  // audit tokens
  ("audit_", "Username can't start with 'audit_'."),
  // character tokens
  ("character_", "Username can't start with 'character_'."),
];

pub fn validate_username(username: &str) -> Result<(), String> {
  static USERNAME_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^[A-Za-z0-9_\-]{3,16}$").expect("should be valid regex")
  });

  if username.len() < 3 {
    return Err("username is too short".to_string());
  }

  if username.len() > USERNAME_MAX_LENGTH {
    return Err("username is too long".to_string());
  }

  if !USERNAME_REGEX.is_match(username) {
    return Err("invalid username characters".to_string());
  }

  // Reject reserved token/ID prefixes. The comparison is case-insensitive, so
  // "User_", "USER_", etc. are all rejected. Prefixes are lowercase, so we
  // lowercase the username once and check against each.
  let lowercased_username = username.to_lowercase();
  for (prefix, error_message) in RESERVED_USERNAME_PREFIXES {
    if lowercased_username.starts_with(prefix) {
      return Err((*error_message).to_string());
    }
  }

  Ok(())
}

#[cfg(test)]
mod tests {
  use crate::http_server::validations::validate_username::validate_username;

  #[test]
  fn test_valid_usernames() {
    assert!(validate_username("echelon").is_ok());
    assert!(validate_username("dr_mario").is_ok());
    assert!(validate_username("Foo1234").is_ok());
    assert!(validate_username("mr-person").is_ok());
  }

  #[test]
  fn test_invalid_usernames() {
    assert!(validate_username("").is_err());
    assert!(validate_username("&&&&").is_err());
    assert!(validate_username("........").is_err());
    assert!(validate_username("really-long-username-that-is-too-long").is_err());
  }

  // ── Reserved token/ID prefixes ──

  #[test]
  fn reserved_prefixes_are_rejected_with_exact_messages() {
    // (username, expected error message)
    let cases = [
      ("user_alice", "Username can't start with 'user_'."),
      ("wallet_abc", "Username can't start with 'wallet_'."),
      ("cus_abc123", "Username can't start with 'cus_'."),
      ("m_abc", "Username can't start with 'm_'."),
      ("media_abc", "Username can't start with 'media_'."),
      ("folder_abc", "Username can't start with 'folder_'."),
      ("session_abc", "Username can't start with 'session_'."),
      ("comment_abc", "Username can't start with 'comment_'."),
      ("jinf_abc", "Username can't start with 'jinf_'."),
      ("job_abc", "Username can't start with 'job_'."),
      ("audit_abc", "Username can't start with 'audit_'."),
      ("character_a", "Username can't start with 'character_'."),
    ];
    for (username, expected) in cases {
      assert_eq!(
        validate_username(username),
        Err(expected.to_string()),
        "username {username:?} should be rejected with {expected:?}",
      );
    }
  }

  #[test]
  fn reserved_prefixes_are_case_insensitive() {
    let cases = [
      ("USER_alice", "Username can't start with 'user_'."),
      ("User_alice", "Username can't start with 'user_'."),
      ("Wallet_abc", "Username can't start with 'wallet_'."),
      ("CUS_abc", "Username can't start with 'cus_'."),
      ("M_abc", "Username can't start with 'm_'."),
      ("Media_abc", "Username can't start with 'media_'."),
      ("FOLDER_abc", "Username can't start with 'folder_'."),
      ("Session_abc", "Username can't start with 'session_'."),
      ("Comment_abc", "Username can't start with 'comment_'."),
      ("JINF_abc", "Username can't start with 'jinf_'."),
      ("Job_abc", "Username can't start with 'job_'."),
      ("Audit_abc", "Username can't start with 'audit_'."),
      ("Character_a", "Username can't start with 'character_'."),
    ];
    for (username, expected) in cases {
      assert_eq!(
        validate_username(username),
        Err(expected.to_string()),
        "username {username:?} should be rejected with {expected:?}",
      );
    }
  }

  #[test]
  fn reserved_words_are_only_blocked_as_prefixes() {
    // The reserved tokens are only banned at the START of the username. The
    // same letters elsewhere, or without the trailing underscore, are fine.
    assert!(validate_username("xuser_").is_ok());
    assert!(validate_username("myuser").is_ok());
    assert!(validate_username("a_user_b").is_ok());
    assert!(validate_username("muser").is_ok());       // "m" but not "m_"
    assert!(validate_username("mediafoo").is_ok());    // "media" but not "media_"
    assert!(validate_username("jobless").is_ok());     // "job" but not "job_"
    assert!(validate_username("comments").is_ok());    // "comment" but not "comment_"
  }
}