use crate::error::sora_client_error::SoraClientError;
use chrono::{DateTime, TimeDelta, Utc};
use log::{error, warn};
use serde_derive::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SoraSentinelToken {
  /// The token sent over the wire.
  /// (The other fields in this struct are metadata.)
  pub token: RawSoraSentinelToken,

  /// User agent used to get the token.
  pub browser_user_agent: String,

  /// Clientside time when it was generated (client-side).
  pub generated_at: DateTime<Utc>,

  /// Seconds of validity (reported by the server, or our best guess).
  /// If the server doesn't tell us, we'll fill it in with our best guess.
  pub expires_in_seconds: u32,
}

/// This is what is sent over the wire in requests.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RawSoraSentinelToken {
  /// "Proof of Work" token (we generated this clientside)
  #[serde(rename = "p")]
  pub p: String,

  /// Random UUID (we generated this clientside)
  #[serde(rename = "id")]
  pub id: String,

  /// Frontend UI flow (this is the website flow used)
  #[serde(rename = "flow")]
  pub flow: String,

  /// Turnstile dx from the response.
  /// response["turnstile"]["dx"]
  #[serde(rename = "t")]
  pub t: String,

  /// Token from the response.
  /// response["token"]
  #[serde(rename = "c")]
  pub c: String,
}

impl SoraSentinelToken {
  /// Check to see if the sentinel token is expired and in need of a refresh.
  pub fn is_expired(&self) -> bool {
    let now = Utc::now();

    let maybe_expires_at = self.generated_at
        .checked_add_signed(TimeDelta::seconds(self.expires_in_seconds as i64));

    let expires_at = match maybe_expires_at {
      Some(expires_at) => expires_at,
      None => {
        error!("Could not compute expires_at for sentinel token!");
        return false;
      }
    };

    if now >= expires_at {
      return true;
    }

    if expires_at.signed_duration_since(now).num_seconds() < 30 {
      warn!("Less than 30 seconds remaining on sentinel token, treating as expired.");
      return true;
    }

    false
  }

  /// Convert to JSON, which is the raw over-the-wire format Sora consumes.
  pub fn to_request_header_json(&self) -> Result<String, SoraClientError> {
    self.token.to_request_header_json()
  }

  pub fn to_persistent_storage_json(&self) -> Result<String, SoraClientError> {
    serde_json::to_string(self)
        .map_err(|err| SoraClientError::CouldNotSerializeSentinelTokenStore(err))
  }

  pub fn from_persistent_storage_json(json: &str) -> Result<Self, SoraClientError> {
    serde_json::from_str(json)
        .map_err(|err| SoraClientError::CouldNotDeserializeSentinelTokenStore { error: err, raw_json: json.to_owned() })
  }
}

impl RawSoraSentinelToken {
  /// Convert to JSON, which is the raw over-the-wire format Sora consumes.
  pub fn to_request_header_json(&self) -> Result<String, SoraClientError> {
    serde_json::to_string(self)
        .map_err(|err| SoraClientError::CouldNotSerializeSentinelToken(err))
  }
}
