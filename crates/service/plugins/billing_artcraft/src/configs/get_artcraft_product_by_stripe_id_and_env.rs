use crate::configs::credits_packs::stripe_artcraft_credits_pack_info::StripeArtcraftCreditsPackInfo;
use crate::configs::credits_packs::stripe_artcraft_credits_pack_info_list::{ARTCRAFT_10000_PRODUCTION, ARTCRAFT_1000_PRODUCTION, ARTCRAFT_1000_SANDBOX, ARTCRAFT_25000_PRODUCTION, ARTCRAFT_2500_PRODUCTION, ARTCRAFT_2500_SANDBOX, ARTCRAFT_50000_PRODUCTION, ARTCRAFT_5000_PRODUCTION};
use crate::configs::stripe_artcraft_generic_product_info::StripeArtcraftGenericProductInfo;
use crate::configs::subscriptions::stripe_artcraft_subscription_info::StripeArtcraftSubscriptionInfo;
use crate::configs::subscriptions::stripe_artcraft_subscription_info_list::{ARTCRAFT_BASIC_PRODUCTION, ARTCRAFT_BASIC_SANDBOX, ARTCRAFT_MAX_PRODUCTION, ARTCRAFT_MAX_SANDBOX, ARTCRAFT_PRO_PRODUCTION, ARTCRAFT_PRO_SANDBOX};
use once_cell::sync::Lazy;
use server_environment::ServerEnvironment;
use std::collections::HashMap;

static PRODUCTION_PRODUCTS_BY_STRIPE_ID : Lazy<HashMap<String, StripeArtcraftGenericProductInfo>> = Lazy::new(|| {
  let mut plans = HashMap::new();
 
  // Subscriptions
  add_plan(&mut plans, &ARTCRAFT_BASIC_PRODUCTION);
  add_plan(&mut plans, &ARTCRAFT_PRO_PRODUCTION);
  add_plan(&mut plans, &ARTCRAFT_MAX_PRODUCTION);

  // One-off payments
  add_credits(&mut plans, &ARTCRAFT_1000_PRODUCTION);
  add_credits(&mut plans, &ARTCRAFT_2500_PRODUCTION);
  add_credits(&mut plans, &ARTCRAFT_5000_PRODUCTION);
  add_credits(&mut plans, &ARTCRAFT_10000_PRODUCTION);
  add_credits(&mut plans, &ARTCRAFT_25000_PRODUCTION);
  add_credits(&mut plans, &ARTCRAFT_50000_PRODUCTION);

  plans
});

static SANDBOX_PRODUCTS_BY_STRIPE_ID : Lazy<HashMap<String, StripeArtcraftGenericProductInfo>> = Lazy::new(|| {
  let mut plans = HashMap::new();

  // Subscriptions
  add_plan(&mut plans, &ARTCRAFT_BASIC_SANDBOX);
  add_plan(&mut plans, &ARTCRAFT_PRO_SANDBOX);
  add_plan(&mut plans, &ARTCRAFT_MAX_SANDBOX);

  // One-off payments
  add_credits(&mut plans, &ARTCRAFT_1000_SANDBOX);
  add_credits(&mut plans, &ARTCRAFT_2500_SANDBOX);

  plans
});

pub fn get_artcraft_product_by_stripe_id_and_env(stripe_id: &str, env: ServerEnvironment) -> Option<&StripeArtcraftGenericProductInfo> {
  match env {
    ServerEnvironment::Development => SANDBOX_PRODUCTS_BY_STRIPE_ID.get(stripe_id),
    ServerEnvironment::Production => PRODUCTION_PRODUCTS_BY_STRIPE_ID.get(stripe_id),
  }
}

fn add_plan(plans: &mut HashMap<String, StripeArtcraftGenericProductInfo>, product: &StripeArtcraftSubscriptionInfo) {
  plans.insert(product.product_id.to_string(), StripeArtcraftGenericProductInfo::Subscription(product.clone()));
}

fn add_credits(plans: &mut HashMap<String, StripeArtcraftGenericProductInfo>, product: &StripeArtcraftCreditsPackInfo) {
  plans.insert(product.product_id.to_string(), StripeArtcraftGenericProductInfo::CreditsPack(product.clone()));
}
  
