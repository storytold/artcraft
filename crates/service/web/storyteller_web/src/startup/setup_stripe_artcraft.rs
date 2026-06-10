use billing_artcraft_component::utils::artcraft_stripe_config::{
  ArtcraftStripeConfig, ArtcraftStripeConfigWithClient,
};
use errors::AnyhowResult;

pub fn setup_stripe_artcraft() -> AnyhowResult<ArtcraftStripeConfigWithClient> {
  Ok(ArtcraftStripeConfig {
    stripe_account_id: easyenv::get_env_string_required("STRIPE_ARTCRAFT_ACCOUNT_ID")?,
    secret_key: easyenv::get_env_string_required("STRIPE_ARTCRAFT_SECRET_KEY")?,
    secret_webhook_signing_key: easyenv::get_env_string_required("STRIPE_ARTCRAFT_SECRET_WEBHOOK_KEY")?,
    checkout_success_url: easyenv::get_env_string_required("STRIPE_ARTCRAFT_CHECKOUT_SUCCESS_URL")?,
    checkout_cancel_url: easyenv::get_env_string_required("STRIPE_ARTCRAFT_CHECKOUT_CANCEL_URL")?,
    portal_return_url: easyenv::get_env_string_required("STRIPE_ARTCRAFT_PORTAL_RETURN_URL")?,
  }.to_config_with_client())
}
