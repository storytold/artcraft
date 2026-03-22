use actix_http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse, ResponseError};
use component_traits::traits::internal_user_lookup::InternalUserLookup;
use enums_db::common::payments_namespace::PaymentsNamespace;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::error;
use utoipa::ToSchema;

// =============== Success Response ===============

#[derive(Serialize, ToSchema)]
pub struct ListActiveUserSubscriptionsResponse {
  pub success: bool,
  pub maybe_loyalty_program: Option<String>,
  pub active_subscriptions: Vec<SubscriptionProductKey>,
}

#[derive(Serialize, ToSchema)]
pub struct SubscriptionProductKey {
  /// This should always be "fakeyou".
  pub namespace: PaymentsNamespace,

  /// Possible values: fakeyou_plus, fakeyou_pro, fakeyou_elite, etc.
  pub product_slug: String,
}

// =============== Error Response ===============

#[derive(Debug, Serialize, Eq, PartialEq, Copy, Clone, ToSchema)]
pub enum ListActiveUserSubscriptionsError {
  InvalidSession,
  ServerError,
}

impl ResponseError for ListActiveUserSubscriptionsError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ListActiveUserSubscriptionsError::InvalidSession => StatusCode::UNAUTHORIZED,
      ListActiveUserSubscriptionsError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl std::fmt::Display for ListActiveUserSubscriptionsError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  get,
  tag = "Billing",
  path = "/v1/billing/active_subscriptions",
  responses(
    (status = 200, description = "Success response", body = ListActiveUserSubscriptionsResponse),
    (status = 500, description = "Server error", body = ListActiveUserSubscriptionsError),
  ),
)]
pub async fn list_active_user_subscriptions_handler(
  http_request: HttpRequest,
  internal_user_lookup: web::Data<dyn InternalUserLookup>,
) -> Result<HttpResponse, ListActiveUserSubscriptionsError>
{
  let maybe_user_metadata = internal_user_lookup
      .lookup_user_from_http_request(&http_request)
      .await
      .map_err(|err| {
        error!("Error looking up user: {:?}", err);
        ListActiveUserSubscriptionsError::ServerError // NB: This was probably *our* fault.
      })?;

  // NB: Our integration relies on an internal user token being present.
  let user_metadata = match maybe_user_metadata {
    None => return Err(ListActiveUserSubscriptionsError::InvalidSession),
    Some(user_metadata) => user_metadata,
  };

  let response = ListActiveUserSubscriptionsResponse {
    success: true,
    maybe_loyalty_program: user_metadata.maybe_loyalty_program_key,
    active_subscriptions: user_metadata.existing_subscription_keys
        .into_iter()
        .map(|sub| SubscriptionProductKey {
          namespace: sub.internal_subscription_namespace,
          product_slug: sub.internal_subscription_product_slug,
        })
        .collect(),
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| ListActiveUserSubscriptionsError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}