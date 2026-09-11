use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::sora::windows::sora_login_window::sora_login_thread::sora_login_thread;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::storyteller::windows::storyteller_billing_window_thread::storyteller_billing_window_thread;
use anyhow::anyhow;
use artcraft_api_defs::stripe_artcraft::create_credits_pack_checkout::StripeArtcraftCreateCreditsPackCheckoutRequest;
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::{PlanBillingCadence, StripeArtcraftCreateSubscriptionCheckoutRequest};
use artcraft_api_defs::stripe_artcraft::customer_portal_cancel_plan::StripeArtcraftCustomerPortalCancelPlanRequest;
use artcraft_api_defs::stripe_artcraft::customer_portal_manage_plan::StripeArtcraftCustomerPortalManagePlanRequest;
use artcraft_api_defs::stripe_artcraft::customer_portal_switch_plan::{PlanBillingCadenceConfirmation, StripeArtcraftCustomerPortalSwitchPlanRequest};
use artcraft_api_defs::stripe_artcraft::customer_portal_update_payment_method::StripeArtcraftCustomerPortalUpdatePaymentMethodRequest;
use enums::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;
use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use errors::AnyhowResult;
use log::info;
use reqwest::Url;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::stripe_artcraft::create_credits_pack_checkout::create_credits_pack_checkout;
use artcraft_client::endpoints::stripe_artcraft::create_subscription_checkout::create_subscription_checkout;
use artcraft_client::endpoints::stripe_artcraft::customer_portal_cancel_plan::customer_portal_cancel_plan;
use artcraft_client::endpoints::stripe_artcraft::customer_portal_manage_plan::customer_portal_manage_plan;
use artcraft_client::endpoints::stripe_artcraft::customer_portal_switch_plan::customer_portal_switch_plan;
use artcraft_client::endpoints::stripe_artcraft::customer_portal_update_payment_method::customer_portal_update_payment_method;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub const BILLING_WINDOW_NAME: &str = "artcraft_billing_window";

pub struct OpenStorytellerBillingWindowArgs<'a> {
  pub app: &'a AppHandle,
  pub app_env_configs: &'a AppEnvConfigs,
  pub app_data_root: &'a AppDataRoot,
  pub storyteller_creds_manager: &'a StorytellerCredentialManager,
  pub billing_window_case: BillingWindowCase,
}

pub enum BillingWindowCase {
  /// Purchase a subscription plan with the billing cadence supplied.
  Subscription {
    plan: ArtcraftSubscriptionSlug,
    cadence: PlanBillingCadence,
  },
  
  /// Purchase a credits pack.
  CreditsPack {
    credits_pack: ArtcraftCreditsPackSlug,
  },
  
  /// Cancel the user's subscription.
  /// Stripe shows a confirmation and then cancels the subscription.
  CustomerPortalCancelPlan,
  
  /// Manage the user's subscription.
  /// Stripe shows complete controls for updating the plan, payment method, etc.
  CustomerPortalManagePlan,

  /// Switch the user's subscription plan.
  /// Stripe pre-fills to the selected plan and cadence.
  CustomerPortalSwitchPlan {
    plan: ArtcraftSubscriptionSlug,
    cadence: PlanBillingCadenceConfirmation,
  },
  
  /// Change the payment method attached to the customer / subscription.
  CustomerPortalUpdatePaymentMethod,
}

pub async fn open_storyteller_billing_window(
  args: OpenStorytellerBillingWindowArgs<'_>,
) -> AnyhowResult<()> {

  if args.app.get_window(BILLING_WINDOW_NAME).is_some() {
    return Err(anyhow!("Billing window already open"));
  }

  info!("Building Stripe Checkout session...");

  let creds = args.storyteller_creds_manager.get_credentials_required()?;

  let checkout_url = match args.billing_window_case {
    BillingWindowCase::Subscription { plan, cadence } => {
      get_subscription_url(
        args.app_env_configs,
        &creds,
        plan,
        cadence,
      ).await?
    },
    BillingWindowCase::CreditsPack { credits_pack } => {
      get_credits_pack_url(
        args.app_env_configs,
        &creds,
        credits_pack,
      ).await?
    },
    BillingWindowCase::CustomerPortalCancelPlan => {
      get_customer_portal_cancel_plan_url(
        args.app_env_configs,
        &creds,
      ).await?
    },
    BillingWindowCase::CustomerPortalManagePlan => {
      get_customer_portal_manage_plan_url(
        args.app_env_configs,
        &creds,
      ).await?
    },
    BillingWindowCase::CustomerPortalSwitchPlan { plan, cadence } => {
      get_customer_portal_switch_plan_url(
        args.app_env_configs,
        &creds,
        plan,
        cadence,
      ).await?
    },
    BillingWindowCase::CustomerPortalUpdatePaymentMethod => {
      get_customer_portal_update_payment_method_url(
        args.app_env_configs,
        &creds,
      ).await?
    }
  };

  do_open_window(args.app, args.app_data_root, checkout_url).await?;

  Ok(())
}

