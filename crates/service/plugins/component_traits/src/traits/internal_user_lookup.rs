use std::error::Error;
use std::fmt::{Display, Formatter};

use actix_web::HttpRequest;
use async_trait::async_trait;
use enums_db::common::payments_namespace::PaymentsNamespace;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tokens::tokens::users::UserToken;
//#[cfg(test)]
//use mockall::automock;

/// Errors for this component are not strongly typed.
#[derive(Debug)]
pub enum InternalUserLookupError {
  NotAuthorizedError,
  ServerError,
  UncategorizedError { description: String },
}

impl Display for InternalUserLookupError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      InternalUserLookupError::NotAuthorizedError => {
        write!(f, "InternalUserLookupError::NotAuthorizedError")
      }
      InternalUserLookupError::ServerError => {
        write!(f, "InternalUserLookupError::ServerError")
      }
      InternalUserLookupError::UncategorizedError { description } => {
        write!(f, "InternalUserLookupError::UncategorizedError: {}", description)
      }
    }
  }
}

impl Error for InternalUserLookupError {}

#[derive(Clone, Default)]
pub struct UserMetadata {
  /// Internal system primary key identifier of the user, stringly typed.
  pub user_token: String,

  /// Internal system primary key identifier of the user, strongly typed.
  pub user_token_typed: UserToken,

  /// Internal system username for the user.
  /// We will associate this to Stripe objects if available.
  pub username: Option<String>,

  /// Internal system email for the user.
  /// We will associate this to Stripe objects if available.
  pub user_email: Option<String>,

  /// Possible existing Stripe customer ID for the user.
  pub maybe_existing_stripe_customer_id: Option<String>,

  /// Existing subscriptions that the user has.
  /// The list contains *only active* subscriptions and old
  /// subscriptions will not be reported if they have already
  /// expired.
  pub existing_subscription_keys: Vec<SubscriptionKey>,

  /// If the user has a loyalty premium plan (not paid for),
  /// it will be listed here.
  pub maybe_loyalty_program_key: Option<String>,
}

#[derive(Clone, Debug)]
pub struct SubscriptionKey {
  /// The category or namespace for the product, eg "artcraft" or "fakeyou".
  pub internal_subscription_namespace: PaymentsNamespace,

  /// The key for the product in our internal system (not a stripe id),
  /// eg. "artcraft_basic", "fakeyou_en_pro", or "stream_package_plus".
  /// These depend on the namespace, so they're stringly-encoded.
  pub internal_subscription_product_slug: String,
}

/// Allows us to inject a user lookup from the HTTP request's session info and database backend,
/// then translate these into the pieces we need for the billing component.
//#[cfg_attr(test, automock)]
#[async_trait(?Send)] // NB: Marking async_trait as not needing Sync/Send. Hopefully this doesn't blow up on us.
pub trait InternalUserLookup {

  /// Lookup a user's session details from an HTTP request, then return the
  /// relevant pieces for the Stripe integration.
  async fn lookup_user_from_http_request(&self, http_request: &HttpRequest) -> Result<Option<UserMetadata>, InternalUserLookupError>;

  async fn lookup_user_from_http_request_and_mysql_connection(&self, http_request: &HttpRequest, mysql_connection: &mut PoolConnection<MySql>) -> Result<Option<UserMetadata>, InternalUserLookupError>;
}
