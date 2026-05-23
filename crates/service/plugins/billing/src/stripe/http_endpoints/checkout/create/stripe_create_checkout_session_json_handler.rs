use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use component_traits::traits::internal_user_lookup::InternalUserLookup;
use server_environment::ServerEnvironment;
use url_config::third_party_url_redirector::ThirdPartyUrlRedirector;
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;
use utoipa::ToSchema;

use crate::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_error::CreateCheckoutSessionError;
use crate::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_shared::{stripe_create_checkout_session_shared, CreateStripeCheckoutSessionArgs};
use crate::stripe::stripe_config::StripeConfig;
use crate::stripe::traits::internal_product_to_stripe_lookup::InternalProductToStripeLookup;

// =============== Request ===============

#[derive(Deserialize, ToSchema)]
pub struct CreateCheckoutSessionRequest {
  /// The (non-Stripe) internal identifier for the product or subscription.
  /// This will be translated into a Stripe identifier.
  internal_plan_key: Option<String>,

  /// Optional Tolt referral code
  /// See: https://help.tolt.io/en/articles/6843411-how-to-set-up-stripe-with-tolt
  maybe_tolt_referral: Option<String>,
}

// =============== Success Response ===============

#[derive(Serialize, ToSchema)]
pub struct CreateCheckoutSessionSuccessResponse {
  pub success: bool,
  pub stripe_checkout_redirect_url: String,
}

/// Create a Stripe Checkout session and return the redirect URL in Json.
#[utoipa::path(
  get,
  tag = "Billing",
  path = "/v1/billing/stripe/checkout/create_redirect",
  params(
    ("request" = CreateCheckoutSessionRequest, description = "Payload for Request"),
  ),
  responses(
    (status = 200, description = "Success Delete", body = CreateCheckoutSessionSuccessResponse),
    (status = 400, description = "Bad input", body = CreateCheckoutSessionError),
    (status = 401, description = "Not authorized", body = CreateCheckoutSessionError),
    (status = 500, description = "Server error", body = CreateCheckoutSessionError),
  ),
)]
pub async fn stripe_create_checkout_session_json_handler(
  http_request: HttpRequest,
  request: Json<CreateCheckoutSessionRequest>,
  stripe_config: web::Data<StripeConfig>,
  stripe_client: web::Data<stripe::Client>,
  server_environment: web::Data<ServerEnvironment>,
  url_redirector: web::Data<ThirdPartyUrlRedirector>,
  internal_product_to_stripe_lookup: web::Data<dyn InternalProductToStripeLookup>,
  internal_user_lookup: web::Data<dyn InternalUserLookup>,
  internal_session_cache_purge: web::Data<dyn InternalSessionCachePurge>,
) -> Result<HttpResponse, CreateCheckoutSessionError>
{
  let maybe_internal_product_key = request.internal_plan_key.as_deref();

  let url = stripe_create_checkout_session_shared(CreateStripeCheckoutSessionArgs {
    maybe_internal_product_key,
    http_request: &http_request,
    stripe_config: &stripe_config,
    server_environment: *server_environment.as_ref(),
    stripe_client: &stripe_client,
    url_redirector: &url_redirector,
    internal_product_to_stripe_lookup: internal_product_to_stripe_lookup.get_ref(),
    internal_user_lookup: internal_user_lookup.get_ref(),
    maybe_tolt_referral: request.maybe_tolt_referral.as_deref()
  }).await?;

  // Best effort to delete Redis session cache
  internal_session_cache_purge.best_effort_purge_session_cache(&http_request);

  let response = CreateCheckoutSessionSuccessResponse {
    success: true,
    stripe_checkout_redirect_url: url,
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| CreateCheckoutSessionError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
