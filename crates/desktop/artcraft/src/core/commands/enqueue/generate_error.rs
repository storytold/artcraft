use crate::core::artcraft_error::ArtcraftError;
use anyhow::anyhow;
use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use artcraft_router::errors::provider_error::ProviderError;
use base64::DecodeError;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_model_type::CommonModelType;
use errors::AnyhowError;
use grok_consumer_client::error::grok_error::GrokError;
use midjourney_client::error::midjourney_error::MidjourneyError;
use openai_sora_client::error::sora_error::SoraError;
use artcraft_client::error::storyteller_error::StorytellerError;
use artcraft_router::errors::download_error::DownloadError;
use worldlabs_consumer_client::error::world_labs_error::WorldLabsError;
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
    model: CommonModelType,
  },

  /// If the response didn't contain job tokens to track.
  ResponseHadNoJobTokens,

  /// Issue with Artcraft router downloads
  ArtcraftRouterDownloadError(DownloadError),

  /// A provider we don't support yet in ArtCraft "the Tauri app" part.
  ArtcraftRouterNotYetSupportedProvider(&'static str),

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
  Artcraft,
  Fal,
  Kinovi,
  Midjourney,
  Sora,
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

  //
  // Messages
  //

  /// A sentence that is safe to show a person. The frontend shows a command's `error_message` as-is in a toast,
  /// and the `Debug` text of this enum (for example `MissingCredentials(NeedsGrokCredentials)`) is not that;
  /// callers log the `Debug` text and send this instead.
  pub fn user_message(&self) -> &'static str {
    match self {
      Self::BadInput(BadInputReason::NoModelSpecified) => "No model was selected. Pick a model and try again.",
      Self::BadInput(_) => "That request wasn't valid. Check your images and settings, then try again.",
      Self::MissingCredentials(MissingCredentialsReason::NeedsFalApiKey) => "You need to set a FAL api key.",
      Self::MissingCredentials(MissingCredentialsReason::NeedsGrokCredentials) => "You need to log in to Grok.",
      Self::MissingCredentials(
        MissingCredentialsReason::NeedsMidjourneyCredentials
        | MissingCredentialsReason::NeedsMidjourneyUserId
        | MissingCredentialsReason::NeedsMidjourneyUserInfo,
      ) => "You need to log in to Midjourney.",
      Self::MissingCredentials(MissingCredentialsReason::NeedsSoraCredentials) => "You need to log in to Sora.",
      Self::MissingCredentials(MissingCredentialsReason::NeedsWorldLabsCredentials) => "You need to log in to World Labs.",
      Self::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials) => "You need to be logged into Artcraft.",
      Self::NoProviderAvailable => "No configured provider is available for this model.",
      Self::BillingIssue(_) => "There is a problem with your credits or billing. Check your account and try again.",
      _ => "A server error occurred. Please try again. If it continues, please tell our staff about the problem.",
    }
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
      ArtcraftRouterError::Download(e) => Self::ArtcraftRouterDownloadError(e),
      ArtcraftRouterError::InvalidInput(msg) => Self::BadInput(BadInputReason::WrongImageArguments(msg)),
      ArtcraftRouterError::ProviderBillingError(err) => {
        let provider = match err {
          ProviderError::Midjourney(_) | ProviderError::MidjourneySubscriptionRequired(_) | ProviderError::MidjourneySubmitRejected(_) => BillingProvider::Midjourney,
          ProviderError::Fal(_) => BillingProvider::Fal,
          ProviderError::KinoviWeb(_) => BillingProvider::Kinovi,
          ProviderError::Storyteller(_) => BillingProvider::Artcraft,
          ProviderError::GmiCloud(_) => BillingProvider::Artcraft,
          ProviderError::Grok(_) => BillingProvider::Artcraft,
          ProviderError::WorldLabs(_) => BillingProvider::Artcraft,
        };
        Self::BillingIssue(BillingIssueReason { provider })
      },
      ArtcraftRouterError::Provider(ProviderError::Midjourney(e)) => Self::from(e),
      ArtcraftRouterError::Provider(ProviderError::MidjourneySubscriptionRequired(message) | ProviderError::MidjourneySubmitRejected(message)) => Self::BadInput(BadInputReason::WrongImageArguments(message)),
      ArtcraftRouterError::Provider(ProviderError::Storyteller(e)) => Self::ProviderFailure(ProviderFailureReason::StorytellerError(e)),
      ArtcraftRouterError::Provider(ProviderError::Fal(_)) => Self::FalNoLongerSupported,
      ArtcraftRouterError::Provider(ProviderError::GmiCloud(_)) => Self::ArtcraftRouterNotYetSupportedProvider("gmicloud"),
      ArtcraftRouterError::Provider(ProviderError::Grok(_)) => Self::ArtcraftRouterNotYetSupportedProvider("grok_api"),
      ArtcraftRouterError::Provider(ProviderError::KinoviWeb(_)) => Self::ArtcraftRouterNotYetSupportedProvider("kinovi_web"),
      // NB: the desktop app reaches World Labs through the Artcraft backend; the router's
      // direct World Labs provider isn't used here.
      ArtcraftRouterError::Provider(ProviderError::WorldLabs(_)) => Self::ArtcraftRouterNotYetSupportedProvider("world_labs"),
      ArtcraftRouterError::UnsupportedModel(model) => Self::NotYetImplemented(format!("Unsupported model: {}", model)),
      ArtcraftRouterError::UnsupportedProviderAndModelForNewApi(message) => Self::ArtcraftRouterNotYetSupportedProvider("unsupported model for new router API"),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn user_messages_are_sentences_not_debug_text() {
    let errors = [
      GenerateError::no_model_specified(),
      GenerateError::required_source_image_not_provided(),
      GenerateError::needs_fal_api_key(),
      GenerateError::needs_grok_credentials(),
      GenerateError::needs_midjourney_credentials(),
      GenerateError::needs_sora_credentials(),
      GenerateError::needs_storyteller_credentials(),
      GenerateError::needs_worldlabs_credentials(),
      GenerateError::NoProviderAvailable,
      GenerateError::ResponseHadNoJobTokens,
    ];
    for error in errors {
      let message = error.user_message();
      assert_ne!(message, format!("{:?}", error));
      assert!(message.ends_with('.'), "{}", message);
      assert!(!message.contains("Needs") && !message.contains("::"), "{}", message);
    }
  }

  #[test]
  fn missing_credentials_name_the_provider() {
    assert!(GenerateError::needs_grok_credentials().user_message().contains("Grok"));
    assert!(GenerateError::needs_midjourney_credentials().user_message().contains("Midjourney"));
    assert!(GenerateError::needs_sora_credentials().user_message().contains("Sora"));
  }
}
