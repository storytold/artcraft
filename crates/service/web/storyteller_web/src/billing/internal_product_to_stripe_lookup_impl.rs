
#[cfg(feature = "billing")]
use billing_component::stripe::traits::internal_product_to_stripe_lookup::{InternalProductToStripeLookup, StripeProduct, StripeProductLookupError};
use reusable_types::server_environment::ServerEnvironment;

use crate::configs::plans::plan_list::{DEVELOPMENT_PREMIUM_PLANS_BY_SLUG, PRODUCTION_PREMIUM_PLANS_BY_SLUG};

/// A simple Actix injectable action
#[derive(Clone, Copy)]
pub struct InternalProductToStripeLookupImpl;


#[cfg(feature = "billing")]
impl InternalProductToStripeLookup for InternalProductToStripeLookupImpl {
    fn lookup_stripe_product_from_internal_product_key(&self, server_environment: ServerEnvironment, internal_product_key: &str) -> Result<Option<StripeProduct>, StripeProductLookupError> {
        let plans_by_slug = match server_environment {
          ServerEnvironment::Development => &DEVELOPMENT_PREMIUM_PLANS_BY_SLUG,
          ServerEnvironment::Production => &PRODUCTION_PREMIUM_PLANS_BY_SLUG,
        };
        Ok(plans_by_slug.get(internal_product_key)
            .and_then(|plan| {
                let stripe_product_id = match plan.stripe_product_id() {
                    None => return None,
                    Some(stripe_product_id) => stripe_product_id.to_string(),
                };

                let stripe_price_id = match plan.stripe_price_id() {
                    None => return None,
                    Some(stripe_price_id) => stripe_price_id.to_string(),
                };

                Some(StripeProduct {
                    stripe_product_id,
                    stripe_price_id,
                    is_subscription_product: true, // NB: For now all plans are subscription plans.
                })
            }))
    }
}
