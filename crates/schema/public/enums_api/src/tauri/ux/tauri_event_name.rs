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

#[cfg(test)]
mod tests {
  use super::TauriEventName;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(TauriEventName::GenerationEnqueueSuccessEvent, "generation-enqueue-success-event");
      assert_serialization(TauriEventName::GenerationEnqueueFailureEvent, "generation-enqueue-failure-event");
      assert_serialization(TauriEventName::GenerationCompleteEvent, "generation-complete-event");
      assert_serialization(TauriEventName::GenerationFailedEvent, "generation-failed-event");
      assert_serialization(TauriEventName::CreditsBalanceChangedEvent, "credits_balance_changed_event");
      assert_serialization(TauriEventName::SubscriptionPlanChangedEvent, "subscription_plan_changed_event");
      assert_serialization(TauriEventName::MediaFileDeletedEvent, "media_file_deleted_event");
      assert_serialization(TauriEventName::CanvasBgRemovedEvent, "canvas_bg_removed_event");
      assert_serialization(TauriEventName::TextToImageGenerationCompleteEvent, "text_to_image_generation_complete_event");
      assert_serialization(TauriEventName::ImageEditCompleteEvent, "image_edit_complete_event");
      assert_serialization(TauriEventName::ObjectGenerationCompleteEvent, "object_generation_complete_event");
      assert_serialization(TauriEventName::GaussianGenerationCompleteEvent, "gaussian_generation_complete_event");
      assert_serialization(TauriEventName::VideoGenerationCompleteEvent, "video_generation_complete_event");
      assert_serialization(TauriEventName::RefreshAccountStateEvent, "refresh_account_state_event");
      assert_serialization(TauriEventName::ShowProviderBillingModalEvent, "show_provider_billing_modal_event");
      assert_serialization(TauriEventName::ShowProviderLoginModalEvent, "show_provider_login_modal_event");
      assert_serialization(TauriEventName::FlashUserInputErrorEvent, "flash_user_input_error_event");
      assert_serialization(TauriEventName::FlashFileDownloadErrorEvent, "flash_file_download_error_event");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("generation-enqueue-success-event", TauriEventName::GenerationEnqueueSuccessEvent);
      assert_deserialization("generation-enqueue-failure-event", TauriEventName::GenerationEnqueueFailureEvent);
      assert_deserialization("generation-complete-event", TauriEventName::GenerationCompleteEvent);
      assert_deserialization("generation-failed-event", TauriEventName::GenerationFailedEvent);
      assert_deserialization("credits_balance_changed_event", TauriEventName::CreditsBalanceChangedEvent);
      assert_deserialization("subscription_plan_changed_event", TauriEventName::SubscriptionPlanChangedEvent);
      assert_deserialization("media_file_deleted_event", TauriEventName::MediaFileDeletedEvent);
      assert_deserialization("canvas_bg_removed_event", TauriEventName::CanvasBgRemovedEvent);
      assert_deserialization("text_to_image_generation_complete_event", TauriEventName::TextToImageGenerationCompleteEvent);
      assert_deserialization("image_edit_complete_event", TauriEventName::ImageEditCompleteEvent);
      assert_deserialization("object_generation_complete_event", TauriEventName::ObjectGenerationCompleteEvent);
      assert_deserialization("gaussian_generation_complete_event", TauriEventName::GaussianGenerationCompleteEvent);
      assert_deserialization("video_generation_complete_event", TauriEventName::VideoGenerationCompleteEvent);
      assert_deserialization("refresh_account_state_event", TauriEventName::RefreshAccountStateEvent);
      assert_deserialization("show_provider_billing_modal_event", TauriEventName::ShowProviderBillingModalEvent);
      assert_deserialization("show_provider_login_modal_event", TauriEventName::ShowProviderLoginModalEvent);
      assert_deserialization("flash_user_input_error_event", TauriEventName::FlashUserInputErrorEvent);
      assert_deserialization("flash_file_download_error_event", TauriEventName::FlashFileDownloadErrorEvent);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(TauriEventName::iter().count(), 18);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in TauriEventName::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: TauriEventName = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
