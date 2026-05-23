use crate::configs::credits_packs::stripe_artcraft_credits_pack_info::StripeArtcraftCreditsPackInfo;
use crate::configs::credits_packs::stripe_artcraft_credits_pack_info_list::{ARTCRAFT_10000_PRODUCTION, ARTCRAFT_1000_PRODUCTION, ARTCRAFT_1000_SANDBOX, ARTCRAFT_25000_PRODUCTION, ARTCRAFT_2500_PRODUCTION, ARTCRAFT_2500_SANDBOX, ARTCRAFT_50000_PRODUCTION, ARTCRAFT_5000_PRODUCTION};
use enums::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;
use server_environment::ServerEnvironment;

pub fn get_artcraft_credits_pack_by_slug_and_env(slug: ArtcraftCreditsPackSlug, env: ServerEnvironment) -> StripeArtcraftCreditsPackInfo {
  match (env, slug) {
    // Development sandbox
    (ServerEnvironment::Development, ArtcraftCreditsPackSlug::Artcraft1000) => ARTCRAFT_1000_SANDBOX,
    (ServerEnvironment::Development, ArtcraftCreditsPackSlug::Artcraft2500) => ARTCRAFT_2500_SANDBOX,

    // NB: These four (4) are not dev plans, but were set up for temp/fake match branch completeness
    (ServerEnvironment::Development, ArtcraftCreditsPackSlug::Artcraft5000) => ARTCRAFT_5000_PRODUCTION, // NB: INVALID PLAN FOR DEV
    (ServerEnvironment::Development, ArtcraftCreditsPackSlug::Artcraft10000) => ARTCRAFT_10000_PRODUCTION, // NB: INVALID PLAN FOR DEV
    (ServerEnvironment::Development, ArtcraftCreditsPackSlug::Artcraft25000) => ARTCRAFT_25000_PRODUCTION, // NB: INVALID PLAN FOR DEV
    (ServerEnvironment::Development, ArtcraftCreditsPackSlug::Artcraft50000) => ARTCRAFT_50000_PRODUCTION, // NB: INVALID PLAN FOR DEV
    
    // Production
    (ServerEnvironment::Production, ArtcraftCreditsPackSlug::Artcraft1000) => ARTCRAFT_1000_PRODUCTION,
    (ServerEnvironment::Production, ArtcraftCreditsPackSlug::Artcraft2500) => ARTCRAFT_2500_PRODUCTION,
    (ServerEnvironment::Production, ArtcraftCreditsPackSlug::Artcraft5000) => ARTCRAFT_5000_PRODUCTION,
    (ServerEnvironment::Production, ArtcraftCreditsPackSlug::Artcraft10000) => ARTCRAFT_10000_PRODUCTION,
    (ServerEnvironment::Production, ArtcraftCreditsPackSlug::Artcraft25000) => ARTCRAFT_25000_PRODUCTION,
    (ServerEnvironment::Production, ArtcraftCreditsPackSlug::Artcraft50000) => ARTCRAFT_50000_PRODUCTION,
  }
}
