use enums_db::common::payments_namespace::PaymentsNamespace;
use std::error::Error;
use std::fmt::{Display, Formatter};

/// Errors for this component are not strongly typed.
#[derive(Debug)]
pub enum InternalProductLookupError {
    UncategorizedError { description: String },
}

impl Display for InternalProductLookupError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            InternalProductLookupError::UncategorizedError { description } => {
                write!(f, "InternalProductLookupError::UncategorizedError: {}", description)
            }
        }
    }
}

impl Error for InternalProductLookupError {}

pub struct InternalSubscriptionProduct {
    /// If a backend services multiple "websites" or namespaced subscriptions, this is how we
    /// firewall them off from one another.
    pub subscription_category: PaymentsNamespace,

    /// The internal system lookup key for the subscription product. Typically a simple string,
    /// such as "tts_pro".
    pub subscription_product_key: String,
}

/// Allows external systems to define lookup behavior for subscriptions
pub trait InternalSubscriptionProductLookup {
    /// Look up an internal product from a stripe product id.
    fn lookup_internal_product_from_stripe_product_id(&self, stripe_product_id: &str)
        -> Result<Option<InternalSubscriptionProduct>, InternalProductLookupError>;

    /// Look up an internal product from a stripe product id.
    fn lookup_internal_product_from_stripe_price_id(&self, stripe_price_id: &str)
        -> Result<Option<InternalSubscriptionProduct>, InternalProductLookupError>;
}
