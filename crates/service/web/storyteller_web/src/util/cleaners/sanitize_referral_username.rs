const MAX_REFERRAL_PARTNER_LENGTH: usize = 32;

/// Sanitize a referral username/code for storage
/// in the `users.maybe_referral_partner` column.
/// Trims whitespace and truncates to 32 characters.
/// Returns None if empty after trimming.
pub fn sanitize_referral_username(value: &str) -> Option<String> {
  let trimmed = value.trim();
  if trimmed.is_empty() {
    return None;
  }
  let truncated = &trimmed[..trimmed.len().min(MAX_REFERRAL_PARTNER_LENGTH)];
  Some(truncated.to_string())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn empty_returns_none() {
    assert_eq!(sanitize_referral_username(""), None);
  }

  #[test]
  fn whitespace_only_returns_none() {
    assert_eq!(sanitize_referral_username("   "), None);
  }

  #[test]
  fn trims_whitespace() {
    assert_eq!(sanitize_referral_username("  alice  "), Some("alice".to_string()));
  }

  #[test]
  fn truncates_long_values() {
    let long = "a".repeat(50);
    let result = sanitize_referral_username(&long).unwrap();
    assert_eq!(result.len(), 32);
  }

  #[test]
  fn passes_through_normal_values() {
    assert_eq!(sanitize_referral_username("bob123"), Some("bob123".to_string()));
  }
}
