use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

pub const MODERATION_SEND_ALERT_PATH: &str = "/v1/moderation/alerts/send";

#[derive(Deserialize, ToSchema)]
pub struct ModerationSendAlertRequest {
  /// Optional title for the alert. Defaults to "Test Moderation Alert".
  pub title: Option<String>,

  /// Optional description for the alert. Defaults to "This is a test moderation alert."
  pub description: Option<String>,

  /// Optional urgency of the page.
  pub urgency: Option<ModerationSendAlertUrgency>,
}

#[derive(Deserialize, ToSchema, Copy, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum ModerationSendAlertUrgency {
  High,
  Medium,
  Low,
}

#[derive(Serialize, ToSchema)]
pub struct ModerationSendAlertResponse {
  pub success: bool,
}
