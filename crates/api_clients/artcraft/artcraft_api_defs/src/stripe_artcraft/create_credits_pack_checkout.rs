use enums::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;
use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

pub const CREATE_CREDITS_PACK_CHECKOUT_URL_PATH: &str = "/v1/stripe_artcraft/checkout/credits_pack";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCreateCreditsPackCheckoutRequest {
  pub credits_pack: Option<ArtcraftCreditsPackSlug>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct StripeArtcraftCreateCreditsPackCheckoutResponse {
  pub success: bool,
  pub stripe_checkout_redirect_url: String,
}

