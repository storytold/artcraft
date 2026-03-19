/// The host to target for API requests.
///
/// The service was originally at `seedance2-pro.com` but migrated to `kinovi.ai`.
/// This enum allows configuring which host to use.
#[derive(Debug, Clone)]
pub enum KinoviHost {
  /// https://kinovi.ai (current default)
  Kinovi,
  /// https://seedance2-pro.com (legacy)
  Seedance2Pro,
  /// Custom host, e.g. "https://example.com" or "http://localhost:1234"
  /// Must include the URL scheme but no trailing slash.
  CustomHost(String),
}

impl Default for KinoviHost {
  fn default() -> Self {
    Self::Kinovi
  }
}

impl KinoviHost {
  /// Returns the base URL (scheme + domain, no trailing slash).
  pub fn base_url(&self) -> &str {
    match self {
      Self::Kinovi => "https://kinovi.ai",
      Self::Seedance2Pro => "https://seedance2-pro.com",
      Self::CustomHost(url) => url.as_str(),
    }
  }

  /// Returns the static content base URL (for uploaded files).
  pub fn static_base_url(&self) -> String {
    match self {
      Self::Kinovi => "https://static.kinovi.ai".to_string(),
      Self::Seedance2Pro => "https://static.seedance2-pro.com".to_string(),
      Self::CustomHost(url) => {
        // For custom hosts, try to insert "static." subdomain
        if let Some(rest) = url.strip_prefix("https://") {
          format!("https://static.{}", rest)
        } else if let Some(rest) = url.strip_prefix("http://") {
          format!("http://static.{}", rest)
        } else {
          url.clone()
        }
      }
    }
  }
}

/// Resolves an optional host override to the effective host.
pub fn resolve_host(host_override: Option<&KinoviHost>) -> &KinoviHost {
  // Use a static default to avoid needing to return owned data
  static DEFAULT: KinoviHost = KinoviHost::Kinovi;
  host_override.unwrap_or(&DEFAULT)
}
