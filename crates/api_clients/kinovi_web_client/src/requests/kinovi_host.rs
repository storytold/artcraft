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
      // NB: The API endpoint moved to kinovi.ai but the CDN for uploaded materials
      // still uses the legacy seedance2-pro.com domain. The generate_video API
      // expects URLs on this domain.
      Self::Kinovi => "https://static.seedance2-pro.com",
      // Self::Kinovi => "https://static.kinovi.ai",
      Self::Seedance2Pro => "https://static.seedance2-pro.com",
      Self::CustomHost { cdn_host, .. } => cdn_host.as_str(),
    }
  }
}

/// Env var pair for a process-wide custom host (both must be set and
/// non-empty to take effect). Intended for tests and local development
/// against a stub server; leave unset in production.
pub const ENV_KINOVI_CUSTOM_API_HOST: &str = "KINOVI_CUSTOM_API_HOST";
pub const ENV_KINOVI_CUSTOM_CDN_HOST: &str = "KINOVI_CUSTOM_CDN_HOST";

/// Resolves an optional host override to the effective host.
///
/// Precedence: explicit `host_override` argument, then the
/// [`ENV_KINOVI_CUSTOM_API_HOST`] / [`ENV_KINOVI_CUSTOM_CDN_HOST`] env var
/// pair, then the default host.
pub fn resolve_host(host_override: Option<&KinoviHost>) -> KinoviHost {
  if let Some(host) = host_override {
    return host.clone();
  }

  if let (Ok(api_host), Ok(cdn_host)) = (
    std::env::var(ENV_KINOVI_CUSTOM_API_HOST),
    std::env::var(ENV_KINOVI_CUSTOM_CDN_HOST),
  ) {
    if !api_host.is_empty() && !cdn_host.is_empty() {
      return KinoviHost::CustomHost { api_host, cdn_host };
    }
  }

  KinoviHost::default()
}
