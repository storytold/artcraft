use anyhow::{anyhow, Result};
use serde_json::{json, Value};

use artcraft_api_defs::stripe_artcraft::create_credits_pack_checkout::StripeArtcraftCreateCreditsPackCheckoutRequest;
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::{StripeArtcraftCreateSubscriptionCheckoutRequest, PlanBillingCadence};
use artcraft_api_defs::stripe_artcraft::customer_portal_manage_plan::StripeArtcraftCustomerPortalManagePlanRequest;
use artcraft_client::endpoints::credits::get_session_credits::get_session_credits;
use artcraft_client::endpoints::stripe_artcraft::create_credits_pack_checkout::create_credits_pack_checkout as client_create_credits_pack_checkout;
use artcraft_client::endpoints::stripe_artcraft::create_subscription_checkout::create_subscription_checkout as client_create_subscription_checkout;
use artcraft_client::endpoints::stripe_artcraft::customer_portal_manage_plan::customer_portal_manage_plan as client_customer_portal_manage_plan;
use artcraft_client::endpoints::subscriptions::get_session_subscription::get_session_subscription;
use enums::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;
use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use enums::common::payments_namespace::PaymentsNamespace;

use crate::client::ArtCraftClient;
use crate::types::{Tool, ToolContent};
use crate::tools::http::raw_json_get;

pub fn tools() -> Vec<Tool> {
    vec![
        Tool {
            name: "artcraft_get_session_info".to_string(),
            description: "Get the currently authenticated user's info.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {}
            })),
        },
        Tool {
            name: "artcraft_get_credits".to_string(),
            description: "Get wallet credits and usage info.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "namespace": { "type": "string", "enum": ["artcraft", "fakeyou"], "description": "Payment namespace to query credits for" }
                }
            })),
        },
        Tool {
            name: "artcraft_get_subscription".to_string(),
            description: "Get subscription tier and limits.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {}
            })),
        },
        Tool {
            name: "artcraft_create_checkout_session".to_string(),
            description: "Create a Stripe checkout session to purchase credit packs when user credits are low.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "credits_pack": {
                        "type": "string",
                        "enum": [
                            "artcraft_1000",
                            "artcraft_2500",
                            "artcraft_5000",
                            "artcraft_10000",
                            "artcraft_25000",
                            "artcraft_50000"
                        ],
                        "description": "Credit pack size to purchase (default: artcraft_5000)"
                    }
                }
            })),
        },
        Tool {
            name: "artcraft_create_subscription_checkout".to_string(),
            description: "Create a Stripe subscription checkout link to upgrade or subscribe to ArtCraft Basic, Pro, or Max.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {
                    "plan": {
                        "type": "string",
                        "enum": ["artcraft_basic", "artcraft_pro", "artcraft_max"],
                        "description": "Subscription tier"
                    },
                    "cadence": {
                        "type": "string",
                        "enum": ["monthly", "yearly"],
                        "description": "Billing cycle (default: monthly)"
                    }
                },
                "required": ["plan"]
            })),
        },
        Tool {
            name: "artcraft_get_billing_portal_url".to_string(),
            description: "Get a Stripe customer billing portal URL where the user can manage cards, subscriptions, invoices, and plans.".to_string(),
            input_schema: Some(json!({
                "type": "object",
                "properties": {}
            })),
        },
    ]
}

