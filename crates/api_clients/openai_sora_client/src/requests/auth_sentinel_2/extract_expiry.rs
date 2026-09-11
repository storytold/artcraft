use crate::requests::auth_sentinel_2::response::SentinelResponse;
use chrono::{DateTime, TimeDelta, Utc};
use log::{info, warn};
use std::f32::consts::E;

// Sora's servers typically tell us to expire in nine minutes (540 seconds).
const DEFAULT_EXPIRE_SECONDS : u32 = 60 * 3; // 3 minutes.

pub (super) struct ExtractedExpiry {
  pub (super) generated_at: DateTime<Utc>,
  pub (super) expires_in_seconds: u32,
}

pub (super) fn extract_expiry(generated_at: DateTime<Utc>, response: &SentinelResponse) -> ExtractedExpiry {
  info!("Sentinel expires at: {:?} (in {:?} seconds)", response.expire_at, response.expire_after);

  const LOWER_BOUNDS_SECONDS: u32 = 60;
  const UPPER_BOUNDS_SECONDS: u32 = 60 * 60;

  // Trust the `expire_at` timestamp first.
  let mut maybe_expires_at = response.expire_at
      .map(|timestamp| DateTime::from_timestamp(timestamp as i64, 0))
      .flatten();

  if let Some(expires_at) = maybe_expires_at {
    let seconds = expires_at.signed_duration_since(generated_at).num_seconds();

    const LOWER_BOUNDS_SECONDS_I64: i64 = LOWER_BOUNDS_SECONDS as i64;
    const UPPER_BOUNDS_SECONDS_I64: i64 = UPPER_BOUNDS_SECONDS as i64;

    if seconds.is_positive()
        && seconds > LOWER_BOUNDS_SECONDS_I64
        && seconds < UPPER_BOUNDS_SECONDS_I64
    {
      info!("Using sentinel expire_at timestamp, expires in {} seconds (at {})", seconds, expires_at);

      return ExtractedExpiry {
        generated_at,
        expires_in_seconds: seconds as u32,
      }
    }
  }

  let mut expires_in_seconds = response.expire_after
      .unwrap_or_else(|| {
        warn!("No default expire_after from sentinel response, defaulting to {} seconds", DEFAULT_EXPIRE_SECONDS);
        DEFAULT_EXPIRE_SECONDS
      });

  if expires_in_seconds < LOWER_BOUNDS_SECONDS {
    warn!("Warning: sentinel token expires very soon: {} seconds, defaulting to {} seconds", expires_in_seconds, DEFAULT_EXPIRE_SECONDS);
    expires_in_seconds = DEFAULT_EXPIRE_SECONDS;
  } else if expires_in_seconds > UPPER_BOUNDS_SECONDS {
    warn!("Warning: sentinel token expires very late: {} seconds, defaulting to {} seconds", expires_in_seconds, DEFAULT_EXPIRE_SECONDS);
    expires_in_seconds = DEFAULT_EXPIRE_SECONDS;
  }

  ExtractedExpiry {
    generated_at,
    expires_in_seconds,
  }
}
