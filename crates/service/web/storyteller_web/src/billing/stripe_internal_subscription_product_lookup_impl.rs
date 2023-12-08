
#[cfg(feature = "billing")]
use billing_component::stripe::traits::internal_subscription_product_lookup::{InternalProductLookupError, InternalSubscriptionProduct, InternalSubscriptionProductLookup};

use crate::configs::plans::plan_list::{PLANS_BY_STRIPE_PRICE_ID, PLANS_BY_STRIPE_PRODUCT_ID};

const SUBSCRIPTION_CATEGORY : &str = "fakeyou";

/// A simple Actix injectable action
#[derive(Clone, Copy)]
pub struct StripeInternalSubscriptionProductLookupImpl;

#[cfg(feature = "billing")]
impl InternalSubscriptionProductLookup for StripeInternalSubscriptionProductLookupImpl {
    fn lookup_internal_product_from_stripe_product_id(&self, stripe_product_id: &str) -> Result<Option<InternalSubscriptionProduct>, InternalProductLookupError> {
        Ok(PLANS_BY_STRIPE_PRODUCT_ID.get(stripe_product_id)
            .map(|plan| {
                InternalSubscriptionProduct {
                    subscription_category: SUBSCRIPTION_CATEGORY.to_string(),
                    subscription_product_key: plan.plan_slug().to_string(),
                }
            }))
    }

    fn lookup_internal_product_from_stripe_price_id(&self, stripe_price_id: &str) -> Result<Option<InternalSubscriptionProduct>, InternalProductLookupError> {
        Ok(PLANS_BY_STRIPE_PRICE_ID.get(stripe_price_id)
            .map(|plan| {
                InternalSubscriptionProduct {
                    subscription_category: SUBSCRIPTION_CATEGORY.to_string(),
                    subscription_product_key: plan.plan_slug().to_string(),
                }
            }))
    }
}