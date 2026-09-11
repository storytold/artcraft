
/// This is meant to track 401s and other credential failures, not 500s.
#[derive(Clone)]
pub struct SoraCredentialStats {
  pub last_credential_failure: Option<chrono::DateTime<chrono::Utc>>,
  pub last_credential_success: Option<chrono::DateTime<chrono::Utc>>,
  pub credential_success_count: u32,
  pub credential_failure_count: u32,
  /// This resets on each failure
  pub last_consecutive_credential_success: Option<chrono::DateTime<chrono::Utc>>,
  /// This resets on each failure
  pub consecutive_credential_success_count: u32,
  /// This resets on each success
  pub consecutive_credential_failure_count: u32,
}

impl SoraCredentialStats {
  pub fn new() -> Self {
    Self {
      last_credential_failure: None,
      last_credential_success: None,
      last_consecutive_credential_success: None,
      credential_success_count: 0,
      credential_failure_count: 0,
      consecutive_credential_success_count: 0,
      consecutive_credential_failure_count: 0,
    }
  }
  
  pub fn record_credential_success(&mut self) {
    let now = chrono::Utc::now();
    self.last_credential_success = Some(now);
    self.last_consecutive_credential_success = Some(now);
    self.credential_success_count += 1;
    self.consecutive_credential_success_count += 1;
    self.consecutive_credential_failure_count = 0;
  }

  pub fn record_credential_failure(&mut self) {
    let now = chrono::Utc::now();
    self.last_credential_failure = Some(now);
    self.last_consecutive_credential_success = None;
    self.credential_failure_count += 1;
    self.consecutive_credential_failure_count += 1;
    self.consecutive_credential_success_count = 0;
  }
}
