use std::sync::Arc;

use actix_web::{web, HttpRequest, HttpResponse};
use log::{info, warn};
use url::Url;

use artcraft_api_defs::web_referrals::log_web_referral::{LogWebReferralRequest, LogWebReferralResponse};
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::web_referrals::insert_web_referral::{insert_web_referral, InsertWebReferralArgs};
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

/// Record a web referral for analytics tracking.
#[utoipa::path(
  post,
  tag = "Web Referrals",
  path = "/v1/web_referrals/record",
  responses(
    (status = 200, description = "Success", body = LogWebReferralResponse),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn log_web_referral_handler(
  http_request: HttpRequest,
  request: web::Json<LogWebReferralRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<HttpResponse, CommonWebError> {

  // 1. Try to get the referral URL from the request body, falling back to the Referer header.
  let referral_url = request.maybe_referral_url.as_deref()
    .map(|s| s.trim())
    .filter(|s| !s.is_empty())
    .map(|s| s.to_string())
    .or_else(|| {
      http_request.headers().get("referer")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
    })
    .filter(|s| !s.is_empty());

  // 2. If no URL from either source, early exit 200 OK.
  let referral_url = match referral_url {
    Some(url) => url,
    None => {
      return ok_response();
    }
  };

  // 3. Parse the URL (infallible — we don't fail on bad URLs).
  //    NB: Parse before truncating so we don't lose UTM params.
  let parsed = Url::parse(&referral_url).ok();

  // Truncate the URL to 255 characters for storage.
  let referral_url: String = referral_url.chars().take(255).collect();

  // 4. Extract domain if URL parsed.
  let maybe_domain = parsed.as_ref()
    .and_then(|u| u.host_str())
    .map(|s| s.to_string());

  // 5. Extract UTM parameters if URL parsed.
  let utm_source = extract_query_param(parsed.as_ref(), "utm_source");
  let utm_medium = extract_query_param(parsed.as_ref(), "utm_medium");
  let utm_campaign = extract_query_param(parsed.as_ref(), "utm_campaign");

  // 6. Grab the request IP address.
  let ip_address = get_request_ip(&http_request);

  // 7. Check inbound cookies for AVT. If not present, mint a new one.
  let existing_avt_token = server_state
    .avt_cookie_manager
    .get_avt_token_from_request(&http_request);

  let (avt_token, maybe_new_avt_cookie) = match existing_avt_token {
    Some(token) => (token, None),
    None => {
      let token = AnonymousVisitorTrackingToken::generate();
      let cookie = server_state
        .avt_cookie_manager
        .make_new_cookie_with_apriori_token(&token)
        .map_err(|e| {
          warn!("AVT cookie creation error: {:?}", e);
          CommonWebError::ServerError
        })?;
      (token, Some(cookie))
    }
  };

  let avt_token_str = avt_token.to_string();

  // Truncate UTM fields to fit the schema.
  let utm_source = utm_source.map(|s| s.chars().take(150).collect::<String>());
  let utm_medium = utm_medium.map(|s| s.chars().take(150).collect::<String>());
  let utm_campaign = utm_campaign.map(|s| s.chars().take(150).collect::<String>());

  // Insert into the database.
  insert_web_referral(&server_state.mysql_pool, InsertWebReferralArgs {
    url: &referral_url,
    maybe_domain: maybe_domain.as_deref(),
    utm_source: utm_source.as_deref(),
    utm_medium: utm_medium.as_deref(),
    utm_campaign: utm_campaign.as_deref(),
    ip_address: &ip_address,
    maybe_anonymous_visitor_token: Some(&avt_token_str),
  }).await.map_err(|e| {
    warn!("Error inserting web referral: {:?}", e);
    CommonWebError::ServerError
  })?;

  info!("Recorded web referral: {}", referral_url);

  // Build response, setting the AVT cookie if we minted a new one.
  let response = LogWebReferralResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
    .map_err(|_| CommonWebError::ServerError)?;

  let mut response_builder = HttpResponse::Ok();

  if let Some(cookie) = maybe_new_avt_cookie {
    response_builder.cookie(cookie);
  }

  Ok(response_builder
    .content_type("application/json")
    .body(body))
}

fn ok_response() -> Result<HttpResponse, CommonWebError> {
  let response = LogWebReferralResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
    .map_err(|_| CommonWebError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}

fn extract_query_param(parsed: Option<&Url>, key: &str) -> Option<String> {
  parsed.and_then(|u| {
    u.query_pairs()
      .find(|(k, _)| k == key)
      .map(|(_, v)| v.to_string())
  })
}
