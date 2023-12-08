use actix_web::HttpRequest;
use async_trait::async_trait;
use chrono::Utc;
use log::warn;

#[cfg(feature = "billing")]
use billing_component::stripe::traits::internal_user_lookup::{InternalUserLookup, InternalUserLookupError, SubscriptionKey, UserMetadata};
use users_component::utils::session_checker::SessionChecker;

use crate::MySqlPool;

/// A simple Actix injectable action
#[derive(Clone)]
pub struct StripeInternalUserLookupImpl {
    session_checker: SessionChecker,
    mysql_pool: MySqlPool,
}

impl StripeInternalUserLookupImpl {
    pub fn new(session_checker: SessionChecker, mysql_pool: MySqlPool) -> Self {
        Self {
            session_checker,
            mysql_pool,
        }
    }
}

// NB: Marking async_trait as not needing Sync/Send. Hopefully this doesn't blow up on us.
#[cfg(feature = "billing")]
#[async_trait(?Send)]
impl InternalUserLookup for StripeInternalUserLookupImpl {
    async fn lookup_user_from_http_request(&self, http_request: &HttpRequest) -> Result<Option<UserMetadata>, InternalUserLookupError> {
        let mut mysql_connection = self.mysql_pool.acquire()
            .await
            .map_err(|e| {
                warn!("Could not acquire DB pool: {:?}", e);
                InternalUserLookupError::ServerError
            })?;

        let maybe_user_session = self.session_checker
            .maybe_get_user_session_extended_from_connection(&http_request, &mut mysql_connection)
            .await
            .map_err(|e| {
                warn!("Session checker error: {:?}", e);
                InternalUserLookupError::ServerError
            })?;

        let now = Utc::now();

        match maybe_user_session {
            None => Ok(None),
            Some(user_session) => Ok(Some(UserMetadata {
                user_token: user_session.user_token,
                username: Some(user_session.user.username),
                user_email: Some(user_session.user.email_address),
                maybe_existing_stripe_customer_id: user_session.premium.maybe_stripe_customer_id,
                existing_subscription_keys: user_session.premium.subscription_plans.into_iter()
                    .filter(|sub| {
                        sub.subscription_expires_at.gt(&now)
                    })
                    .map(|sub| {
                        SubscriptionKey {
                            internal_subscription_namespace: sub.subscription_namespace,
                            internal_subscription_product_slug: sub.subscription_product_slug,
                        }
                    })
                    .collect::<Vec<SubscriptionKey>>(),
                maybe_loyalty_program_key: user_session.premium.maybe_loyalty_program_key,
            })),
        }
    }
}
