use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// Defines the names of the Tauri-sent events that the frontend subscribes to.
/// These event names are also stored in the database, so keep them short-ish.
///
/// NB: Events should end in "_event" so they're easy to grep for in Javascript.
#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum TauriEventName {
  // TODO: Get rid of kebab case.
  /// General purpose event:
  /// Generation enqueued
  #[serde(rename = "generation-enqueue-success-event")]
  GenerationEnqueueSuccessEvent,

  // TODO: Get rid of kebab case.
  /// General purpose event:
  /// Generation failed to enqueue
  #[serde(rename = "generation-enqueue-failure-event")]
  GenerationEnqueueFailureEvent,

  // TODO: Get rid of kebab case.
  /// General purpose event:
  /// Generation completed successfully
  #[serde(rename = "generation-complete-event")]
  GenerationCompleteEvent,

  // TODO: Get rid of kebab case.
  /// General purpose event:
  /// Generation failed
  #[serde(rename = "generation-failed-event")]
  GenerationFailedEvent,

  /// Informational event:
  /// Credits were purchased or spent (but we don't know how much)
  #[serde(rename = "credits_balance_changed_event")]
  CreditsBalanceChangedEvent,

  /// Informational event:
  /// Subscription was changed (but we don't know the details - upgrade, cancel, etc.)
  #[serde(rename = "subscription_plan_changed_event")]
  SubscriptionPlanChangedEvent,

  /// Informational event:
  /// A media file was deleted (and we'll send the token)
  #[serde(rename = "media_file_deleted_event")]
  MediaFileDeletedEvent,

  /// Special event:
  /// Background removal is complete
  #[serde(rename = "canvas_bg_removed_event")]
  CanvasBgRemovedEvent,

  /// Special event:
  /// Image generation is complete
  #[serde(rename = "text_to_image_generation_complete_event")]
  TextToImageGenerationCompleteEvent,

  /// Special event:
  /// Image edit is complete
  #[serde(rename = "image_edit_complete_event")]
  ImageEditCompleteEvent,
  
  /// Special event:
  /// Object (3D mesh) generation is complete
  #[serde(rename = "object_generation_complete_event")]
  ObjectGenerationCompleteEvent,
  
  /// Special event:
  /// Gaussian generation is complete
  #[serde(rename = "gaussian_generation_complete_event")]
  GaussianGenerationCompleteEvent,

  /// Special event:
  /// Video generation is complete
  #[serde(rename = "video_generation_complete_event")]
  VideoGenerationCompleteEvent,

  /// Special event:
  /// Refresh account states
  #[serde(rename = "refresh_account_state_event")]
  RefreshAccountStateEvent,

  /// Special event:
  /// Show a billing modal (a suggestion to pay, etc. for a specific provider)
  #[serde(rename = "show_provider_billing_modal_event")]
  ShowProviderBillingModalEvent,
  
  /// Special event:
  /// Show a login modal (or a suggestion to login)
  #[serde(rename = "show_provider_login_modal_event")]
  ShowProviderLoginModalEvent,
  
  /// Warning event:
  /// Flash a user input error message
  #[serde(rename = "flash_user_input_error_event")]
  FlashUserInputErrorEvent,

  /// Warning event:
  /// File with that name was already downloaded
  #[serde(rename = "flash_file_download_error_event")]
  FlashFileDownloadErrorEvent,
}


// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl TauriEventName {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::GenerationEnqueueSuccessEvent => "generation-enqueue-success-event",
      Self::GenerationEnqueueFailureEvent => "generation-enqueue-failure-event",
      Self::GenerationCompleteEvent => "generation-complete-event",
      Self::GenerationFailedEvent => "generation-failed-event",
      Self::CreditsBalanceChangedEvent => "credits_balance_changed_event",
      Self::SubscriptionPlanChangedEvent => "subscription_plan_changed_event",
      Self::MediaFileDeletedEvent => "media_file_deleted_event",
      Self::CanvasBgRemovedEvent => "canvas_bg_removed_event",
      Self::TextToImageGenerationCompleteEvent => "text_to_image_generation_complete_event",
      Self::ImageEditCompleteEvent => "image_edit_complete_event",
      Self::ObjectGenerationCompleteEvent => "object_generation_complete_event",
      Self::GaussianGenerationCompleteEvent => "gaussian_generation_complete_event",
      Self::VideoGenerationCompleteEvent => "video_generation_complete_event",
      Self::RefreshAccountStateEvent => "refresh_account_state_event",
      Self::ShowProviderBillingModalEvent => "show_provider_billing_modal_event",
      Self::ShowProviderLoginModalEvent => "show_provider_login_modal_event",
      Self::FlashUserInputErrorEvent => "flash_user_input_error_event",
      Self::FlashFileDownloadErrorEvent => "flash_file_download_error_event",
    }
  }

  pub fn from_str(job_status: &str) -> Result<Self, String> {
    match job_status {
      "generation-enqueue-success-event" => Ok(Self::GenerationEnqueueSuccessEvent),
      "generation-enqueue-failure-event" => Ok(Self::GenerationEnqueueFailureEvent),
      "generation-complete-event" => Ok(Self::GenerationCompleteEvent),
      "generation-failed-event" => Ok(Self::GenerationFailedEvent),
      "credits_balance_changed_event" => Ok(Self::CreditsBalanceChangedEvent),
      "subscription_plan_changed_event" => Ok(Self::SubscriptionPlanChangedEvent),
      "media_file_deleted_event" => Ok(Self::MediaFileDeletedEvent),
      "canvas_bg_removed_event" => Ok(Self::CanvasBgRemovedEvent),
      "text_to_image_generation_complete_event" => Ok(Self::TextToImageGenerationCompleteEvent),
      "image_edit_complete_event" => Ok(Self::ImageEditCompleteEvent),
      "object_generation_complete_event" => Ok(Self::ObjectGenerationCompleteEvent),
      "gaussian_generation_complete_event" => Ok(Self::GaussianGenerationCompleteEvent),
      "video_generation_complete_event" => Ok(Self::VideoGenerationCompleteEvent),
      "refresh_account_state_event" => Ok(Self::RefreshAccountStateEvent),
      "show_provider_billing_modal_event" => Ok(Self::ShowProviderBillingModalEvent),
      "show_provider_login_modal_event" => Ok(Self::ShowProviderLoginModalEvent),
      "flash_user_input_error_event" => Ok(Self::FlashUserInputErrorEvent),
      "flash_file_download_error_event" => Ok(Self::FlashFileDownloadErrorEvent),
      _ => Err(format!("invalid tauri_event_name: {:?}", job_status)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::GenerationEnqueueSuccessEvent,
      Self::GenerationEnqueueFailureEvent,
      Self::GenerationCompleteEvent,
      Self::GenerationFailedEvent,
      Self::CreditsBalanceChangedEvent,
      Self::SubscriptionPlanChangedEvent,
      Self::MediaFileDeletedEvent,
      Self::CanvasBgRemovedEvent,
      Self::TextToImageGenerationCompleteEvent,
      Self::ImageEditCompleteEvent,
      Self::ObjectGenerationCompleteEvent,
      Self::GaussianGenerationCompleteEvent,
      Self::VideoGenerationCompleteEvent,
      Self::RefreshAccountStateEvent,
      Self::ShowProviderBillingModalEvent,
      Self::ShowProviderLoginModalEvent,
      Self::FlashUserInputErrorEvent,
      Self::FlashFileDownloadErrorEvent,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::TauriEventName;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in TauriEventName::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: TauriEventName = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
