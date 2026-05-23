use std::collections::HashSet;

use actix_web::HttpRequest;
use anyhow::anyhow;
use errors::AnyhowResult;
use once_cell::sync::Lazy;

use http_server_common::request::get_request_ip::get_request_ip;
use server_environment::ServerEnvironment;

/// List of IP addresses that send webhook requests
/// From: https://stripe.com/docs/ips
static STRIPE_WEBHOOK_IP_ADDRESSES : Lazy<HashSet<String>> = Lazy::new(|| {
  let mut ip_addresses = HashSet::new();

  ip_addresses.extend([
    "3.18.12.63",
    "3.130.192.231",
    "13.235.14.237",
    "13.235.122.149",
    "18.211.135.69",
    "35.154.171.200",
    "52.15.183.38",
    "54.88.130.119",
    "54.88.130.237",
    "54.187.174.169",
    "54.187.205.235",
    "54.187.216.72",
  ].map(|s| s.to_string()));

  ip_addresses
});

/// Verify that the request comes from a Stripe webhook client IP
/// Recommendation from: https://stripe.com/docs/webhooks/best-practices
pub fn verify_stripe_webhook_ip_address(http_request: &HttpRequest, server_environment: ServerEnvironment) -> AnyhowResult<()> {
  let ip_address = get_request_ip(http_request);

  if STRIPE_WEBHOOK_IP_ADDRESSES.contains(&ip_address) {
    return Ok(());
  }

  let is_development = server_environment == ServerEnvironment::Development;
  let is_localhost = ip_address == "127.0.0.1";

  if is_development && is_localhost {
    return Ok(());
  }

  Err(anyhow!("Not a valid Stripe webhook IP address: {:?}", &ip_address))
}