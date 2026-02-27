use crate::core::artcraft_error::ArtcraftError;
use anyhow::anyhow;
use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use artcraft_router::errors::provider_error::ProviderError;
use base64::DecodeError;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use errors::AnyhowError;
use grok_client::error::grok_error::GrokError;
use midjourney_client::error::midjourney_error::MidjourneyError;
use openai_sora_client::error::sora_error::SoraError;
use storyteller_client::error::storyteller_error::StorytellerError;
use world_labs_client::error::world_labs_error::WorldLabsError;
//use fal_client::error::fal_error_plus::FalErrorPlus;

#[derive(Debug)]
pub enum GenerateError {
  BadInput(BadInputReason),
  MissingCredentials(MissingCredentialsReason),
  ProviderFailure(ProviderFailureReason),

  /// We couldn't find a provider to dispatch the request to.
  NoProviderAvailable,
  
  /// We pulled out Fal (for now) - it's impacting build speeds. We'll add it in the future.
  FalNoLongerSupported,
  
  /// Wrong provider for the model
  BadProviderForModel {
    provider: GenerationProvider,
    model: ModelType,
  },

  /// There was a billing, credits, or payments issue.
  BillingIssue(BillingIssueReason),

  /// The feature is not yet implemented.
  NotYetImplemented(String),

  // Misc error buckets
  AnyhowError(AnyhowError),
  DecodeError(DecodeError),
  IoError(std::io::Error),
}

#[derive(Debug)]
pub enum BadInputReason {
  Base64DecodeError,
  BothImageMaskMediaTokenAndBytesSupplied,
  CannotDetermineImageMimeType,
  InvalidNumberOfInputImages {
    provided: u32,
    min: u32,
    max: u32,
  },
  InvalidNumberOfRequestedImages {
    requested: u32,
    min: u32,
    max: u32,
  },
  NoModelSpecified,
  RequiredSourceImageMaskNotProvided,
  RequiredSourceImageNotProvided,
  WrongImageArguments(String),
}

#[derive(Debug)]
pub enum MissingCredentialsReason {
  NeedsGrokCredentials,
  NeedsFalApiKey,
  NeedsMidjourneyCredentials,
  NeedsMidjourneyUserId,
  NeedsMidjourneyUserInfo,
  NeedsSoraCredentials,
  NeedsStorytellerCredentials,
  NeedsWorldLabsCredentials,
}

#[derive(Debug)]
pub struct BillingIssueReason {
  pub provider: BillingProvider,
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub enum BillingProvider {
  Fal,
  Midjourney,
  Sora,
  Storyteller,
}

#[derive(Debug)]
pub enum ProviderFailureReason {
  GrokError(GrokError),
  /// NB: The Grok client doesn't say why certain errors (eg. missing fields) happen, so we synthesize this.
  GrokJobEnqueueFailed,
  //Fal(FalErrorPlus),
  MidjourneyError(MidjourneyError),
  /// NB: The midjourney client doesn't categorize all errors, so we have to do so on our end.
  MidjourneyJobEnqueueFailed,
  SoraError(SoraError),
  StorytellerError(StorytellerError),
  WorldLabsError(WorldLabsError),
}

impl GenerateError {

  //
  // Bad input
  //

  pub fn both_image_mask_media_token_and_bytes_supplied() -> Self {
    Self::BadInput(BadInputReason::BothImageMaskMediaTokenAndBytesSupplied)
  }

  pub fn no_model_specified() -> Self {
    Self::BadInput(BadInputReason::NoModelSpecified)
  }

  pub fn required_source_image_mask_not_provided() -> Self {
    Self::BadInput(BadInputReason::RequiredSourceImageMaskNotProvided)
  }

  pub fn required_source_image_not_provided() -> Self {
    Self::BadInput(BadInputReason::RequiredSourceImageNotProvided)
  }

  //
  // Missing credentials
  //

  pub fn needs_fal_api_key() -> Self {
    Self::MissingCredentials(MissingCredentialsReason::NeedsFalApiKey)
  }

