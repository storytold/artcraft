use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{ImageEditModel, EditImageQuality, EditImageSize};
use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::Provider;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::midjourney::windows::open_midjourney_login_window::open_midjourney_login_window;
use crate::services::sora::windows::sora_login_window::open_sora_login_window::open_sora_login_window;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::storyteller::windows::open_storyteller_billing_window::{open_storyteller_billing_window, OpenStorytellerBillingWindowArgs, BillingWindowCase};
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::PlanBillingCadence;
use enums::common::payments_namespace::PaymentsNamespace;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::{Deserialize, Serialize};
use artcraft_client::endpoints::credits::get_session_credits::get_session_credits;
use tauri::{AppHandle, State};
use crate::core::commands::providers::get_provider_order_command::GetProviderOrderResponse;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
// TODO(bt,2025-09-12): Cache credits and clear cache on generate calls.

#[derive(Serialize)]
pub struct GetCreditsResponse {
  pub free_credits: u64,
  pub monthly_credits: u64,
  pub banked_credits: u64,
  pub sum_total_credits: u64,
}

impl SerializeMarker for GetCreditsResponse {}

#[tauri::command]
pub async fn storyteller_get_credits_command(
  app_env_configs: State<'_, AppEnvConfigs>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
) -> ResponseOrErrorMessage<GetCreditsResponse> {

  info!("storyteller_get_credits_command called");

  let credits = get_credits(
    &app_env_configs,
    &storyteller_creds_manager)
      .await
      .map_err(|err| {
        error!("Error getting credits: {:?}", err);
        format!("Error getting credits: {:?}", err)
      })?;

  Ok(credits.into())
}

async fn get_credits(
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> AnyhowResult<GetCreditsResponse> {

  let maybe_creds = storyteller_creds_manager.get_credentials()?;

  let response = get_session_credits(
    &app_env_configs.storyteller_host,
    maybe_creds.as_ref(),
    PaymentsNamespace::Artcraft,
  ).await?;

  Ok(GetCreditsResponse {
    free_credits: response.free_credits,
    monthly_credits: response.monthly_credits,
    banked_credits: response.banked_credits,
    sum_total_credits: response.sum_total_credits,
  })
}
