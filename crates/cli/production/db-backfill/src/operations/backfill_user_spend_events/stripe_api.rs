use std::collections::HashMap;
use std::time::Duration;

use anyhow::anyhow;
use errors::AnyhowResult;
use reqwest::Client;
use serde::de::DeserializeOwned;
use serde_derive::Deserialize;

const STRIPE_API_BASE: &str = "https://api.stripe.com/v1";
const PAGE_LIMIT: &str = "100";
const MAX_ERROR_BODY_CHARS: usize = 400;

/// Minimal Stripe REST client for the backfill.
///
/// It deliberately does NOT use the typed `async-stripe` SDK: that SDK
/// deserializes the entire response with `miniserde` into fully-typed structs,
/// so a single object anywhere in a page that has an unexpected shape fails the
/// whole request ("error deserializing request data"). A production account has
/// far too much variety for that to be reliable. Instead we parse with `serde`
/// into small structs holding ONLY the fields we need; unknown fields are
/// ignored, so it tolerates whatever else Stripe returns.
pub struct StripeApi {
  http: Client,
  secret_key: String,
}

/// A Stripe `list` envelope.
#[derive(Deserialize)]
pub struct StripeList<T> {
  #[serde(default = "Vec::new")]
  pub data: Vec<T>,
  #[serde(default)]
  pub has_more: bool,
}

#[derive(Deserialize)]
pub struct PaymentIntent {
  pub id: String,
  #[serde(default)]
  pub status: String,
  #[serde(default)]
  pub amount_received: i64,
  #[serde(default)]
  pub created: i64,
  #[serde(default)]
  pub livemode: bool,
  /// Unexpanded: the customer id string (or null).
  #[serde(default)]
  pub customer: Option<String>,
  /// Unexpanded: the charge id string (or null).
  #[serde(default)]
  pub latest_charge: Option<String>,
  #[serde(default)]
  pub metadata: HashMap<String, String>,
}

#[derive(Deserialize)]
pub struct Invoice {
  #[serde(default)]
  pub id: Option<String>,
  #[serde(default)]
  pub amount_paid: i64,
  #[serde(default)]
  pub created: i64,
  #[serde(default)]
  pub livemode: bool,
  /// e.g. "subscription_create", "subscription_cycle".
  #[serde(default)]
  pub billing_reason: Option<String>,
  #[serde(default)]
  pub customer: Option<String>,
  #[serde(default)]
  pub customer_email: Option<String>,
  #[serde(default)]
  pub metadata: HashMap<String, String>,
  #[serde(default)]
  pub lines: InvoiceLines,
  #[serde(default)]
  pub parent: Option<InvoiceParent>,
}

#[derive(Deserialize, Default)]
pub struct InvoiceLines {
  #[serde(default)]
  pub data: Vec<InvoiceLine>,
}

#[derive(Deserialize)]
pub struct InvoiceLine {
  #[serde(default)]
  pub metadata: HashMap<String, String>,
}

#[derive(Deserialize)]
pub struct InvoiceParent {
  #[serde(default)]
  pub subscription_details: Option<SubscriptionDetails>,
}

#[derive(Deserialize)]
pub struct SubscriptionDetails {
  #[serde(default)]
  pub metadata: HashMap<String, String>,
}

#[derive(Deserialize)]
pub struct Customer {
  #[serde(default)]
  pub email: Option<String>,
  #[serde(default)]
  pub metadata: HashMap<String, String>,
  /// Present and `true` for deleted customers.
  #[serde(default)]
  pub deleted: bool,
}

impl StripeApi {
  pub fn new(secret_key: String) -> AnyhowResult<Self> {
    let http = Client::builder()
      .connect_timeout(Duration::from_secs(15))
      .timeout(Duration::from_secs(30))
      .build()
      .map_err(|err| anyhow!("building reqwest client: {err}"))?;
    Ok(Self { http, secret_key })
  }

  /// One page of PaymentIntents created at/after `created_gte` (unix seconds).
  pub async fn list_payment_intents(
    &self,
    created_gte: i64,
    starting_after: Option<&str>,
  ) -> AnyhowResult<StripeList<PaymentIntent>> {
    let created_gte = created_gte.to_string();
    let mut query: Vec<(&str, &str)> =
      vec![("created[gte]", &created_gte), ("limit", PAGE_LIMIT)];
    if let Some(after) = starting_after {
      query.push(("starting_after", after));
    }
    self.get_list("/payment_intents", &query).await
  }

  /// One page of PAID invoices created at/after `created_gte` (unix seconds).
  pub async fn list_paid_invoices(
    &self,
    created_gte: i64,
    starting_after: Option<&str>,
  ) -> AnyhowResult<StripeList<Invoice>> {
    let created_gte = created_gte.to_string();
    let mut query: Vec<(&str, &str)> =
      vec![("created[gte]", &created_gte), ("status", "paid"), ("limit", PAGE_LIMIT)];
    if let Some(after) = starting_after {
      query.push(("starting_after", after));
    }
    self.get_list("/invoices", &query).await
  }

  pub async fn retrieve_customer(&self, customer_id: &str) -> AnyhowResult<Customer> {
    let url = format!("{STRIPE_API_BASE}/customers/{customer_id}");
    let response = self
      .http
      .get(&url)
      .bearer_auth(&self.secret_key)
      .send()
      .await
      .map_err(|err| anyhow!("Stripe GET {url}: {err}"))?;
    let status = response.status();
    let body = response.text().await.map_err(|err| anyhow!("Stripe read body {url}: {err}"))?;
    if !status.is_success() {
      return Err(anyhow!("Stripe {status} retrieving customer {customer_id}: {}", truncate(&body)));
    }
    serde_json::from_str::<Customer>(&body).map_err(|err| anyhow!("parsing customer {customer_id}: {err}"))
  }

  async fn get_list<T: DeserializeOwned>(
    &self,
    path: &str,
    query: &[(&str, &str)],
  ) -> AnyhowResult<StripeList<T>> {
    let url = format!("{STRIPE_API_BASE}{path}");
    let response = self
      .http
      .get(&url)
      .query(query)
      .bearer_auth(&self.secret_key)
      .send()
      .await
      .map_err(|err| anyhow!("Stripe GET {url}: {err}"))?;
    let status = response.status();
    let body = response.text().await.map_err(|err| anyhow!("Stripe read body {url}: {err}"))?;
    if !status.is_success() {
      return Err(anyhow!("Stripe {status} on {path}: {}", truncate(&body)));
    }
    serde_json::from_str::<StripeList<T>>(&body).map_err(|err| anyhow!("parsing {path} response: {err}"))
  }
}

/// Truncate (on a char boundary) for safe error logging. Stripe error bodies
/// contain messages, not secrets.
fn truncate(s: &str) -> String {
  if s.chars().count() > MAX_ERROR_BODY_CHARS {
    format!("{}…", s.chars().take(MAX_ERROR_BODY_CHARS).collect::<String>())
  } else {
    s.to_string()
  }
}
