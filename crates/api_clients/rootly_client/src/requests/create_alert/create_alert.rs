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

  /// Optional alert urgency ID.
  pub alert_urgency_id: Option<String>,

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
        notification_target_type: None,
        notification_target_id: None,
        labels,
        deduplication_key: args.deduplication_key,
      },
    },
  };

  let client = reqwest::Client::builder()
    .build()
    .map_err(|err| RootlyClientError::ReqwestClientError(err))?;

  let response = client.post(&url)
    .header("Authorization", format!("Bearer {}", args.api_key.api_key))
    .header("Content-Type", "application/vnd.api+json")
    .json(&request_body)
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
      labels: None,
      deduplication_key: Some(dedup_key),
    }).await?;

    println!("Alert ID: {}", result.id);
    println!("Short ID: {:?}", result.short_id);
    assert!(!result.id.is_empty());
    Ok(())
  }
}
