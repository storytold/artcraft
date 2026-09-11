use crate::core::state::os_platform::OsPlatform;
use crate::version::ARTCRAFT_VERSION;
use chrono::{DateTime, Utc};

#[derive(Clone, Debug)]
pub struct ArtcraftPlatformInfo {
  pub artcraft_version: String,
  
  pub os_platform: ArtcraftOs,
  pub os_version: String,
  
  pub build_timestamp: DateTime<Utc>,
  
  pub git_commit_id: Option<String>,
  pub git_commit_short_id: Option<String>,
  pub git_commit_timestamp: Option<DateTime<Utc>>,
}

#[derive(Copy, Clone, Debug)]
pub enum ArtcraftOs {
  Windows,
  MacOS,
  Linux,
  Unknown,
}

impl ArtcraftPlatformInfo {
  
  pub fn get() -> Self {
    let build_timestamp = build_metadata::build_timestamp();
    let git_commit_id = build_metadata::git_commit_id().map(|s| s.to_string());
    let git_commit_short_id = build_metadata::git_commit_short_id().map(|s| s.to_string());
    let git_commit_timestamp = build_metadata::git_commit_timestamp();

    let os_info = os_info::get();
    
    let maybe_os_version = Some(os_info.version().to_string())
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "unknown".to_string());
    
    Self {
      artcraft_version: ARTCRAFT_VERSION.to_string(),
      os_platform: match OsPlatform::maybe_get() {
        Some(OsPlatform::Linux) => ArtcraftOs::Linux,
        Some(OsPlatform::MacOs) => ArtcraftOs::MacOS,
        Some(OsPlatform::Windows) => ArtcraftOs::Windows,
        None => ArtcraftOs::Unknown,
      },
      os_version: maybe_os_version,
      build_timestamp,
      git_commit_id,
      git_commit_short_id,
      git_commit_timestamp,
    }
  }
}

impl ArtcraftOs {
  pub fn as_str(&self) -> &'static str {
    match self {
      ArtcraftOs::Windows => "windows",
      ArtcraftOs::MacOS => "macos",
      ArtcraftOs::Linux => "linux",
      ArtcraftOs::Unknown => "unknown",
    }
  }
}
