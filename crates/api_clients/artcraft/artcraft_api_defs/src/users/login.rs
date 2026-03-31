use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Deserialize, ToSchema)]
pub struct LoginRequest {
  pub username_or_email: String,
  pub password: String,
}

#[derive(Serialize, ToSchema)]
pub struct LoginSuccessResponse {
  pub success: bool,

  /// A signed session that can be sent as a header, bypassing cookies.
  /// This is useful for API clients that don't support cookies or Google
  /// browsers killing cross-domain cookies.
  pub signed_session: String,
}

#[derive(Copy, Clone, Debug, Serialize, ToSchema)]
pub enum LoginErrorType {
  /// Account was created without a password and the user needs to create one
  AccountNeedsPassword,
  /// Invalid login credentials were supplied
  InvalidCredentials,
  ServerError,
}
