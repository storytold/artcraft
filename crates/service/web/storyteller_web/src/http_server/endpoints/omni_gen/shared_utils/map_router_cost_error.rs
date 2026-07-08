use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use log::warn;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Map a router error from a cost-estimation path to an HTTP error.
///
/// Caller mistakes — a model the router can't price (e.g. no Artcraft
/// route), bad option values — surface as 400s with the router's message.
/// Infrastructure-class errors stay 500s.
pub fn map_router_cost_error(error: ArtcraftRouterError) -> CommonWebError {
  match &error {
    ArtcraftRouterError::InvalidInput(reason) => {
      warn!("Cost estimate rejected: {}", reason);
      CommonWebError::BadInputWithSimpleMessage(reason.to_string())
    }
    ArtcraftRouterError::Client(_)
    | ArtcraftRouterError::UnsupportedModel(_)
    | ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(_) => {
      // NB: Don't leak configuration details.
      warn!("Cost estimate rejected: {}", error);
      CommonWebError::BadInputWithSimpleMessage("Bad input for model".to_string())
    }
    _ => {
      warn!("Cost estimate failed: {}", error);
      CommonWebError::from_error(error)
    }
  }
}
