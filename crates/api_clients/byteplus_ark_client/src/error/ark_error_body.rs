use serde_derive::Deserialize;

/// The `error` object ModelArk uses in error responses, failed video tasks and failed
/// individual images: `{"code": "...", "message": "..."}`.
#[derive(Clone, Debug, Default, Deserialize, PartialEq)]
pub struct ArkErrorBody {
  pub code: Option<String>,
  pub message: Option<String>,
}
