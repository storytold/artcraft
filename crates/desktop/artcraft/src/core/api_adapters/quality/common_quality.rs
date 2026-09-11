use serde_derive::{Deserialize, Serialize};
use artcraft_router::api::router_quality::RouterQuality;

/// Just cargo culting this. might not be necessary for standalone types anymore
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommonQuality {
  High,
  Medium,
  Low,
}

impl CommonQuality {
  pub fn to_artcraft_router_type(&self) -> RouterQuality {
    match self {
      CommonQuality::High => RouterQuality::High,
      CommonQuality::Medium => RouterQuality::Medium,
      CommonQuality::Low => RouterQuality::Low,
    }
  } 
}
