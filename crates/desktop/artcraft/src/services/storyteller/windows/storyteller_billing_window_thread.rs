use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::credits_balance_changed_event::CreditsBalanceChangedEvent;
use crate::core::events::functional_events::refresh_account_state_event::RefreshAccountStateEvent;
use crate::core::events::functional_events::subscription_plan_changed_event::SubscriptionPlanChangedEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::window::get_webview_window_hostname::get_webview_window_hostname;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::midjourney::state::midjourney_user_info::MidjourneyUserInfo;
use crate::services::midjourney::windows::extract_midjourney_webview_cookies::extract_midjourney_webview_cookies;
use crate::services::sora::events::sora_login_success_event::SoraLoginSuccessEvent;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::windows::sora_login_window::extract_sora_webview_cookies::extract_sora_webview_cookies;
use crate::services::storyteller::windows::open_storyteller_billing_window::BILLING_WINDOW_NAME;
use anyhow::anyhow;
use cookie_store::cookie_store::CookieStore;
use enums::common::generation_provider::GenerationProvider;
use errors::AnyhowResult;
use log::{error, info};
use midjourney_client::client::midjourney_hostname::MidjourneyHostname;
use midjourney_client::credentials::cookie_store_has_auth_cookies::cookie_store_has_auth_cookies;
use midjourney_client::recipes::get_user_info::{get_user_info, GetUserInfoRequest};
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::recipes::maybe_upgrade_or_renew_session::maybe_upgrade_or_renew_session;
use tauri::{AppHandle, Manager, WebviewWindow};

pub async fn storyteller_billing_window_thread(
  app: AppHandle,
  app_data_root: AppDataRoot,
) {
  loop {
    let billing_webview_window = match app.get_webview_window(BILLING_WINDOW_NAME) {
      Some(webview) => webview,
      None => {
        info!("Exit billing window thread.");
        return; // NB: Only exit if we don't have the webview.
      }
    };

    let result = check_billing_window(
      &app,
      &billing_webview_window,
    ).await;

    match result {
      Err(err) => {
        error!("Error checking billing window: {:?}", err);
      }
      Ok(false) => {} // Continue iteration and try again...
      Ok(true) => {
        info!("Checkout complete; exiting");
        if let Err(err) = billing_webview_window.close() {
          error!("Error closing billing window: {:?}", err);
        }

        // TODO: We can distinguish between subscription and credits impacts if we send a parameter
        //  from the webview. For now, just refresh everything.

        // Refresh the credits view
        CreditsBalanceChangedEvent{}.send_infallible(&app);
        SubscriptionPlanChangedEvent{}.send_infallible(&app);

        // And in case there's a race condition (likely), do it again after a delay.
        tokio::time::sleep(std::time::Duration::from_millis(5_000)).await;
        CreditsBalanceChangedEvent{}.send_infallible(&app);
        SubscriptionPlanChangedEvent{}.send_infallible(&app);

        return;
      }
    }

    tokio::time::sleep(std::time::Duration::from_millis(1_000)).await;
  }
}

/// Returns true if we can exit.
async fn check_billing_window(
  app_handle: &AppHandle,
  webview_window: &WebviewWindow,
) -> AnyhowResult<bool> {

  let url = webview_window.url()?;

  let hostname= url
      .host()
      .ok_or(anyhow!("no host in url"))?
      .to_string();

  match hostname.as_str() {
    "getartcraft.com" |
    "storyteller.ai" => {
      // Checkout done. Fall-through.
    },
    "stripe.com" | "checkout.stripe.com" => {
      return Ok(false) // Still in checkout flow.
    }
    _ => {
      return Ok(false) // Unknown hostname...
    }
  }

  let path = url
      .path()
      .to_string();
  
  // TODO: This is brittle.
  
  let success = path.contains("checkout_success");
  
  info!("Checkout success: {}", success);

  // TODO: Send success events:

  // let event = RefreshAccountStateEvent {
  //   provider: Some(GenerationProvider::Midjourney),
  // };
  //
  // if let Err(err) = event.send(&app_handle) {
  //   error!("Failed to send RefreshAccountStateEvent: {:?}", err); // Fail open
  // }

  Ok(true)
}
