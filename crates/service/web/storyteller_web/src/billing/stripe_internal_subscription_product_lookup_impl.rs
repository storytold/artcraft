use billing_component::stripe::traits::internal_subscription_product_lookup::{InternalProductLookupError, InternalSubscriptionProduct, InternalSubscriptionProductLookup};
use enums_db::common::payments_namespace::PaymentsNamespace;
use crate::configs::plans::plan_list::{PLANS_BY_STRIPE_PRICE_ID, PLANS_BY_STRIPE_PRODUCT_ID};

const SUBSCRIPTION_CATEGORY : PaymentsNamespace = PaymentsNamespace::FakeYou;

/// A simple Actix injectable action
#[derive(Clone, Copy)]
pub struct StripeInternalSubscriptionProductLookupImpl;

impl InternalSubscriptionProductLookup for StripeInternalSubscriptionProductLookupImpl {
    fn lookup_internal_product_from_stripe_product_id(&self, stripe_product_id: &str) -> Result<Option<InternalSubscriptionProduct>, InternalProductLookupError> {
        Ok(PLANS_BY_STRIPE_PRODUCT_ID.get(stripe_product_id)
            .map(|plan| {
                InternalSubscriptionProduct {
                    subscription_category: SUBSCRIPTION_CATEGORY,
                    subscription_product_key: plan.plan_slug().to_string(),
                }
            }))
    }

    fn lookup_internal_product_from_stripe_price_id(&self, stripe_price_id: &str) -> Result<Option<InternalSubscriptionProduct>, InternalProductLookupError> {
        Ok(PLANS_BY_STRIPE_PRICE_ID.get(stripe_price_id)
            .map(|plan| {
                InternalSubscriptionProduct {
                    subscription_category: SUBSCRIPTION_CATEGORY,
                    subscription_product_key: plan.plan_slug().to_string(),
                }
            }))
    }
}