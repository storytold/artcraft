use std::collections::HashMap;
use std::str::FromStr;

use actix_web::HttpRequest;
use component_traits::traits::internal_user_lookup::InternalUserLookup;
use log::{error, warn};
use server_environment::ServerEnvironment;
use stripe::{CheckoutSession, CheckoutSessionMode, CreateCheckoutSession, CreateCheckoutSessionAutomaticTax, CreateCheckoutSessionLineItems, CreateCheckoutSessionPaymentIntentData, CreateCheckoutSessionSubscriptionData, CustomerId};
use url_config::third_party_url_redirector::ThirdPartyUrlRedirector;

use crate::stripe::helpers::common_metadata_keys::{METADATA_EMAIL, METADATA_TOLT_REFERRAL, METADATA_USERNAME, METADATA_USER_TOKEN};
use crate::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_error::CreateCheckoutSessionError;
use crate::stripe::stripe_config::{FullUrlOrPath, StripeConfig};
use crate::stripe::traits::internal_product_to_stripe_lookup::InternalProductToStripeLookup;

pub struct CreateStripeCheckoutSessionArgs<'a> {
  pub maybe_internal_product_key: Option<&'a str>,
  pub http_request: &'a HttpRequest,
  pub stripe_config: &'a StripeConfig,
  pub server_environment: ServerEnvironment,
  pub stripe_client: &'a stripe::Client,
  pub url_redirector: &'a ThirdPartyUrlRedirector,
  pub internal_product_to_stripe_lookup: &'a dyn InternalProductToStripeLookup,
  pub internal_user_lookup: &'a dyn InternalUserLookup,

  /// Optional Tolt referral code
  /// See: https://help.tolt.io/en/articles/6843411-how-to-set-up-stripe-with-tolt
  pub maybe_tolt_referral: Option<&'a str>,
}

