use actix_web::http::header;
use actix_web::web::Query;
use actix_web::{web, HttpRequest, HttpResponse};
use component_traits::traits::internal_user_lookup::InternalUserLookup;
use server_environment::ServerEnvironment;
use url_config::third_party_url_redirector::ThirdPartyUrlRedirector;
use user_traits_component::traits::internal_session_cache_purge::InternalSessionCachePurge;

use crate::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_error::CreateCheckoutSessionError;
use crate::stripe::http_endpoints::checkout::create::stripe_create_checkout_session_shared::{stripe_create_checkout_session_shared, CreateStripeCheckoutSessionArgs};
use crate::stripe::stripe_config::StripeConfig;
use crate::stripe::traits::internal_product_to_stripe_lookup::InternalProductToStripeLookup;

// =============== Request ===============

#[derive(Deserialize)]
pub struct CreateCheckoutSessionRequest {
  product: Option<String>,

  /// Optional Tolt referral code
  /// See: https://help.tolt.io/en/articles/6843411-how-to-set-up-stripe-with-tolt
  maybe_tolt_referral: Option<String>,
}

pub async fn stripe_create_checkout_session_redirect_handler(
  http_request: HttpRequest,
  request: Query<CreateCheckoutSessionRequest>,
  stripe_config: web::Data<StripeConfig>,
  stripe_client: web::Data<stripe::Client>,
  server_environment: web::Data<ServerEnvironment>,
  url_redirector: web::Data<ThirdPartyUrlRedirector>,
  internal_product_to_stripe_lookup: web::Data<dyn InternalProductToStripeLookup>,
  internal_user_lookup: web::Data<dyn InternalUserLookup>,
  internal_session_cache_purge: web::Data<dyn InternalSessionCachePurge>,
) -> Result<HttpResponse, CreateCheckoutSessionError>
{
  let maybe_internal_product_key = request.product.as_deref();

  let url = stripe_create_checkout_session_shared(CreateStripeCheckoutSessionArgs {
    maybe_internal_product_key,
    http_request: &http_request,
    stripe_config: &stripe_config,
    server_environment: *server_environment.get_ref(),
    stripe_client: &stripe_client,
    url_redirector: &url_redirector,
    internal_product_to_stripe_lookup: internal_product_to_stripe_lookup.get_ref(),
    internal_user_lookup: internal_user_lookup.get_ref(),
    maybe_tolt_referral: request.maybe_tolt_referral.as_deref()
  }).await?;

  // Best effort to delete Redis session cache
  internal_session_cache_purge.best_effort_purge_session_cache(&http_request);

  Ok(HttpResponse::Found()
      .append_header((header::LOCATION, url))
      .finish())
}
