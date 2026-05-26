use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;
use enums::common::payments_namespace::PaymentsNamespace;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

// =============== Success Response ===============

#[derive(Serialize)]
pub struct AppPlansResponse {
    pub success: bool,

    /// Subscriptions the user has
    pub subscriptions: Vec<AppSubscription>,

    /// Actual features of the product, like "unlimited_models", "max_duration", etc.
    pub features: Vec<AppFeature>,
}

#[derive(Serialize)]
pub struct AppSubscription {
    pub subscription_namespace: PaymentsNamespace,
    pub subscription_product_slug: String,
    pub subscription_expires_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct AppFeature {
    /// Required.
    /// The identifier for the feature,
    /// eg. "unlimited_models"
    pub key: String,

    /// Optional.
    /// Whether the feature is enabled.
    /// If a feature is associated with a number rather than a boolean on/off, this will be absent.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_enabled: Option<bool>,

    /// Optional.
    /// A quantity associated with the feature.
    /// Sometimes a feature may be associated with a number rather than an enabled flag,
    /// such as "number_of_models = 50".
    #[serde(skip_serializing_if = "Option::is_none")]
    pub quantity: Option<u64>,
}

// =============== Error Response ===============
// NB: Not using derive_more::Display since Clion doesn't understand it.
// =============== Handler ===============

pub async fn get_app_plans_handler(
    http_request: HttpRequest,
    server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
    let maybe_user = server_state
        .session_checker
        .maybe_get_user_session_extended(&http_request, &server_state.mysql_pool)
        .await
        .map_err(|e| {
            warn!("Session checker error: {:?}", e);
            CommonWebError::from_error(e)
        })?;

    let unlimited_time = maybe_user
        .as_ref()
        .map(|user| user.user.username.to_lowercase().starts_with("time"))
        .unwrap_or(false);

    let model_count = maybe_user
        .as_ref()
        .map(|user| {
            let name = user.user.username.to_lowercase();
            if name.ends_with("some") {
                10
            } else if name.ends_with("more") {
                25
            } else if name.ends_with("most") {
                50
            } else {
                0
            }
        })
        .unwrap_or(0);

    let mut features = Vec::new();

    // NB: Triggered by username!
    if unlimited_time {
        features.push(AppFeature {
            key: "no_time_limit".to_string(),
            is_enabled: Some(true),
            quantity: None,
        });
    }

    // NB: Triggered by username!
    if model_count > 0 {
        features.push(AppFeature {
            key: "number_of_downloads_supported".to_string(),
            is_enabled: None,
            quantity: Some(model_count),
        });
    }

    let mut subscriptions = Vec::new();

    if let Some(user) = maybe_user {
        subscriptions = user.premium.subscription_plans.into_iter()
            .map(|subscription| {
                AppSubscription {
                    subscription_namespace: subscription.subscription_namespace,
                    subscription_product_slug: subscription.subscription_product_slug,
                    subscription_expires_at: subscription.subscription_expires_at,
                }
            })
            .collect::<Vec<AppSubscription>>();
    }

    let response = AppPlansResponse {
        success: true,
        features,
        subscriptions,
    };

    let body = serde_json::to_string(&response)
        .map_err(CommonWebError::from_error)?;

    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .body(body))
}
