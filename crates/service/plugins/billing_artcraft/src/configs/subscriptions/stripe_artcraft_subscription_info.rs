use enums_db::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;

#[derive(Debug, Clone)]
pub struct StripeArtcraftSubscriptionInfo {
  pub slug: ArtcraftSubscriptionSlug,
  pub product_id: &'static str,
  pub monthly_price_id: &'static str,
  pub yearly_price_id: &'static str,

  /// How many monthly credits this plan grants
  pub monthly_credits_amount: u64,
}

