use std::error::Error;
use std::fmt::{Display, Formatter};

#[cfg(test)]
use mockall::{automock, predicate::*};

use server_environment::ServerEnvironment;

/// Errors for this component are not strongly typed.
#[derive(Debug)]
pub enum StripeProductLookupError {
    UncategorizedError { description: String },
}

impl Display for StripeProductLookupError {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        match self {
            StripeProductLookupError::UncategorizedError { description } => {
                write!(f, "StripeProductLookupError::UncategorizedError: {}", description)
            }
        }
    }
}

impl Error for StripeProductLookupError {}

pub struct StripeProduct {
    /// The stripe product id.
    pub stripe_product_id: String,

    /// The stripe price id.
    pub stripe_price_id: String,

    /// Whether the product is a subscription product
    pub is_subscription_product: bool,
}

/// Allows external systems to map internal product keys to stripe information.
#[cfg_attr(test, automock)]
pub trait InternalProductToStripeLookup {
    /// Look up stripe product information from an internal system identifier.
    fn lookup_stripe_product_from_internal_product_key(&self, server_environment: ServerEnvironment, internal_product_key: &str)
        -> Result<Option<StripeProduct>, StripeProductLookupError>;
}
