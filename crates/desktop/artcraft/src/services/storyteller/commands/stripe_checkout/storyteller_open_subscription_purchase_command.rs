use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{ImageEditModel, EditImageQuality, EditImageSize};
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::midjourney::windows::open_midjourney_login_window::open_midjourney_login_window;
use crate::services::sora::windows::sora_login_window::open_sora_login_window::open_sora_login_window;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::storyteller::windows::open_storyteller_billing_window::{open_storyteller_billing_window, OpenStorytellerBillingWindowArgs, BillingWindowCase};
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::PlanBillingCadence;
use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::Deserialize;
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Deserialize, Debug)]
pub struct StorytellerOpenSubscriptionPurchaseCommand {
  pub plan: Option<ArtcraftSubscriptionSlug>,
  pub cadence: Option<PlanBillingCadence>,
}

#[tauri::command]
pub async fn storyteller_open_subscription_purchase_command(
  app: AppHandle,
  request: StorytellerOpenSubscriptionPurchaseCommand,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
) -> Result<String, String> {
  info!("storyteller_open_subscription_purchase_command called");

  let plan = request.plan.ok_or("Plan is required")?;
  let cadence = request.cadence.ok_or("Cadence is required")?;
  
  do_open_billing(
    &app, 
    &app_data_root, 
    &app_env_configs, 
    &storyteller_creds_manager,
    plan,
    cadence,
  )
      .await
      .map_err(|err| {
        error!("Error opening subscription purchase window: {:?}", err);
        format!("Error opening subscription purchase window: {:?}", err)
      })?;

  Ok("result".to_string())
}

async fn do_open_billing(
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
  plan: ArtcraftSubscriptionSlug,
  cadence: PlanBillingCadence,
) -> AnyhowResult<()> {
  info!("Building billing window...");

  open_storyteller_billing_window(OpenStorytellerBillingWindowArgs {
    app,
    app_env_configs,
    app_data_root,
    storyteller_creds_manager,
    billing_window_case: BillingWindowCase::Subscription {
      plan,
      cadence,
    }
  }).await?;

  info!("Done.");
  Ok(())
}
