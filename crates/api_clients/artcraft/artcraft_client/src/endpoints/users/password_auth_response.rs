use serde::Deserialize;

// No Debug: the response contains a bearer credential.
#[derive(Deserialize)]
pub struct PasswordAuthResponse {
  pub success: bool,
  pub signed_session: Option<String>,
}
