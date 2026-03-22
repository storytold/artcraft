use crate::configs::subscriptions::stripe_artcraft_subscription_info::StripeArtcraftSubscriptionInfo;
use enums_api::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;

//
// SANDBOX
//

pub const ARTCRAFT_BASIC_SANDBOX : StripeArtcraftSubscriptionInfo = StripeArtcraftSubscriptionInfo {
  slug: ArtcraftSubscriptionSlug::ArtcraftBasic,
  product_id: "prod_SyJURfbu2ixP7M",
  monthly_price_id: "price_1S2MrSEobp4xy4Tlwit8aeNE",
  yearly_price_id: "price_1S2MrsEobp4xy4TlDG2skTkc",
  monthly_credits_amount: 1000, // $10/mo
};

pub const ARTCRAFT_PRO_SANDBOX : StripeArtcraftSubscriptionInfo = StripeArtcraftSubscriptionInfo {
  slug: ArtcraftSubscriptionSlug::ArtcraftPro,
  product_id: "prod_SyJTy5arqKmaxT",
  monthly_price_id: "price_1S2MqZEobp4xy4TlR9KLyitD",
  yearly_price_id: "price_1S2MqyEobp4xy4Tl0ZXOK8Z0",
  monthly_credits_amount: 3750, // $35/mo = 3500 + 245 (7%) + 5 = 3750
};

pub const ARTCRAFT_MAX_SANDBOX : StripeArtcraftSubscriptionInfo = StripeArtcraftSubscriptionInfo {
  slug: ArtcraftSubscriptionSlug::ArtcraftMax,
  product_id: "prod_SyJSoHNUU81BjU",
  monthly_price_id: "price_1S2MpGEobp4xy4TldyO9lAwd",
  yearly_price_id: "price_1S2MppEobp4xy4Tln6xjTKKD",
  monthly_credits_amount: 6600, // $60/mo = 6000 + 600 (10%) = 6600
};

//
// PRODUCTION
//

pub const ARTCRAFT_BASIC_PRODUCTION : StripeArtcraftSubscriptionInfo = StripeArtcraftSubscriptionInfo {
  slug: ArtcraftSubscriptionSlug::ArtcraftBasic,
  product_id: "prod_SyIXACAGqPbsoG",
  monthly_price_id: "price_1S2LwbIaZEzwFveeYqYxgrV7",
  yearly_price_id: "price_1S2Lz8IaZEzwFvee40D7PFoa",
  monthly_credits_amount: 1000, // $10/mo
};

pub const ARTCRAFT_PRO_PRODUCTION : StripeArtcraftSubscriptionInfo = StripeArtcraftSubscriptionInfo {
  slug: ArtcraftSubscriptionSlug::ArtcraftPro,
  product_id: "prod_SyIfqs9Rmv3Fdu",
  monthly_price_id: "price_1S2M4FIaZEzwFveeRoqYDbDw",
  yearly_price_id: "price_1S2M5VIaZEzwFveeLAXk3hL8",
  monthly_credits_amount: 3750, // $35/mo = 3500 + 245 (7%) + 5 = 3750
};

pub const ARTCRAFT_MAX_PRODUCTION : StripeArtcraftSubscriptionInfo = StripeArtcraftSubscriptionInfo {
  slug: ArtcraftSubscriptionSlug::ArtcraftMax,
  product_id: "prod_SyJ6VIFnc3riPp",
  monthly_price_id: "price_1S2MUSIaZEzwFveesCPf2XjP",
  yearly_price_id: "price_1S2MVlIaZEzwFveeEtPV27kH",
  monthly_credits_amount: 6600, // $60/mo = 6000 + 600 (10%) = 6600
};

