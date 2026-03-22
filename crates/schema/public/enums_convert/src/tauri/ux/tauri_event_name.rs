use enums_api::tauri::ux::tauri_event_name::TauriEventName as Api;
use enums_db::tauri::ux::tauri_event_name::TauriEventName as Db;

pub fn tauri_event_name_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::GenerationEnqueueSuccessEvent => Db::GenerationEnqueueSuccessEvent,
    Api::GenerationEnqueueFailureEvent => Db::GenerationEnqueueFailureEvent,
    Api::GenerationCompleteEvent => Db::GenerationCompleteEvent,
    Api::GenerationFailedEvent => Db::GenerationFailedEvent,
    Api::CreditsBalanceChangedEvent => Db::CreditsBalanceChangedEvent,
    Api::SubscriptionPlanChangedEvent => Db::SubscriptionPlanChangedEvent,
    Api::MediaFileDeletedEvent => Db::MediaFileDeletedEvent,
    Api::CanvasBgRemovedEvent => Db::CanvasBgRemovedEvent,
    Api::TextToImageGenerationCompleteEvent => Db::TextToImageGenerationCompleteEvent,
    Api::ImageEditCompleteEvent => Db::ImageEditCompleteEvent,
    Api::ObjectGenerationCompleteEvent => Db::ObjectGenerationCompleteEvent,
    Api::GaussianGenerationCompleteEvent => Db::GaussianGenerationCompleteEvent,
    Api::VideoGenerationCompleteEvent => Db::VideoGenerationCompleteEvent,
    Api::RefreshAccountStateEvent => Db::RefreshAccountStateEvent,
    Api::ShowProviderBillingModalEvent => Db::ShowProviderBillingModalEvent,
    Api::ShowProviderLoginModalEvent => Db::ShowProviderLoginModalEvent,
    Api::FlashUserInputErrorEvent => Db::FlashUserInputErrorEvent,
    Api::FlashFileDownloadErrorEvent => Db::FlashFileDownloadErrorEvent,
  }
}

pub fn tauri_event_name_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::GenerationEnqueueSuccessEvent => Api::GenerationEnqueueSuccessEvent,
    Db::GenerationEnqueueFailureEvent => Api::GenerationEnqueueFailureEvent,
    Db::GenerationCompleteEvent => Api::GenerationCompleteEvent,
    Db::GenerationFailedEvent => Api::GenerationFailedEvent,
    Db::CreditsBalanceChangedEvent => Api::CreditsBalanceChangedEvent,
    Db::SubscriptionPlanChangedEvent => Api::SubscriptionPlanChangedEvent,
    Db::MediaFileDeletedEvent => Api::MediaFileDeletedEvent,
    Db::CanvasBgRemovedEvent => Api::CanvasBgRemovedEvent,
    Db::TextToImageGenerationCompleteEvent => Api::TextToImageGenerationCompleteEvent,
    Db::ImageEditCompleteEvent => Api::ImageEditCompleteEvent,
    Db::ObjectGenerationCompleteEvent => Api::ObjectGenerationCompleteEvent,
    Db::GaussianGenerationCompleteEvent => Api::GaussianGenerationCompleteEvent,
    Db::VideoGenerationCompleteEvent => Api::VideoGenerationCompleteEvent,
    Db::RefreshAccountStateEvent => Api::RefreshAccountStateEvent,
    Db::ShowProviderBillingModalEvent => Api::ShowProviderBillingModalEvent,
    Db::ShowProviderLoginModalEvent => Api::ShowProviderLoginModalEvent,
    Db::FlashUserInputErrorEvent => Api::FlashUserInputErrorEvent,
    Db::FlashFileDownloadErrorEvent => Api::FlashFileDownloadErrorEvent,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = tauri_event_name_to_api(&variant);
      let back = tauri_event_name_to_db(&api);
      assert_eq!(variant, back);
    }
  }

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for variant in Api::iter() {
      let db = tauri_event_name_to_db(&variant);
      let back = tauri_event_name_to_api(&db);
      assert_eq!(variant, back);
    }
  }
}