/// Create a checkout session and return the URL
/// If anything fails, treat it as a 500 server error.
pub async fn stripe_create_checkout_session_shared(
  args: CreateStripeCheckoutSessionArgs<'_>,

) -> Result<String, CreateCheckoutSessionError> {
  let internal_product_key = match args.maybe_internal_product_key {
    None => return Err(CreateCheckoutSessionError::BadRequest { reason: "no product key supplied".to_string() }),
    Some(internal_product_key) => internal_product_key,
  };

  let stripe_product = args.internal_product_to_stripe_lookup
      .lookup_stripe_product_from_internal_product_key(args.server_environment, internal_product_key)
      .map_err(|err| {
        error!("Error looking up product: {:?}", err);
        CreateCheckoutSessionError::ServerError // NB: This was probably *our* fault.
      })?
      .ok_or(CreateCheckoutSessionError::PlanNotFound)?; // Non-existing product

  let maybe_user_metadata = args.internal_user_lookup
      .lookup_user_from_http_request(args.http_request)
      .await
      .map_err(|err| {
        error!("Error looking up user: {:?}", err);
        CreateCheckoutSessionError::ServerError // NB: This was probably *our* fault.
      })?;

  // NB: Our integration relies on an internal user token being present.
  let user_metadata = match maybe_user_metadata {
    None => return Err(CreateCheckoutSessionError::InvalidSession),
    Some(user_metadata) => user_metadata,
  };

  error!("Subscriptions: {:?}", &user_metadata.existing_subscription_keys);

  // TODO: This will not handle a future where we have multiple "namespaces" or can offer users more than one subscription.
  //  It will actively block users from subscribing to two or more websites.
  if !user_metadata.existing_subscription_keys.is_empty() {
    return Err(CreateCheckoutSessionError::UserAlreadyHasPlan)
  }

  let success_url = match &args.stripe_config.checkout.success_url {
    FullUrlOrPath::FullUrl(url) => url.to_string(),
    FullUrlOrPath::Path(path) => args.url_redirector.frontend_redirect_url_for_path(args.http_request, &path)
        .map_err(|_e| CreateCheckoutSessionError::ServerError)?,
  };

  let cancel_url = match &args.stripe_config.checkout.cancel_url {
    FullUrlOrPath::FullUrl(url) => url.to_string(),
    FullUrlOrPath::Path(path) => args.url_redirector.frontend_redirect_url_for_path(args.http_request, &path)
        .map_err(|_e| CreateCheckoutSessionError::ServerError)?,
  };

  let checkout_session = {
    let mut params = CreateCheckoutSession::new(&success_url);
    params.cancel_url = Some(&cancel_url);

    // `client_reference_id`
    // Stripe Docs:
    //   A unique string to reference the Checkout Session.
    //   This can be a customer ID, a cart ID, or similar, and can be used to reconcile the session
    //   with your internal systems.
    //
    // Our Notes:
    //   This gets reported back in the Checkout Session (and related webhooks) as
    //   `client_reference_id`. Passing the same ID on multiple checkouts does not unify or
    //   cross-correlate customers and only seems to be metadata for the checkout session itself.
    //   This is probably only useful for tracking checkout session engagement.
    //params.client_reference_id = Some("SOME_INTERNAL_ID");

    // `customer_email`
    // Stripe Docs:
    //   If provided, this value will be used when the Customer object is created. If not provided,
    //   customers will be asked to enter their email address. Use this parameter to prefill
    //   customer data if you already have an email on file. To access information about the
    //   customer once a session is complete, use the customer field.
    //
    // Our Notes:
    //   This does not look up previous customers with the same email and will not unify or
    //   cross-correlate customers. By default the field will be un-editable in the checkout flow
    //   if this is specified.
    //params.customer_email = Some("email@example.com");

    let mut metadata = HashMap::new();

    metadata.insert(METADATA_USER_TOKEN.to_string(), user_metadata.user_token.to_string());

    if let Some(username) = user_metadata.username.as_deref() {
      metadata.insert(METADATA_USERNAME.to_string(), username.to_string());
    }

    if let Some(user_email) = user_metadata.user_email.as_deref() {
      metadata.insert(METADATA_EMAIL.to_string(), user_email.to_string());
    }

    if let Some(tolt_referral) = args.maybe_tolt_referral.as_deref() {
      metadata.insert(METADATA_TOLT_REFERRAL.to_string(), tolt_referral.to_string());
    }

    // NB: This metadata attaches to Stripe's Checkout Session object.
    // This does not attach to the subscription or payment intent, which have their own metadata
    // objects. (TODO: Confirm this.)
    params.metadata = Some(metadata.clone());

    if stripe_product.is_subscription_product {
      // Subscription mode: Use Stripe Billing to set up fixed-price subscriptions.
      params.mode = Some(CheckoutSessionMode::Subscription);

      // NB: This metadata attaches to the subscription entity itself.
      // This cannot be used for non-subscription, one-off payments.
      // https://support.stripe.com/questions/using-metadata-with-checkout-sessions
      params.subscription_data = Some(CreateCheckoutSessionSubscriptionData {
       metadata: Some(metadata),
        ..Default::default()
      });

    } else {
      // Payment mode: Accept one-time payments for cards, iDEAL, and more.
      params.mode = Some(CheckoutSessionMode::Payment);

      // NB: This metadata attaches to the payment_intent entity itself.
      // This cannot be used for subscriptions.
      // https://support.stripe.com/questions/using-metadata-with-checkout-sessions
      params.payment_intent_data = Some(CreateCheckoutSessionPaymentIntentData {
        metadata: Some(metadata.clone()),
        ..Default::default()
      });
    }

    params.automatic_tax = Some(CreateCheckoutSessionAutomaticTax { enabled: true });

    params.line_items = Some(vec![
      CreateCheckoutSessionLineItems {
        price: Some(stripe_product.stripe_price_id.to_string()),
        quantity: Some(1),
        ..Default::default()
      }
    ]);

    // If we already have a Stripe customer associated with the user account, we'll reuse it.
    if let Some(existing_stripe_customer_id) = user_metadata.maybe_existing_stripe_customer_id.as_deref() {
      match CustomerId::from_str(existing_stripe_customer_id) {
        Ok(customer_id) => {
          params.customer = Some(customer_id);
        }
        Err(err) => {
          // NB: Don't block checkout.
          warn!("Error parsing user's ({}) supposed existing stripe customer id: {:?}",
            &user_metadata.user_token,
            err);
        }
      }
    }

    CheckoutSession::create(&args.stripe_client, params)
        .await
        .map_err(|e| {
          error!("Error: {:?}", e);
          CreateCheckoutSessionError::StripeError
        })?
  };

  checkout_session.url.ok_or(CreateCheckoutSessionError::ServerError)
}

