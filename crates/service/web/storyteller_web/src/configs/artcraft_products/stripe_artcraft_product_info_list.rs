use crate::configs::artcraft_products::stripe_artcraft_product_info::StripeArtcraftProductInfo;
use enums_db::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;

//
// SANDBOX
//

pub const ARTCRAFT_BASIC_SANDBOX : StripeArtcraftProductInfo = StripeArtcraftProductInfo {
  slug: ArtcraftSubscriptionSlug::ArtcraftBasic,
  product_id: "prod_SyJURfbu2ixP7M",
  monthly_price_id: "price_1S2MrSEobp4xy4Tlwit8aeNE",
  yearly_price_id: "price_1S2MrsEobp4xy4TlDG2skTkc",
};

pub const ARTCRAFT_PRO_SANDBOX : StripeArtcraftProductInfo = StripeArtcraftProductInfo {
  slug: ArtcraftSubscriptionSlug::ArtcraftPro,
  product_id: "prod_SyJTy5arqKmaxT",
  monthly_price_id: "price_1S2MqZEobp4xy4TlR9KLyitD",
  yearly_price_id: "price_1S2MqyEobp4xy4Tl0ZXOK8Z0",
};

pub const ARTCRAFT_MAX_SANDBOX : StripeArtcraftProductInfo = StripeArtcraftProductInfo {
  slug: ArtcraftSubscriptionSlug::ArtcraftMax,
  product_id: "prod_SyJSoHNUU81BjU",
  monthly_price_id: "price_1S2MpGEobp4xy4TldyO9lAwd",
  yearly_price_id: "price_1S2MppEobp4xy4Tln6xjTKKD",
};

//
// PRODUCTION
//

pub const ARTCRAFT_BASIC_PRODUCTION : StripeArtcraftProductInfo = StripeArtcraftProductInfo {
  slug: ArtcraftSubscriptionSlug::ArtcraftBasic,
  product_id: "prod_SyIXACAGqPbsoG",
  monthly_price_id: "price_1S2LwbIaZEzwFveeYqYxgrV7",
  yearly_price_id: "price_1S2Lz8IaZEzwFvee40D7PFoa",
};

pub const ARTCRAFT_PRO_PRODUCTION : StripeArtcraftProductInfo = StripeArtcraftProductInfo {
  slug: ArtcraftSubscriptionSlug::ArtcraftPro,
  product_id: "prod_SyIfqs9Rmv3Fdu",
  monthly_price_id: "price_1S2M4FIaZEzwFveeRoqYDbDw",
  yearly_price_id: "price_1S2M5VIaZEzwFveeLAXk3hL8",
};

pub const ARTCRAFT_MAX_PRODUCTION : StripeArtcraftProductInfo = StripeArtcraftProductInfo {
  slug: ArtcraftSubscriptionSlug::ArtcraftMax,
  product_id: "prod_SyJ6VIFnc3riPp",
  monthly_price_id: "price_1S2MUSIaZEzwFveesCPf2XjP",
  yearly_price_id: "price_1S2MVlIaZEzwFveeEtPV27kH",
};

