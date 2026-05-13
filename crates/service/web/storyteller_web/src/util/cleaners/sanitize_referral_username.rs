const MAX_REFERRAL_PARTNER_LENGTH: usize = 32;

/// Sanitize an optional referral username/code for storage.
/// Trims whitespace and truncates to 32 characters.
/// Returns None if the input is None or empty after trimming.
pub fn sanitize_referral_username(maybe_value: Option<&str>) -> Option<String> {
  let value = maybe_value?;
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
  fn none_returns_none() {
    assert_eq!(sanitize_referral_username(None), None);
  }

  #[test]
  fn empty_returns_none() {
    assert_eq!(sanitize_referral_username(Some("")), None);
  }

  #[test]
  fn whitespace_only_returns_none() {
    assert_eq!(sanitize_referral_username(Some("   ")), None);
  }

  #[test]
  fn trims_whitespace() {
    assert_eq!(sanitize_referral_username(Some("  alice  ")), Some("alice".to_string()));
  }

  #[test]
  fn truncates_long_values() {
    let long = "a".repeat(50);
    let result = sanitize_referral_username(Some(&long)).unwrap();
    assert_eq!(result.len(), 32);
  }

  #[test]
  fn passes_through_normal_values() {
    assert_eq!(sanitize_referral_username(Some("bob123")), Some("bob123".to_string()));
  }
}
