use enums_api::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;

#[derive(Debug, Clone)]
pub struct StripeArtcraftCreditsPackInfo {
  pub slug: ArtcraftCreditsPackSlug,
  pub product_id: &'static str,
  pub price_id: &'static str,

  /// When a new credits pack purchase is made, this is how many credits
  /// are added for "quantity=1"
  pub purchase_credits_amount: u64,
}

