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

  /// Custom hosts for API and CDN.
  /// Must include the URL scheme but no trailing slash.
  /// e.g. api_host: "https://example.com", cdn_host: "http://static.example.com:1234"
  CustomHost { api_host: String, cdn_host: String },
}

impl Default for KinoviHost {
  fn default() -> Self {
    Self::Kinovi
  }
}

impl KinoviHost {
  /// Returns the API base URL (scheme + domain, no trailing slash).
  pub fn api_base_url(&self) -> &str {
    match self {
      Self::Kinovi => "https://kinovi.ai",
      Self::Seedance2Pro => "https://seedance2-pro.com",
      Self::CustomHost { api_host, .. } => api_host.as_str(),
    }
  }

  /// Returns the CDN base URL for uploaded/static files (no trailing slash).
  pub fn cdn_base_url(&self) -> &str {
    match self {
      Self::Kinovi => "https://static.kinovi.ai",
      Self::Seedance2Pro => "https://static.seedance2-pro.com",
      Self::CustomHost { cdn_host, .. } => cdn_host.as_str(),
    }
  }
}

/// Resolves an optional host override to the effective host.
pub fn resolve_host(host_override: Option<&KinoviHost>) -> &KinoviHost {
  // Use a static default to avoid needing to return owned data
  static DEFAULT: KinoviHost = KinoviHost::Kinovi;
  host_override.unwrap_or(&DEFAULT)
}
