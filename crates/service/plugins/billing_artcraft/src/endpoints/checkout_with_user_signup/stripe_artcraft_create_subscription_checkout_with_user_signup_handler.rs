use crate::configs::stripe_artcraft_metadata_keys::{STRIPE_ARTCRAFT_METADATA_EMAIL, STRIPE_ARTCRAFT_METADATA_USERNAME, STRIPE_ARTCRAFT_METADATA_USER_TOKEN};
use crate::configs::subscriptions::get_artcraft_subscription_by_slug_and_env::get_artcraft_subscription_by_slug_and_env;
use crate::endpoints::checkout_with_user_signup::creation_payload::{CreationPayload, UserMetadata};
use crate::endpoints::checkout_with_user_signup::user_creation_case::user_creation_case;
use crate::endpoints::checkout_with_user_signup::user_exists_case::user_exists_case;
use crate::utils::artcraft_stripe_config::ArtcraftStripeConfigWithClient;
use crate::utils::common_web_error::CommonWebError;
use actix_artcraft::sessions::http_user_session_manager::HttpUserSessionManager;
use actix_web::web::{Data, Json};
use actix_web::{web, HttpRequest, HttpResponse};
use artcraft_api_defs::stripe_artcraft::create_create_new_user_account_and_subscription_checkout::{PlanBillingCadence, SessionDetails, StripeArtcraftCreateSubscriptionCheckoutWithUserSignupRequest, StripeArtcraftCreateSubscriptionCheckoutWithUserSignupResponse, UserDetails};
use component_traits::traits::internal_user_lookup::InternalUserLookup;
use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use enums::common::payments_namespace::PaymentsNamespace;
use http_headers::values::content_type::CONTENT_TYPE_APPLICATION_JSON;
use log::{error, info, warn};
use mysql_queries::queries::users::user_stripe_customer_links::find_user_stripe_customer_link::find_user_stripe_customer_link_using_connection;
use mysql_queries::queries::users::user_subscriptions::find_possibly_inactive_first_subscription_for_owner_user::find_possibly_inactive_first_subscription_for_owner_user_using_connection;
use mysql_queries::queries::users::user_subscriptions::find_subscription_for_owner_user::find_subscription_for_owner_user_using_connection;
use reusable_types::server_environment::ServerEnvironment;
use sqlx::MySqlPool;
use std::collections::HashMap;
use std::str::FromStr;
use std::sync::Arc;
use stripe_checkout::checkout_session::{CreateCheckoutSession, CreateCheckoutSessionAutomaticTax, CreateCheckoutSessionLineItems, CreateCheckoutSessionSavedPaymentMethodOptions, CreateCheckoutSessionSavedPaymentMethodOptionsAllowRedisplayFilters, CreateCheckoutSessionSavedPaymentMethodOptionsPaymentMethodSave, CreateCheckoutSessionSubscriptionData};
use stripe_checkout::CheckoutSessionMode;
use stripe_core::CustomerId;
use stripe_shared::{CheckoutSession, PriceId};
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;

// /// Create a new user account and Stripe Checkout session and return the redirect URL in Json.
// #[utoipa::path(
//   get,
//   tag = "Stripe (Artcraft)",
//   path = "/v1/stripe_artcraft/user_signup_subscription_checkout",
//   params(
//     ("request" = CreateCheckoutSessionRequest, description = "Payload for Request"),
//   ),
//   responses(
//     (status = 200, description = "Success Delete", body = CreateCheckoutSessionSuccessResponse),
//   ),
// )]