async fn get_subscription_url(
  app_env_configs: &AppEnvConfigs,
  storyteller_creds: &StorytellerCredentialSet,
  plan: ArtcraftSubscriptionSlug,
  cadence: PlanBillingCadence,
) -> AnyhowResult<Url> {

  info!("Getting URL for subscription checkout...");

  let request = StripeArtcraftCreateSubscriptionCheckoutRequest {
    plan: Some(plan),
    cadence: Some(cadence),
  };

  let result = create_subscription_checkout(
    &app_env_configs.storyteller_host,
    Some(&storyteller_creds),
    request,
  ).await?;

  info!("Checkout session created...");

  let url = Url::parse(&result.stripe_checkout_redirect_url)?;
  Ok(url)
}

async fn get_credits_pack_url(
  app_env_configs: &AppEnvConfigs,
  storyteller_creds: &StorytellerCredentialSet,
  credits_pack: ArtcraftCreditsPackSlug,
) -> AnyhowResult<Url> {

  info!("Getting URL for credits pack checkout...");

  let request = StripeArtcraftCreateCreditsPackCheckoutRequest {
    credits_pack: Some(credits_pack),
  };

  let result = create_credits_pack_checkout(
    &app_env_configs.storyteller_host,
    Some(&storyteller_creds),
    request,
  ).await?;

  info!("Credits pack checkout session created...");
  Ok(Url::parse(&result.stripe_checkout_redirect_url)?)
}

async fn get_customer_portal_cancel_plan_url(
  app_env_configs: &AppEnvConfigs,
  storyteller_creds: &StorytellerCredentialSet,
) -> AnyhowResult<Url> {

  info!("Getting customer portal cancel plan session...");

  let request = StripeArtcraftCustomerPortalCancelPlanRequest {
    portal_config_id: None,
  };

  let result = customer_portal_cancel_plan(
    &app_env_configs.storyteller_host,
    Some(&storyteller_creds),
    request,
  ).await?;

  info!("Customer portal cancel plan session created...");
  Ok(Url::parse(&result.stripe_portal_url)?)
}

async fn get_customer_portal_manage_plan_url(
  app_env_configs: &AppEnvConfigs,
  storyteller_creds: &StorytellerCredentialSet,
) -> AnyhowResult<Url> {

  info!("Getting customer portal manage plan session...");

  let request = StripeArtcraftCustomerPortalManagePlanRequest {
    portal_config_id: None,
  };

  let result = customer_portal_manage_plan(
    &app_env_configs.storyteller_host,
    Some(&storyteller_creds),
    request,
  ).await?;

  info!("Customer portal manage plan session created...");
  Ok(Url::parse(&result.stripe_portal_url)?)
}

async fn get_customer_portal_switch_plan_url(
  app_env_configs: &AppEnvConfigs,
  storyteller_creds: &StorytellerCredentialSet,
  plan: ArtcraftSubscriptionSlug,
  cadence: PlanBillingCadenceConfirmation,
) -> AnyhowResult<Url> {

  info!("Getting customer portal switch plan session...");

  let request = StripeArtcraftCustomerPortalSwitchPlanRequest {
    portal_config_id: None,
    plan: Some(plan),
    cadence: Some(cadence),
  };

  let result = customer_portal_switch_plan(
    &app_env_configs.storyteller_host,
    Some(&storyteller_creds),
    request,
  ).await?;

  info!("Customer portal switch plan session created...");
  Ok(Url::parse(&result.stripe_portal_url)?)
}

async fn get_customer_portal_update_payment_method_url(
  app_env_configs: &AppEnvConfigs,
  storyteller_creds: &StorytellerCredentialSet,
) -> AnyhowResult<Url> {

  info!("Getting customer portal update payment method session...");

  let request = StripeArtcraftCustomerPortalUpdatePaymentMethodRequest {
    portal_config_id: None,
  };

  let result = customer_portal_update_payment_method(
    &app_env_configs.storyteller_host,
    Some(&storyteller_creds),
    request,
  ).await?;

  info!("Customer portal update payment method created...");
  Ok(Url::parse(&result.stripe_portal_url)?)
}

async fn do_open_window(
  app: &AppHandle,
  app_data_root: &AppDataRoot,
  url: Url,
) -> AnyhowResult<()> {
  let url = WebviewUrl::External(url);

  info!("Opening checkout window...");

  // TODO(bt,2025-09-01): We probably need to open this in a real browser to get autocomplete.
  let _window = WebviewWindowBuilder::new(app, BILLING_WINDOW_NAME, url)
      .always_on_top(false)
      .title("ArtCraft Billing")
      .center()
      .resizable(true)
      .visible(true)
      .closable(true)
      .min_inner_size(1000.0, 800.0)
      .focused(true)
      .devtools(true)
      .build()?;

  //let _webview = window.get_webview(BILLING_WINDOW_NAME)
  //    .ok_or_else(|| anyhow!("no webview found"))?;

  let app_handle = app.clone();
  let app_data_root = app_data_root.clone();

  let _ = tauri::async_runtime::spawn(async move {
    storyteller_billing_window_thread(app_handle, app_data_root).await;
  });

  Ok(())
}
