use chrono::{DateTime, Utc};
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{ImageEditModel, EditImageQuality, EditImageSize};
use crate::core::commands::providers::get_provider_order_command::GetProviderOrderResponse;
use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::Provider;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::midjourney::windows::open_midjourney_login_window::open_midjourney_login_window;
use crate::services::sora::windows::sora_login_window::open_sora_login_window::open_sora_login_window;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::storyteller::windows::open_storyteller_billing_window::{open_storyteller_billing_window, OpenStorytellerBillingWindowArgs, BillingWindowCase};
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::PlanBillingCadence;
use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use enums::common::payments_namespace::PaymentsNamespace;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::{Deserialize, Serialize};
use artcraft_client::endpoints::credits::get_session_credits::get_session_credits;
use artcraft_client::endpoints::subscriptions::get_session_subscription::get_session_subscription;
use tauri::{AppHandle, State};
use tokens::tokens::user_subscriptions::UserSubscriptionToken;
// TODO(bt,2025-09-12): Cache credits and clear cache on generate calls.

#[derive(Serialize)]
pub struct GetSubscriptionResponse {
  /// Information about the subscription, if any.
  pub active_subscription: Option<ActiveSubscriptionInfo>,
}

#[derive(Serialize)]
pub struct ActiveSubscriptionInfo {
  pub subscription_token: UserSubscriptionToken,
  pub product_slug: ArtcraftSubscriptionSlug,
  pub namespace: PaymentsNamespace,

  /// If the subscription is active, this is the next bill date
  pub next_bill_at: Option<DateTime<Utc>>,

  /// If the subscription is expired or is set to expire, this is the end date of the subscription.
  pub subscription_end_at: Option<DateTime<Utc>>,
}

impl SerializeMarker for GetSubscriptionResponse {}

#[tauri::command]
pub async fn storyteller_get_subscription_command(
  app_env_configs: State<'_, AppEnvConfigs>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
) -> ResponseOrErrorMessage<GetSubscriptionResponse> {

  info!("storyteller_get_subscription_command called");

  let credits = get(
    &app_env_configs,
    &storyteller_creds_manager)
      .await
      .map_err(|err| {
        error!("Error getting credits: {:?}", err);
        format!("Error getting credits: {:?}", err)
      })?;

  Ok(credits.into())
}

async fn get(
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> AnyhowResult<GetSubscriptionResponse> {

  let maybe_creds = storyteller_creds_manager.get_credentials()?;

  let response = get_session_subscription(
    &app_env_configs.storyteller_host,
    maybe_creds.as_ref(),
    PaymentsNamespace::Artcraft,
  ).await?;

  Ok(GetSubscriptionResponse {
    active_subscription: response.active_subscription
        .map(|sub| {
          let product_slug = match ArtcraftSubscriptionSlug::from_str(&sub.product_slug) {
            Ok(product_slug) => product_slug,
            Err(err) => {
              error!("Received unknown product slug from storyteller: {:?}, error: {:?}", sub.product_slug, err);
              return None;
            },
          };
          Some(ActiveSubscriptionInfo {
            subscription_token: sub.subscription_token,
            product_slug,
            namespace: sub.namespace,
            next_bill_at: sub.next_bill_at,
            subscription_end_at: sub.subscription_end_at,
          })
        })
        .flatten(),
  })
}
