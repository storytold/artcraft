
#[derive(Clone)]
pub struct HttpUserSessionPayload {
  /// The database primary key for the session instance.
  pub session_token: String,

  /// The primary key identifier of the user.
  /// Version 1 cookies do not have a user token, hence it is optional.
  pub maybe_user_token: Option<String>,
}
