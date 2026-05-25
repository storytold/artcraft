use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use component_traits::traits::internal_user_lookup::InternalUserLookup;
use enums::common::payments_namespace::PaymentsNamespace;
use log::warn;
use utoipa::ToSchema;

use crate::http_server::common_responses::common_web_error::CommonWebError;

// =============== Response ===============

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

#[utoipa::path(
  get,
  tag = "Billing",
  path = "/v1/billing/active_subscriptions",
  responses(
    (status = 200, description = "Success response", body = ListActiveUserSubscriptionsResponse),
    (status = 401, description = "Not authorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn list_active_user_subscriptions_handler(
  http_request: HttpRequest,
  internal_user_lookup: web::Data<dyn InternalUserLookup>,
) -> Result<Json<ListActiveUserSubscriptionsResponse>, CommonWebError> {
  let maybe_user_metadata = internal_user_lookup
    .lookup_user_from_http_request(&http_request)
    .await
    .map_err(|err| {
      warn!("Error looking up user: {:?}", err);
      CommonWebError::from_error(err)
    })?;

  let user_metadata = match maybe_user_metadata {
    None => return Err(CommonWebError::NotAuthorized),
    Some(user_metadata) => user_metadata,
  };

  Ok(Json(ListActiveUserSubscriptionsResponse {
    success: true,
    maybe_loyalty_program: user_metadata.maybe_loyalty_program_key,
    active_subscriptions: user_metadata.existing_subscription_keys
      .into_iter()
      .map(|sub| SubscriptionProductKey {
        namespace: sub.internal_subscription_namespace,
        product_slug: sub.internal_subscription_product_slug,
      })
      .collect(),
  }))
}
