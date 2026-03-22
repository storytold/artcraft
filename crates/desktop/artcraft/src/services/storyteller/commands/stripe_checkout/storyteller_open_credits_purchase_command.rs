use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{ImageEditModel, EditImageQuality, EditImageSize};
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::midjourney::windows::open_midjourney_login_window::open_midjourney_login_window;
use crate::services::sora::windows::sora_login_window::open_sora_login_window::open_sora_login_window;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::storyteller::windows::open_storyteller_billing_window::{open_storyteller_billing_window, OpenStorytellerBillingWindowArgs, BillingWindowCase};
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::PlanBillingCadence;
use enums::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;
use errors::AnyhowResult;
use log::{error, info};
use serde_derive::Deserialize;
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;

#[derive(Deserialize, Debug)]
pub struct StorytellerOpenCreditsPurchaseCommand {
  pub credits_pack: Option<ArtcraftCreditsPackSlug>,
}

#[tauri::command]
pub async fn storyteller_open_credits_purchase_command(
  app: AppHandle,
  request: StorytellerOpenCreditsPurchaseCommand,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
) -> Result<String, String> {
  info!("storyteller_open_credits_purchase_command called");

  let credits_pack = request.credits_pack.ok_or("Credits pack is required")?;
  
  do_open_billing(
    &app, 
    &app_data_root, 
    &app_env_configs, 
    &storyteller_creds_manager,
    credits_pack,
  )
      .await
      .map_err(|err| {
        error!("Error opening credits purchase window: {:?}", err);
        format!("Error opening credits purchase window: {:?}", err)
      })?;

  Ok("result".to_string())
}

async fn do_open_billing(
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
  credits_pack: ArtcraftCreditsPackSlug,
) -> AnyhowResult<()> {
  info!("Building billing window...");

  open_storyteller_billing_window(OpenStorytellerBillingWindowArgs {
    app,
    app_data_root,
    app_env_configs,
    storyteller_creds_manager,
    billing_window_case: BillingWindowCase::CreditsPack {
      credits_pack,
    }
  }).await?;

  info!("Done.");
  Ok(())
}
