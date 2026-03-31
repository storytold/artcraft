use log::info;

use crate::creds::rootly_api_key::RootlyApiKey;
use crate::error::rootly_error::RootlyError;
use crate::error::rootly_client_error::RootlyClientError;
use crate::error::rootly_generic_api_error::RootlyGenericApiError;
use crate::requests::create_alert::http_request::*;

const ROOTLY_API_BASE_URL: &str = "https://api.rootly.com/v1";

// ======================== Public args ========================

pub struct CreateAlertArgs {
  pub api_key: RootlyApiKey,

  /// The source of the alert (e.g. "artcraft", "seedance2pro_job").
  pub source: String,

  /// A short summary of the alert.
  pub summary: String,

  /// An optional longer description.
  pub description: Option<String>,

  /// The initial status. Defaults to "open" if not provided.
  pub status: Option<String>,

  /// Optional service IDs to associate.
  pub service_ids: Option<Vec<String>>,

  /// Optional group IDs to associate.
  pub group_ids: Option<Vec<String>>,

  /// Optional environment IDs to associate.
  pub environment_ids: Option<Vec<String>>,

  /// Optional external ID for linking to an external system.
  pub external_id: Option<String>,

  /// Optional external URL for linking to an external system.
  pub external_url: Option<String>,

  /// Optional alert urgency ID (get IDs from GET /v1/alert_urgencies).
  pub alert_urgency_id: Option<String>,

  /// Who to notify. One of: "User", "Group", "EscalationPolicy", "Service".
  /// Requires On-Call to be enabled.
  pub notification_target_type: Option<String>,

  /// The ID of the notification target (user ID, group ID, escalation policy ID, or service ID).
  pub notification_target_id: Option<String>,

  /// Optional labels as key-value pairs.
  pub labels: Option<Vec<(String, String)>>,

  /// Optional deduplication key for grouping related alerts.
  pub deduplication_key: Option<String>,
}

// ======================== Public response ========================

#[derive(Debug)]
pub struct CreateAlertSuccess {
  /// The Rootly alert ID.
  pub id: String,

  /// The short human-readable ID (e.g. "ALR-123").
  pub short_id: Option<String>,

  /// The status of the alert.
  pub status: Option<String>,

  /// The source of the alert.
  pub source: Option<String>,
}

// ======================== Implementation ========================