pub async fn get_session_info(_arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let api_hostname = client.api_host.to_api_hostname_and_scheme();
    let url = format!("{}/v1/users/session_info", api_hostname);
    let response = raw_json_get(&url, client.creds_ref()).await?;

    let username = response.get("username").and_then(|v| v.as_str()).unwrap_or("?");
    let email = response.get("email").and_then(|v| v.as_str()).unwrap_or("?");
    let user_token = response.get("user_token").and_then(|v| v.as_str()).unwrap_or("?");

    let text = format!(
        "Session info:\n  User: {}\n  Email: {}\n  Token: {}",
        username, email, user_token
    );

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn get_credits(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let namespace_str = arguments["namespace"].as_str().unwrap_or("artcraft");
    let namespace = match namespace_str {
        "fakeyou" => PaymentsNamespace::FakeYou,
        _ => PaymentsNamespace::Artcraft,
    };

    let response = get_session_credits(
        &client.api_host,
        client.creds_ref(),
        namespace,
    ).await?;

    let text = format!(
        "Credits info:\n  Free credits: {}\n  Monthly credits: {}\n  Banked credits: {}\n  Total: {}",
        response.free_credits,
        response.monthly_credits,
        response.banked_credits,
        response.sum_total_credits,
    );

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn get_subscription(_arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let response = get_session_subscription(
        &client.api_host,
        client.creds_ref(),
        PaymentsNamespace::Artcraft,
    ).await?;

    let text = if let Some(sub) = response.active_subscription {
        format!(
            "Subscription info:\n  Plan: {}\n  Namespace: {:?}\n  Next bill: {:?}\n  Ends at: {:?}",
            sub.product_slug,
            sub.namespace,
            sub.next_bill_at,
            sub.subscription_end_at
        )
    } else {
        "No active subscription found.".to_string()
    };

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text,
    }])
}

pub async fn create_checkout_session(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let pack_str = arguments["credits_pack"].as_str().unwrap_or("artcraft_5000");
    let credits_pack = match pack_str {
        "artcraft_1000" => Some(ArtcraftCreditsPackSlug::Artcraft1000),
        "artcraft_2500" => Some(ArtcraftCreditsPackSlug::Artcraft2500),
        "artcraft_5000" => Some(ArtcraftCreditsPackSlug::Artcraft5000),
        "artcraft_10000" => Some(ArtcraftCreditsPackSlug::Artcraft10000),
        "artcraft_25000" => Some(ArtcraftCreditsPackSlug::Artcraft25000),
        "artcraft_50000" => Some(ArtcraftCreditsPackSlug::Artcraft50000),
        _ => Some(ArtcraftCreditsPackSlug::Artcraft5000),
    };

    let request = StripeArtcraftCreateCreditsPackCheckoutRequest { credits_pack };
    let response = client_create_credits_pack_checkout(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Stripe credit pack checkout session created successfully.\nDirect checkout URL: {}",
            response.stripe_checkout_redirect_url
        ),
    }])
}

pub async fn create_subscription_checkout(arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let plan_str = arguments["plan"].as_str()
        .ok_or_else(|| anyhow!("plan is required ('artcraft_basic', 'artcraft_pro', 'artcraft_max')"))?;

    let plan = match plan_str {
        "artcraft_basic" => Some(ArtcraftSubscriptionSlug::ArtcraftBasic),
        "artcraft_pro" => Some(ArtcraftSubscriptionSlug::ArtcraftPro),
        "artcraft_max" => Some(ArtcraftSubscriptionSlug::ArtcraftMax),
        _ => return Err(anyhow!("Unknown subscription plan: {}", plan_str)),
    };

    let cadence = match arguments["cadence"].as_str().unwrap_or("monthly") {
        "yearly" => Some(PlanBillingCadence::Yearly),
        _ => Some(PlanBillingCadence::Monthly),
    };

    let request = StripeArtcraftCreateSubscriptionCheckoutRequest { plan, cadence };
    let response = client_create_subscription_checkout(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Stripe subscription checkout session created successfully.\nDirect checkout URL: {}",
            response.stripe_checkout_redirect_url
        ),
    }])
}

pub async fn get_billing_portal_url(_arguments: Value, client: &ArtCraftClient) -> Result<Vec<ToolContent>> {
    let request = StripeArtcraftCustomerPortalManagePlanRequest { portal_config_id: None };
    let response = client_customer_portal_manage_plan(
        &client.api_host,
        client.creds_ref(),
        request,
    ).await?;

    Ok(vec![ToolContent {
        content_type: "text".to_string(),
        text: format!(
            "Stripe customer portal URL retrieved successfully.\nManagement URL: {}",
            response.stripe_portal_url
        ),
    }])
}
