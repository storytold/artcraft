use crate::errors::client_error::ClientError;
use crate::errors::download_error::DownloadError;
use crate::errors::provider_error::ProviderError;
use fal_client::error::fal_error_plus::FalErrorPlus;
use seedance2pro_client::error::seedance2pro_error::Seedance2ProError;
use seedance2pro_client::error::seedance2pro_specific_api_error::Seedance2ProSpecificApiError;
use std::error::Error;
use std::fmt::{Display, Formatter};
use artcraft_client::error::api_error::ApiError;
use artcraft_client::error::storyteller_error::StorytellerError;

#[derive(Debug)]
pub enum ArtcraftRouterError {
  /// A client configuration error.
  Client(ClientError),

  /// Failed to download a file from a URL (e.g. when re-uploading to a provider's CDN).
  Download(DownloadError),

  /// The requested model is not yet supported by the router.
  UnsupportedModel(String),

  /// [Temporary during migration] The requested model/provider is not yet supported by the router.
  UnsupportedProviderAndModelForNewApi(String),

  /// Invalid or missing input arguments.
  InvalidInput(String),

  /// An error from an underlying provider.
  Provider(ProviderError),
  
  /// A billing error from an underlying provider.
  ProviderBillingError(ProviderError),
}

impl Error for ArtcraftRouterError {}

impl Display for ArtcraftRouterError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Client(e) => write!(f, "Client error: {}", e),
      Self::Download(e) => write!(f, "Download error: {}", e),
      Self::UnsupportedModel(model) => write!(f, "Unsupported model: {}", model),
      Self::UnsupportedProviderAndModelForNewApi(msg) => write!(f, "Unsupported provider/model (for new API during migration): {}", msg),
      Self::InvalidInput(msg) => write!(f, "Invalid input: {}", msg),
      Self::Provider(e) => write!(f, "Provider error: {}", e),
      Self::ProviderBillingError(e) => write!(f, "Provider billing error: {}", e),
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
    let is_billing_error = match &error {
      ProviderError::Fal(FalErrorPlus::FalBillingError(_)) => true,
      ProviderError::Seedance2Pro(Seedance2ProError::ApiSpecific(Seedance2ProSpecificApiError::BillingError { .. })) => true,
      ProviderError::Storyteller(StorytellerError::Api(ApiError::PaymentRequired(_))) => true,
      _ => false,
    };
    if is_billing_error {
      Self::ProviderBillingError(error)
    } else {
      Self::Provider(error)
    }
  }
}

impl From<FalErrorPlus> for ArtcraftRouterError {
  fn from(error: FalErrorPlus) -> Self {
    match &error {
      FalErrorPlus::FalBillingError(e) => ArtcraftRouterError::ProviderBillingError(ProviderError::Fal(error)),
      _ => ArtcraftRouterError::Provider(ProviderError::Fal(error)),
    }
  }
}
