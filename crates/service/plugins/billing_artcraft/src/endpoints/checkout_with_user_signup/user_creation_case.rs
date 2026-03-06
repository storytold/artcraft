use crate::configs::stripe_artcraft_metadata_keys::{STRIPE_ARTCRAFT_METADATA_EMAIL, STRIPE_ARTCRAFT_METADATA_USERNAME, STRIPE_ARTCRAFT_METADATA_USER_TOKEN};
use crate::endpoints::checkout_with_user_signup::creation_payload::{CreationPayload, UserMetadata};
use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::common_web_error::CommonWebError;
use crate::utils::create_checkout::create_subscription_checkout_session::{create_subscription_checkout_session, CreateSubscriptionCheckoutSessionArgs};
use actix_artcraft::requests::get_request_signup_source_enum::get_request_signup_source_enum;
use actix_web::HttpRequest;
use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use enums::by_table::users::user_signup_source::UserSignupSource;
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, info, warn};
use mysql_queries::queries::users::user::create::create_account_error::CreateAccountError;
use mysql_queries::queries::users::user::create::create_account_from_google_sso::{create_account_from_google_sso, CreateAccountFromGoogleSsoArgs};
use mysql_queries::queries::users::user::create::create_account_from_stripe_checkout::{create_account_from_stripe_checkout, CreateAccountFromStripeCheckoutArgs};
use mysql_queries::queries::users::user_sessions::create_user_session_with_transactor::create_user_session_with_transactor;
use mysql_queries::utils::transactor::Transactor;
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql};
use std::collections::HashMap;
use stripe_checkout::checkout_session::{CreateCheckoutSession, CreateCheckoutSessionAutomaticTax, CreateCheckoutSessionLineItems, CreateCheckoutSessionSavedPaymentMethodOptions, CreateCheckoutSessionSavedPaymentMethodOptionsAllowRedisplayFilters, CreateCheckoutSessionSavedPaymentMethodOptionsPaymentMethodSave, CreateCheckoutSessionSubscriptionData};
use stripe_shared::{CheckoutSession, CheckoutSessionMode, PriceId};
use users::email::email_to_gravatar_hash::email_to_gravatar_hash;
use users::email::generate_random_synthetic_email::generate_random_synthetic_email;
use users::username::generate_random_username::generate_random_username;

pub (super) async fn user_creation_case(
  http_request: &HttpRequest,
  price_id: &PriceId,
  mysql_connection: &mut PoolConnection<MySql>,
  stripe_config: &ArtcraftStripeConfigWithClient,
  maybe_referral_url: Option<String>,
) -> Result<CreationPayload, CommonWebError> {

  let mut transaction = mysql_connection.begin()
      .await
      .map_err(|e| {
        warn!("Could not begin transaction: {:?}", e);
        CommonWebError::ServerError
      })?;

  let ip_address = get_request_ip(&http_request);

  let maybe_source = get_request_signup_source_enum(&http_request);

  // NB: Adjust the signup source to the Stripe onboarding equivalent.
  let maybe_source = match maybe_source {
    Some(UserSignupSource::ArtCraftAiWeb) => Some(UserSignupSource::ArtCraftAiStripe),
    Some(UserSignupSource::ArtCraftGetWeb) => Some(UserSignupSource::ArtCraftGetStripe),
    _ => maybe_source,
  };

  // NB: Not sure if these lock important functionality, so we're keeping this
  let user_feature_flags = vec![
    UserFeatureFlag::Studio,
    UserFeatureFlag::VideoStyleTransfer,
  ].into_iter()
      .map(|flag| flag.to_string())
      .collect::<Vec<String>>()
      .join(",");

  let mut final_user_token = None;
  let mut final_username = None;
  let mut final_display_name = None;
  let mut final_email_address = None;

  for _ in 0..3 {
    // NB: We try a few times to make sure we don't hit an email/username collision.

    let user_email_address = generate_random_synthetic_email();
    let user_email_gravatar_hash = email_to_gravatar_hash(&user_email_address);
    
    let display_name = generate_random_username();
    let username = display_name.trim().to_lowercase();

    info!("generated username: {} ; generated email: {}", username, user_email_address);

    let result = create_account_from_stripe_checkout(
      CreateAccountFromStripeCheckoutArgs {
        username: &username,
        display_name: &display_name,
        email_address: &user_email_address,
        email_gravatar_hash: &user_email_gravatar_hash,
        maybe_feature_flags: Some(&user_feature_flags),
        ip_address: &ip_address,
        maybe_source,
        maybe_referral_url: maybe_referral_url.clone(),
      },
      Transactor::for_transaction(&mut transaction),
    ).await;

    match result {
      Ok(token) => {
        final_user_token = Some(token);
        final_username = Some(username);
        final_display_name = Some(display_name);
        final_email_address = Some(user_email_address);
        break;
      },
      Err(CreateAccountError::UsernameIsTaken) => {
        continue; // NB: We'll try again with a new username.
      },
      Err(err) => {
        warn!("error creating account from google sso: {:?}", err);
        return Err(CommonWebError::ServerError);
      },
    }
  }

  let final_user_token = final_user_token.ok_or_else(|| {
    error!("Could not generate user token after several attempts");
    CommonWebError::ServerError
  })?;

  let final_username = final_username.ok_or_else(|| {
    error!("Could not generate username after several attempts");
    CommonWebError::ServerError
  })?;

  let final_display_name = final_display_name.ok_or_else(|| {
    error!("Could not generate display name after several attempts");
    CommonWebError::ServerError
  })?;

  let final_email_address = final_email_address.ok_or_else(|| {
    error!("Could not generate email address after several attempts");
    CommonWebError::ServerError
  })?;

  transaction.commit()
      .await
      .map_err(|e| {
        warn!("Could not commit transaction: {:?}", e);
        CommonWebError::ServerError
      })?;

  let session_token = create_user_session_with_transactor(
    &final_user_token,
    &ip_address,
    Transactor::for_connection(mysql_connection))
      .await
      .map_err(|e| {
        warn!("error creating user session: {:?}", e);
        CommonWebError::ServerError
      })?;

  let checkout_session = create_subscription_checkout_session(CreateSubscriptionCheckoutSessionArgs {
    subscription_price_id: price_id,
    maybe_existing_stripe_customer_id: None,
    user_token: &final_user_token,
    username: None,
    user_email: None,
    stripe_client: &stripe_config.client,
    success_url: &stripe_config.checkout_success_url,
    cancel_url: &stripe_config.checkout_cancel_url,
  }).await?;

  Ok(CreationPayload {
    checkout_session,
    maybe_new_user_metadata: Some(UserMetadata {
      user_token: final_user_token,
      session_token,
      username: final_username,
      display_name: final_display_name,
      email_address: final_email_address,
    })
  })
}