/*
#[cfg(test)]
mod tests {
  use mockall::predicate::*;
  use tokio;
  use component_traits::traits::internal_user_lookup::{MockInternalUserLookup, UserMetadata};
  use server_environment::ServerEnvironment;
  use url_config::third_party_url_redirector::ThirdPartyUrlRedirector;

  use crate::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_error::CreateCheckoutSessionError;
  use crate::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_shared::{stripe_create_checkout_session_shared, CreateStripeCheckoutSessionArgs};
  use crate::stripe::stripe_config::{FullUrlOrPath, StripeCheckoutConfigs, StripeConfig, StripeCustomerPortalConfigs, StripeSecrets};
  use crate::stripe::traits::internal_product_to_stripe_lookup::{MockInternalProductToStripeLookup, StripeProduct};

  #[tokio::test]
  async fn test_success_case() {
    let http_request = actix_web::test::TestRequest::default()
        .insert_header(actix_web::http::header::ContentType::json())
        .to_http_request();

    let maybe_internal_product_key = Some("TEST_FAKEYOU_PRODUCT");

    let stripe_config = StripeConfig {
      checkout: StripeCheckoutConfigs {
        success_url: FullUrlOrPath::FullUrl("http://example.com/success".to_string()),
        cancel_url: FullUrlOrPath::FullUrl("http://example.com/cancel".to_string()),
      },
      portal: StripeCustomerPortalConfigs {
        return_url: FullUrlOrPath::Path("/N/A".to_string()),
        default_portal_config_id: "N/A".to_string()
      },
      secrets: StripeSecrets {
        publishable_key: None,
        secret_key: "sk_test_12345".to_string(), // NB: Expected key format
        secret_webhook_signing_key: "fake_test_signing".to_string(),
      }
    };

    let url_redirector = ThirdPartyUrlRedirector::new(ServerEnvironment::Development);

    // TODO: Mock this somehow? We can't really test this library unless we can get inside it.
    //  Note that this might also fail in CI if the client tries to actually talk to Stripe.com.
    let mut stripe_client= stripe::Client::new("sk_test_12345");

    let mut internal_product_to_stripe_lookup_mock = MockInternalProductToStripeLookup::new();

    internal_product_to_stripe_lookup_mock.expect_lookup_stripe_product_from_internal_product_key()
        .with(eq(ServerEnvironment::Development), eq("TEST_FAKEYOU_PRODUCT"))
        .returning(|_, _| Ok(Some(StripeProduct {
          stripe_product_id: "TEST_PRODUCT_ID".to_string(),
          stripe_price_id: "TEST_PRICE_ID".to_string(),
          is_subscription_product: true,
        })));

    let mut internal_user_lookup_mock = MockInternalUserLookup::new();

    internal_user_lookup_mock.expect_lookup_user_from_http_request()
        .returning(|_| Ok(Some(UserMetadata {
          user_token: "U:USER".to_string(),
          username: Some("vegito".to_string()),
          user_email: Some("vegito@fakeyou.com".to_string()),
          maybe_existing_stripe_customer_id: None,
          existing_subscription_keys: vec![],
          maybe_loyalty_program_key: None,
        })));

    let result = stripe_create_checkout_session_shared(CreateStripeCheckoutSessionArgs {
      maybe_internal_product_key,
      http_request: &http_request,
      stripe_config: &stripe_config,
      server_environment: ServerEnvironment::Development,
      stripe_client: &stripe_client,
      url_redirector: &url_redirector,
      internal_product_to_stripe_lookup: &internal_product_to_stripe_lookup_mock,
      internal_user_lookup: &internal_user_lookup_mock,
      maybe_tolt_referral: None,
    }).await;

    // TODO: Sort of throwing my hands up over testing this.
    //  There's no convenient way to test which arguments get sent.
    assert_eq!(result, Err(CreateCheckoutSessionError::StripeError));
  }
}
*/