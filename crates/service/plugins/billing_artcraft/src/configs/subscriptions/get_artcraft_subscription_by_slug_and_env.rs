use crate::configs::subscriptions::stripe_artcraft_subscription_info::StripeArtcraftSubscriptionInfo;
use crate::configs::subscriptions::stripe_artcraft_subscription_info_list::{ARTCRAFT_BASIC_PRODUCTION, ARTCRAFT_BASIC_SANDBOX, ARTCRAFT_MAX_PRODUCTION, ARTCRAFT_MAX_SANDBOX, ARTCRAFT_PRO_PRODUCTION, ARTCRAFT_PRO_SANDBOX};
use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use server_environment::ServerEnvironment;

pub fn get_artcraft_subscription_by_slug_and_env(slug: ArtcraftSubscriptionSlug, env: ServerEnvironment) -> StripeArtcraftSubscriptionInfo {
  match (env, slug) {
    // Development sandbox
    (ServerEnvironment::Development, ArtcraftSubscriptionSlug::ArtcraftBasic) => ARTCRAFT_BASIC_SANDBOX,
    (ServerEnvironment::Development, ArtcraftSubscriptionSlug::ArtcraftPro) => ARTCRAFT_PRO_SANDBOX,
    (ServerEnvironment::Development, ArtcraftSubscriptionSlug::ArtcraftMax) => ARTCRAFT_MAX_SANDBOX,
    // Production
    (ServerEnvironment::Production, ArtcraftSubscriptionSlug::ArtcraftBasic) => ARTCRAFT_BASIC_PRODUCTION,
    (ServerEnvironment::Production, ArtcraftSubscriptionSlug::ArtcraftPro) => ARTCRAFT_PRO_PRODUCTION,
    (ServerEnvironment::Production, ArtcraftSubscriptionSlug::ArtcraftMax) => ARTCRAFT_MAX_PRODUCTION,
  }
}
