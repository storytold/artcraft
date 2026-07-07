//! Maps artcraft router errors to web errors for the omni_gen splat pipeline.
//!
//! World Labs NSFW rejections become content-policy 4xx responses and
//! auth failures become 403s (mirroring the legacy marble splat handlers).
//! Everything else is unanticipated and stays a 500.

use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use artcraft_router::errors::provider_error::ProviderError;
use worldlabs_api_client::error::world_labs_error::WorldLabsError;
use worldlabs_api_client::error::world_labs_specific_api_error::WorldLabsSpecificApiError;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Map an artcraft router error to a web error, unwrapping World Labs errors.
pub fn map_worldlabs_router_error(error: ArtcraftRouterError) -> CommonWebError {
  match error {
    ArtcraftRouterError::Provider(ProviderError::WorldLabs(worldlabs_error)) => {
      classify_worldlabs_error(worldlabs_error)
    }
    other => CommonWebError::from_error(other),
  }
}

fn classify_worldlabs_error(err: WorldLabsError) -> CommonWebError {
  if let WorldLabsError::ApiSpecific(WorldLabsSpecificApiError::NsfwContentPolicyRejected { message }) = &err {
    return CommonWebError::ContentPolicyRejectedWithMessage(
      message.clone().unwrap_or_else(|| "Content rejected by policy".to_string())
    );
  }

  if err.is_403_forbidden() {
    return CommonWebError::Forbidden;
  }

  CommonWebError::from_error(err)
}
