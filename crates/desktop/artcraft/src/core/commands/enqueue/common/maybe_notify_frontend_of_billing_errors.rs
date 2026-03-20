use crate::core::commands::enqueue::generate_error::{BillingIssueReason, BillingProvider, GenerateError, ProviderFailureReason};
use crate::core::events::functional_events::show_provider_billing_modal_event::ShowProviderBillingModalEvent;
use enums_api::common::generation::generation_provider::GenerationProvider;
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
    BillingProvider::Fal => GenerationProvider::Fal,
    BillingProvider::Midjourney => GenerationProvider::Midjourney,
    BillingProvider::Sora => GenerationProvider::Sora,
    BillingProvider::Storyteller => GenerationProvider::Artcraft,
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
