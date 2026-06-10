use billing_component::stripe::stripe_config::{
  FullUrlOrPath, StripeCheckoutConfigs, StripeConfig,
  StripeCustomerPortalConfigs, StripeSecrets,
};
use errors::AnyhowResult;

use crate::state::server_state::StripeSettings;

pub fn setup_stripe_fakeyou() -> AnyhowResult<StripeSettings> {
  let stripe_configs = StripeConfig {
    checkout: StripeCheckoutConfigs {
      success_url: FullUrlOrPath::Path(easyenv::get_env_string_required("STRIPE_CHECKOUT_SUCCESS_URL_PATH")?),
      cancel_url: FullUrlOrPath::Path(easyenv::get_env_string_required("STRIPE_CHECKOUT_CANCEL_URL_PATH")?),
    },
    portal: StripeCustomerPortalConfigs {
      return_url: FullUrlOrPath::Path(easyenv::get_env_string_required("STRIPE_PORTAL_RETURN_URL_PATH")?),
      default_portal_config_id: easyenv::get_env_string_required("STRIPE_PORTAL_DEFAULT_CONFIG_ID")?,
    },
    secrets: StripeSecrets {
      publishable_key: easyenv::get_env_string_optional("STRIPE_PUBLISHABLE_KEY"),
      secret_key: easyenv::get_env_string_required("STRIPE_SECRET_KEY")?,
      secret_webhook_signing_key: easyenv::get_env_string_required("STRIPE_SECRET_WEBHOOK_SIGNING_KEY")?,
    },
  };

  let stripe_client = {
    let api_secret = stripe_configs.secrets.secret_key.clone();
    stripe::Client::new(api_secret)
  };

  Ok(StripeSettings {
    config: stripe_configs,
    client: stripe_client,
    stripe_account_id: easyenv::get_env_string_required("STRIPE_FAKEYOU_ACCOUNT_ID")?,
  })
}
