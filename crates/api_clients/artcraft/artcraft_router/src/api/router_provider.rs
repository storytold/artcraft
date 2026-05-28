use serde_derive::{Deserialize, Serialize};

/// The provider to route a generation request to.
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RouterProvider {
  Artcraft,
  Fal,
  GmiCloud,
  GrokApi,
  Seedance2Pro,
}