  pub fn needs_grok_credentials() -> Self {
    Self::MissingCredentials(MissingCredentialsReason::NeedsGrokCredentials)
  }

  pub fn needs_midjourney_credentials() -> Self {
    Self::MissingCredentials(MissingCredentialsReason::NeedsMidjourneyCredentials)
  }

  pub fn needs_sora_credentials() -> Self {
    Self::MissingCredentials(MissingCredentialsReason::NeedsSoraCredentials)
  }

  pub fn needs_storyteller_credentials() -> Self {
    Self::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials)
  }

  pub fn needs_worldlabs_credentials() -> Self {
    Self::MissingCredentials(MissingCredentialsReason::NeedsWorldLabsCredentials)
  }
}

impl From<AnyhowError> for GenerateError {
  fn from(value: AnyhowError) -> Self {
    Self::AnyhowError(value)
  }
}

impl From<ArtcraftError> for GenerateError {
  fn from(value: ArtcraftError) -> Self {
    match value {
      ArtcraftError::AnyhowError(e) => Self::AnyhowError(e),
      ArtcraftError::DecodeError(e) => Self::DecodeError(e),
      ArtcraftError::IoError(e) => Self::IoError(e),
      ArtcraftError::GrokError(e) => Self::ProviderFailure(ProviderFailureReason::GrokError(e)),
      ArtcraftError::StorytellerError(e) => Self::ProviderFailure(ProviderFailureReason::StorytellerError(e)),
      ArtcraftError::RwLockReadError => Self::AnyhowError(anyhow!("Lock read error")),
      ArtcraftError::RwLockWriteError => Self::AnyhowError(anyhow!("Lock write error")),
      ArtcraftError::MutexLockError => Self::AnyhowError(anyhow!("Mutex lock error")),
      ArtcraftError::ReqwestError(err) => Self::AnyhowError(anyhow!("Reqwest error: {:?}", err)),
      ArtcraftError::BadDownloadFilename { path } => Self::AnyhowError(anyhow!("Bad download file name: {:?}", path)),
      ArtcraftError::CannotDownloadFilePathAlreadyExists { path } => Self::AnyhowError(anyhow!("Cannot download already existing file: {:?}", path)),
    }
  }
}

//impl From<FalErrorPlus> for GenerateError {
//  fn from(value: FalErrorPlus) -> Self {
//    Self::ProviderFailure(ProviderFailureReason::Fal(value))
//  }
//}

impl From<GrokError> for GenerateError {
  fn from(value: GrokError) -> Self {
    Self::ProviderFailure(ProviderFailureReason::GrokError(value))
  }
}

impl From<MidjourneyError> for GenerateError {
  fn from(value: MidjourneyError) -> Self {
    Self::ProviderFailure(ProviderFailureReason::MidjourneyError(value))
  }
}

impl From<SoraError> for GenerateError {
  fn from(value: SoraError) -> Self {
    Self::ProviderFailure(ProviderFailureReason::SoraError(value))
  }
}

impl From<StorytellerError> for GenerateError {
  fn from(value: StorytellerError) -> Self {
    Self::ProviderFailure(ProviderFailureReason::StorytellerError(value))
  }
}

impl From<WorldLabsError> for GenerateError {
  fn from(value: WorldLabsError) -> Self {
    Self::ProviderFailure(ProviderFailureReason::WorldLabsError(value))
  }
}

impl From<ArtcraftRouterError> for GenerateError {
  fn from(value: ArtcraftRouterError) -> Self {
    match value {
      ArtcraftRouterError::Client(e) => Self::BadInput(BadInputReason::WrongImageArguments(e.to_string())),
      ArtcraftRouterError::UnsupportedModel(model) => Self::NotYetImplemented(format!("Unsupported model: {}", model)),
      ArtcraftRouterError::InvalidInput(msg) => Self::BadInput(BadInputReason::WrongImageArguments(msg)),
      ArtcraftRouterError::Provider(ProviderError::Storyteller(e)) => {
        Self::ProviderFailure(ProviderFailureReason::StorytellerError(e))
      }
    }
  }
}
