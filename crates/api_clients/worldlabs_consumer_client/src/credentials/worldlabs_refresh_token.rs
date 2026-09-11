
#[derive(Clone)]
pub struct WorldLabsRefreshToken {
  /// The refresh token
  /// Used to get a new bearer token
  refresh_token: String,
}

impl WorldLabsRefreshToken {
  pub fn new(refresh_token: String) -> Self {
    Self { refresh_token }
  }

  pub fn as_raw_str(&self) -> &str {
    &self.refresh_token
  }

  pub fn as_raw_bytes(&self) -> &[u8] {
    self.refresh_token.as_bytes()
  }

  pub fn to_raw_string(&self) -> String {
    self.refresh_token.clone()
  }
}