/// Create a Stripe Checkout session *with* user signup and return the redirect URL in Json.
/// If the user is already logged in, we just attach it to that record instead.
pub async fn stripe_artcraft_create_subscription_checkout_with_user_signup_handler(
  http_request: HttpRequest,
  request: Json<StripeArtcraftCreateSubscriptionCheckoutWithUserSignupRequest>,
  stripe_config: Data<ArtcraftStripeConfigWithClient>,
  server_environment: Data<ServerEnvironment>,
  session_cookie_manager: web::Data<HttpUserSessionManager>,
  internal_user_lookup: Data<dyn InternalUserLookup>,
  internal_session_cache_purge: Data<dyn InternalSessionCachePurge>,
  mysql_pool: Data<MySqlPool>,
) -> Result<HttpResponse, CommonWebError>
{
  let slug = match request.plan {
    None => return Err(CommonWebError::BadInputWithSimpleMessage("no plan supplied".to_string())),
    Some(slug) => slug,
  };

  let cadence = match request.cadence {
    None => return Err(CommonWebError::BadInputWithSimpleMessage("no cadence supplied".to_string())),
    Some(cadence) => cadence,
  };

  let plan = get_artcraft_subscription_by_slug_and_env(slug, **server_environment);

  let mut mysql_connection = mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        error!("Could not acquire mysql connection: {:?}", err);
        CommonWebError::ServerError
      })?;

  let price_id = match cadence {
    PlanBillingCadence::Monthly => plan.monthly_price_id.clone(),
    PlanBillingCadence::Yearly => plan.yearly_price_id.clone(),
  };

  let price_id = PriceId::from_str(&price_id)
      .map_err(|err| {
        error!("Error parsing price id: {:?}", err);
        CommonWebError::ServerError
      })?;

  let maybe_referral_url = request.maybe_referral_url.clone()
    .or_else(|| {
      http_request.headers().get("referer")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
    })
    .filter(|s| !s.is_empty())
    .map(|s| s.chars().take(255).collect::<String>());

  let maybe_user_metadata = internal_user_lookup
      .lookup_user_from_http_request_and_mysql_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|err| {
        error!("Error looking up user: {:?}", err);
        CommonWebError::ServerError // NB: This was probably *our* fault.
      })?;

  let creation_payload= match maybe_user_metadata {
    None => {
      info!("Creating new user, then creating checkout session...");
      user_creation_case(
        &http_request,
        &price_id,
        &mut mysql_connection,
        &stripe_config,
        maybe_referral_url,
      ).await?
    },
    Some(user_metadata) => {
      info!("Creating checkout session for user: {:?}", user_metadata.user_token_typed);
      user_exists_case(
        &price_id,
        &user_metadata,
        &mut mysql_connection,
        &stripe_config,
      ).await?
    },
  };

  // Best effort to delete Redis session cache
  internal_session_cache_purge.best_effort_purge_session_cache(&http_request);

  match creation_payload.maybe_new_user_metadata {
    None => {
      info!("delevering response for existing user...");
      create_http_response_existing_user(creation_payload.checkout_session)
    }
    Some(user_metadata) => {
      info!("delevering response for new user...");
      create_http_response_new_user(&session_cookie_manager, creation_payload.checkout_session, user_metadata)
    }
  }
}

pub fn create_http_response_existing_user(
  checkout_session: CheckoutSession,
) -> Result<HttpResponse, CommonWebError> {
  let url = checkout_session.url.ok_or(CommonWebError::ServerError)?;

  let response = StripeArtcraftCreateSubscriptionCheckoutWithUserSignupResponse {
    success: true,
    stripe_checkout_redirect_url: url,
    generated_user: None,
    session: None,
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| CommonWebError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type(CONTENT_TYPE_APPLICATION_JSON)
      .body(body))
}

pub fn create_http_response_new_user(
  session_cookie_manager: &HttpUserSessionManager,
  checkout_session: CheckoutSession,
  user_metadata: UserMetadata,
) -> Result<HttpResponse, CommonWebError> {
  
  let session_cookie = match session_cookie_manager.create_cookie(&user_metadata.session_token, &user_metadata.user_token) {
    Ok(cookie) => cookie,
    Err(err) => {
      error!("Error creating session cookie: {:?}", err);
      return Err(CommonWebError::ServerError)
    },
  };

  let signed_session = match session_cookie_manager.encode_session_payload(&user_metadata.session_token, &user_metadata.user_token) {
    Ok(payload) => payload,
    Err(err) => {
      error!("Error encoding session payload: {:?}", err);
      return Err(CommonWebError::ServerError)
    },
  };

  let url = checkout_session.url.ok_or(CommonWebError::ServerError)?;

  let response = StripeArtcraftCreateSubscriptionCheckoutWithUserSignupResponse {
    success: true,
    stripe_checkout_redirect_url: url,
    generated_user: Some(UserDetails {
      username: user_metadata.username,
      display_name: user_metadata.display_name,
    }),
    session: Some(SessionDetails {
      signed_session,
    }),
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| CommonWebError::ServerError)?;

  Ok(HttpResponse::Ok()
      .cookie(session_cookie)
      .content_type(CONTENT_TYPE_APPLICATION_JSON)
      .body(body))
}
