use crate::errors::client_error::ClientError;
use crate::errors::download_error::DownloadError;
use crate::errors::provider_error::ProviderError;
use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum ArtcraftRouterError {
  /// A client configuration error.
  Client(ClientError),

  /// Failed to download a file from a URL (e.g. when re-uploading to a provider's CDN).
  Download(DownloadError),

  /// The requested model is not yet supported by the router.
  UnsupportedModel(String),

  /// Invalid or missing input arguments.
  InvalidInput(String),

  /// An error from an underlying provider.
  Provider(ProviderError),
}

impl Error for ArtcraftRouterError {}

impl Display for ArtcraftRouterError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Client(e) => write!(f, "Client error: {}", e),
      Self::Download(e) => write!(f, "Download error: {}", e),
      Self::UnsupportedModel(model) => write!(f, "Unsupported model: {}", model),
      Self::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
      Self::Provider(e) => write!(f, "Provider error: {}", e),
    }
  }
}

impl From<ClientError> for ArtcraftRouterError {
  fn from(error: ClientError) -> Self {
    Self::Client(error)
  }
}

impl From<DownloadError> for ArtcraftRouterError {
  fn from(error: DownloadError) -> Self {
    Self::Download(error)
  }
}

impl From<ProviderError> for ArtcraftRouterError {
  fn from(error: ProviderError) -> Self {
    Self::Provider(error)
  }
}
