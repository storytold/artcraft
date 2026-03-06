use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

pub const CREATE_NEW_USER_ACCOUNT_AND_SUBSCRIPTION_CHECKOUT_URL_PATH: &str = "/v1/stripe_artcraft/user_signup/subscription_checkout";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCreateSubscriptionCheckoutWithUserSignupRequest {
  /// The (non-Stripe) internal identifier for the product or subscription.
  /// This will be translated into a Stripe identifier.
  pub plan: Option<ArtcraftSubscriptionSlug>,

  pub cadence: Option<PlanBillingCadence>,

  /// Optional: The referral URL the user arrived from when signing up.
  /// The browser can send `document.referrer` to the backend so we know how people are finding us.
  /// If the browser doesn't send this parameter, we'll try the `referer` header.
  pub maybe_referral_url: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Copy, Clone)]
pub enum PlanBillingCadence {
  #[serde(rename = "monthly")]
  Monthly,

  #[serde(rename = "yearly")]
  Yearly,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCreateSubscriptionCheckoutWithUserSignupResponse {
  pub success: bool,
  
  /// The checkout session URL.
  pub stripe_checkout_redirect_url: String,
  
  /// If a user account was created, these are the details.
  pub generated_user: Option<UserDetails>,

  /// If a session was created, these are the details.
  pub session: Option<SessionDetails>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct UserDetails {
  /// The generated username.
  pub username: String,

  /// The generated display name.
  pub display_name: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct SessionDetails {
  /// A signed session that can be sent as a header, bypassing cookies.
  /// This is useful for API clients that don't support cookies or Google
  /// browsers killing cross-domain cookies.
  pub signed_session: String,
}
