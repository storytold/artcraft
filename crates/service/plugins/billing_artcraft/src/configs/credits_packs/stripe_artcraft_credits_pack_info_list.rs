use crate::configs::credits_packs::stripe_artcraft_credits_pack_info::StripeArtcraftCreditsPackInfo;
use enums_db::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;

//
// SANDBOX
//

pub const ARTCRAFT_1000_SANDBOX : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft1000,
  product_id: "prod_Szg3Puzu8rDnjc",
  price_id: "price_1S3ghiEobp4xy4TlnQrm6UG4",
  purchase_credits_amount: 1000,
};

pub const ARTCRAFT_2500_SANDBOX : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft2500,
  product_id: "prod_Szg4dDUPQJNuO4",
  price_id: "price_1S3gi3Eobp4xy4TlkfG1qFkT",
  purchase_credits_amount: 2500,
};

//
// PRODUCTION
//

pub const ARTCRAFT_1000_PRODUCTION : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft1000,
  product_id: "prod_Szg0GS23FrVhQM",
  price_id: "price_1S3geBIaZEzwFveeg5GXWn1J",
  purchase_credits_amount: 1000,
};

pub const ARTCRAFT_2500_PRODUCTION : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft2500,
  product_id: "prod_Szg1VdYZdhGoS8",
  price_id: "price_1S3gf8IaZEzwFveen76Xc0kK",
  purchase_credits_amount: 2500,
};

pub const ARTCRAFT_5000_PRODUCTION : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft5000,
  product_id: "prod_TjdjC6GkmVLXwN",
  price_id: "price_1SmARZIaZEzwFveeJIJL0dd5",
  purchase_credits_amount: 5000,
};

pub const ARTCRAFT_10000_PRODUCTION : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft10000,
  product_id: "prod_TjdkUT4XxSdYzH",
  price_id: "price_1SmASkIaZEzwFvee7VFPSysj",
  purchase_credits_amount: 10000,
};

pub const ARTCRAFT_25000_PRODUCTION : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft25000,
  product_id: "prod_TjdmfG4teDPYH7",
  price_id: "price_1SmAUbIaZEzwFveeLr0Cze7Z",
  purchase_credits_amount: 25000,
};

pub const ARTCRAFT_50000_PRODUCTION : StripeArtcraftCreditsPackInfo = StripeArtcraftCreditsPackInfo {
  slug: ArtcraftCreditsPackSlug::Artcraft50000,
  product_id: "prod_TjdmokIOsymE5c",
  price_id: "price_1SmAVQIaZEzwFveeDkAn7V2m",
  purchase_credits_amount: 50000,
};