/// https://docs.rootly.com/api-reference/alerts/creates-an-alert
pub async fn create_alert(args: CreateAlertArgs) -> Result<CreateAlertSuccess, RootlyError> {
  let url = format!("{}/alerts", ROOTLY_API_BASE_URL);

  info!("Creating Rootly alert: source={}, summary={}", args.source, args.summary);

  let labels = args.labels.map(|pairs| {
    pairs.into_iter().map(|(key, value)| CreateAlertLabel { key, value }).collect()
  });

  let request_body = CreateAlertRequest {
    data: CreateAlertRequestData {
      data_type: "alerts",
      attributes: CreateAlertRequestAttributes {
        source: args.source,
        summary: args.summary,
        description: args.description,
        status: args.status,
        service_ids: args.service_ids,
        group_ids: args.group_ids,
        environment_ids: args.environment_ids,
        started_at: None,
        ended_at: None,
        external_id: args.external_id,
        external_url: args.external_url,
        alert_urgency_id: args.alert_urgency_id,
        notification_target_type: args.notification_target_type,
        notification_target_id: args.notification_target_id,
        labels,
        deduplication_key: args.deduplication_key,
      },
    },
  };

  let body_json = serde_json::to_string(&request_body)
    .map_err(|err| RootlyGenericApiError::SerdeResponseParseErrorWithBody(err, String::new()))?;

  info!("Rootly create alert URL: {}", url);
  info!("Rootly create alert body: {}", body_json);

  let client = reqwest::Client::builder()
    .build()
    .map_err(|err| RootlyClientError::ReqwestClientError(err))?;

  let bearer = format!("Bearer {}", args.api_key.api_key);

  // NB: Use .body() instead of .json() to preserve the Content-Type header.
  // .json() would override it with "application/json", but Rootly requires "application/vnd.api+json".
  let response = client.post(&url)
    .header("Authorization", bearer)
    .header("Content-Type", "application/vnd.api+json")
    .body(body_json)
    .send()
    .await
    .map_err(|err| RootlyGenericApiError::ReqwestError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| RootlyGenericApiError::ReqwestError(err))?;

  info!("Rootly create alert response: status={}, body={}", status, response_body);

  if !status.is_success() {
    return Err(RootlyGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  let parsed: CreateAlertResponse = serde_json::from_str(&response_body)
    .map_err(|err| RootlyGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  Ok(CreateAlertSuccess {
    id: parsed.data.id,
    short_id: parsed.data.attributes.short_id,
    status: parsed.data.attributes.status,
    source: parsed.data.attributes.source,
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_api_key::get_test_api_key;
  use errors::AnyhowResult;

  fn test_api_key() -> AnyhowResult<RootlyApiKey> {
    let key = get_test_api_key()?;
    Ok(RootlyApiKey::new(key))
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key
  async fn test_create_basic_alert() -> AnyhowResult<()> {
    let api_key = test_api_key()?;
    let result = create_alert(CreateAlertArgs {
      api_key,
      source: "artcraft-test".to_string(),
      summary: "Test alert from artcraft integration test".to_string(),
      description: Some("This is a test alert created by an automated test. Please ignore.".to_string()),
      status: None,
      service_ids: None,
      group_ids: None,
      environment_ids: None,
      external_id: None,
      external_url: None,
      alert_urgency_id: None,
      notification_target_type: None,
      notification_target_id: None,
      labels: None,
      deduplication_key: None,
    }).await?;

    println!("Alert ID: {}", result.id);
    println!("Short ID: {:?}", result.short_id);
    println!("Status: {:?}", result.status);
    println!("Source: {:?}", result.source);
    assert!(!result.id.is_empty());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key
  async fn test_create_alert_with_labels() -> AnyhowResult<()> {
    let api_key = test_api_key()?;
    let result = create_alert(CreateAlertArgs {
      api_key,
      source: "artcraft-test".to_string(),
      summary: "Test alert with labels".to_string(),
      description: Some("Testing label support.".to_string()),
      status: None,
      service_ids: None,
      group_ids: None,
      environment_ids: None,
      external_id: None,
      external_url: None,
      alert_urgency_id: None,
      notification_target_type: None,
      notification_target_id: None,
      labels: Some(vec![
        ("environment".to_string(), "test".to_string()),
        ("component".to_string(), "seedance2pro_job".to_string()),
      ]),
      deduplication_key: None,
    }).await?;

    println!("Alert ID: {}", result.id);
    println!("Short ID: {:?}", result.short_id);
    assert!(!result.id.is_empty());
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key
  async fn test_create_alert_with_dedup_key() -> AnyhowResult<()> {
    let api_key = test_api_key()?;
    let dedup_key = "artcraft-test-dedup-key-001".to_string();

    let result = create_alert(CreateAlertArgs {
      api_key,
      source: "artcraft-test".to_string(),
      summary: "Test alert with deduplication key".to_string(),
      description: None,
      status: None,
      service_ids: None,
      group_ids: None,
      environment_ids: None,
      external_id: Some("ext-test-123".to_string()),
      external_url: Some("https://artcraft.com/test".to_string()),
      alert_urgency_id: None,
      notification_target_type: None,
      notification_target_id: None,
      labels: None,
      deduplication_key: Some(dedup_key),
    }).await?;

    println!("Alert ID: {}", result.id);
    println!("Short ID: {:?}", result.short_id);
    assert!(!result.id.is_empty());
    Ok(())
  }

  /// WARNING: This test triggers a real page via the SRE escalation policy.
  /// Only run manually when you want to verify paging works end-to-end.
  #[tokio::test]
  #[ignore] // manually test — triggers a real page!
  async fn test_create_paging_sev1_alert() -> AnyhowResult<()> {
    let api_key = test_api_key()?;

    // IDs from our Rootly org (GET /v1/alert_urgencies, GET /v1/escalation_policies)
    let high_urgency_id = "62fde143-1258-4639-9ee6-1400ebf7308d"; // "High"
    let sre_escalation_policy_id = "d1f176a9-edb8-48f3-a2df-c505835498e5"; // "SRE (Site Reliability Engineering) Team"

    let result = create_alert(CreateAlertArgs {
      api_key,
      source: "artcraft".to_string(),
      summary: "[TEST] SEV-1: Critical production issue — paging test".to_string(),
      description: Some(
        "This is a test SEV-1 alert to verify paging works. \
         If you received this page, the Rootly integration is working correctly. \
         Please acknowledge and resolve.".to_string()
      ),
      status: Some("triggered".to_string()),
      service_ids: None,
      group_ids: None,
      environment_ids: None,
      external_id: None,
      external_url: None,
      alert_urgency_id: Some(high_urgency_id.to_string()),
      notification_target_type: Some("EscalationPolicy".to_string()),
      notification_target_id: Some(sre_escalation_policy_id.to_string()),
      labels: Some(vec![
        ("severity".to_string(), "sev-1".to_string()),
        ("environment".to_string(), "production".to_string()),
        ("test".to_string(), "true".to_string()),
      ]),
      deduplication_key: None,
    }).await?;

    println!("Alert ID: {}", result.id);
    println!("Short ID: {:?}", result.short_id);
    println!("Status: {:?}", result.status);
    println!("Source: {:?}", result.source);
    assert!(!result.id.is_empty());
    Ok(())
  }

  /// WARNING: This test triggers a real page directly to Brandon Thomas.
  /// Only run manually when you want to verify paging works end-to-end.
  #[tokio::test]
  #[ignore] // manually test — triggers a real page!
  async fn test_create_paging_sev1_alert_direct_user() -> AnyhowResult<()> {
    let api_key = test_api_key()?;

    // IDs from our Rootly org
    let high_urgency_id = "62fde143-1258-4639-9ee6-1400ebf7308d"; // "High"
    let brandon_user_id = "236693"; // Brandon Thomas

    let result = create_alert(CreateAlertArgs {
      api_key,
      source: "artcraft".to_string(),
      summary: "[TEST] SEV-1: Direct user page test".to_string(),
      description: Some(
        "This is a test SEV-1 alert sent directly to a user (not via escalation policy). \
         If you received this page, the Rootly direct-user paging works correctly. \
         Please acknowledge and resolve.".to_string()
      ),
      status: Some("triggered".to_string()),
      service_ids: None,
      group_ids: None,
      environment_ids: None,
      external_id: None,
      external_url: None,
      alert_urgency_id: Some(high_urgency_id.to_string()),
      notification_target_type: Some("User".to_string()),
      notification_target_id: Some(brandon_user_id.to_string()),
      labels: Some(vec![
        ("severity".to_string(), "sev-1".to_string()),
        ("environment".to_string(), "production".to_string()),
        ("test".to_string(), "true".to_string()),
      ]),
      deduplication_key: None,
    }).await?;

    println!("Alert ID: {}", result.id);
    println!("Short ID: {:?}", result.short_id);
    println!("Status: {:?}", result.status);
    println!("Source: {:?}", result.source);
    assert!(!result.id.is_empty());
    Ok(())
  }
}
