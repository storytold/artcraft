use crate::core::commands::enqueue::generate_error::{BillingIssueReason, BillingProvider, GenerateError, ProviderFailureReason};
use crate::core::events::functional_events::show_provider_billing_modal_event::ShowProviderBillingModalEvent;
use enums::common::generation_provider::GenerationProvider;
use log::warn;
use artcraft_client::error::api_error::ApiError;
use artcraft_client::error::storyteller_error::StorytellerError;
use tauri::AppHandle;

pub async fn maybe_notify_frontend_of_billing_errors(
  app: &AppHandle,
  error: &GenerateError,
) {
  match error {
    GenerateError::BillingIssue(reason) => {
      billing_error(app, reason);
    }
    GenerateError::ProviderFailure(reason) => {
      provider_billing_error(app, reason);
    }
    _ => {
      // Do nothing for other types of errors
    }
  }
}

fn billing_error(
  app: &AppHandle,
  reason: &BillingIssueReason,
) {
  let provider = match reason.provider {
    BillingProvider::Artcraft => GenerationProvider::Artcraft,
    BillingProvider::Fal => GenerationProvider::Fal,
    BillingProvider::Kinovi => GenerationProvider::Artcraft, // NB: We don't support Kinovi yet.
    BillingProvider::Midjourney => GenerationProvider::Midjourney,
    BillingProvider::Sora => GenerationProvider::Sora,
  };
  warn!("Billing issue with: {:?}", provider);
  ShowProviderBillingModalEvent::send_for_provider(provider, app);
}

fn provider_billing_error(
  app: &AppHandle,
  error: &ProviderFailureReason,
) {
  let provider;
  
  match error {
    ProviderFailureReason::StorytellerError(StorytellerError::Api(ApiError::PaymentRequired(reason))) => {
      warn!("Billing issue with Artcraft/Storyteller: {}", reason);
      provider = GenerationProvider::Artcraft;
    }
    _ => {
      return;
    }
  }
  
  ShowProviderBillingModalEvent::send_for_provider(provider, app);
}
