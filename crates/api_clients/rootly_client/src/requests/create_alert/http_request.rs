use serde_derive::{Deserialize, Serialize};

// ======================== Request ========================

#[derive(Serialize, Debug)]
pub (crate) struct CreateAlertRequest {
  pub data: CreateAlertRequestData,
}

#[derive(Serialize, Debug)]
pub (crate) struct CreateAlertRequestData {
  #[serde(rename = "type")]
  pub data_type: &'static str,
  pub attributes: CreateAlertRequestAttributes,
}

#[derive(Serialize, Debug)]
pub (crate) struct CreateAlertRequestAttributes {
  pub source: String,
  pub summary: String,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub description: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub status: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub service_ids: Option<Vec<String>>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub group_ids: Option<Vec<String>>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub environment_ids: Option<Vec<String>>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub started_at: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub ended_at: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub external_id: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub external_url: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub alert_urgency_id: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub notification_target_type: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub notification_target_id: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub labels: Option<Vec<CreateAlertLabel>>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub deduplication_key: Option<String>,
}

#[derive(Serialize, Debug)]
pub (crate) struct CreateAlertLabel {
  pub key: String,
  pub value: String,
}

// ======================== Response ========================

#[derive(Deserialize, Debug)]
pub (crate) struct CreateAlertResponse {
  pub data: CreateAlertResponseData,
}

#[derive(Deserialize, Debug)]
pub (crate) struct CreateAlertResponseData {
  pub id: String,

  #[serde(rename = "type")]
  pub data_type: String,

  pub attributes: CreateAlertResponseAttributes,
}

#[derive(Deserialize, Debug)]
pub (crate) struct CreateAlertResponseAttributes {
  pub short_id: Option<String>,
  pub source: Option<String>,
  pub summary: Option<String>,
  pub description: Option<String>,
  pub status: Option<String>,
  pub noise: Option<String>,
  pub created_at: Option<String>,
  pub updated_at: Option<String>,
  pub external_id: Option<String>,
  pub external_url: Option<String>,
  pub alert_urgency_id: Option<String>,
  pub deduplication_key: Option<String>,
  pub started_at: Option<String>,
  pub ended_at: Option<String>,
  pub service_ids: Option<Vec<String>>,
  pub group_ids: Option<Vec<String>>,
  pub environment_ids: Option<Vec<String>>,
  pub is_group_leader_alert: Option<bool>,
  pub group_leader_alert_id: Option<String>,
  pub labels: Option<Vec<CreateAlertResponseLabel>>,
}

#[derive(Deserialize, Debug)]
pub (crate) struct CreateAlertResponseLabel {
  pub key: Option<String>,
  pub value: Option<String>,
}
