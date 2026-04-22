use serde_derive::{Deserialize, Serialize};
use artcraft_router::api::common_quality::CommonQuality as RouterCommonQuality;

/// Just cargo culting this. might not be necessary for standalone types anymore
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommonQuality {
  High,
  Medium,
  Low,
}

impl CommonQuality {
  pub fn to_artcraft_router_type(&self) -> RouterCommonQuality {
    match self {
      CommonQuality::High => RouterCommonQuality::High,
      CommonQuality::Medium => RouterCommonQuality::Medium,
      CommonQuality::Low => RouterCommonQuality::Low,
    }
  } 
}
