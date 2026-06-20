//! Optional setup for the Seedance video archive bucket.
//!
//! Reads the five `SEEDANCE_VIDEO_BUCKET_*` env vars. All must be present to
//! build a client; otherwise the client is `None` and archival uploads are
//! simply skipped. A *partial* configuration is treated as a misconfiguration
//! (warned, not built).

use std::env;

use bucket_client::{BucketClient, BucketClientBuilder};
use log::{info, warn};

/// Build the optional Seedance video bucket client from the environment.
pub fn setup_seedance_video_bucket() -> Option<BucketClient> {
  let bucket_name = read_non_empty_env("SEEDANCE_VIDEO_BUCKET_NAME");
  let region = read_non_empty_env("SEEDANCE_VIDEO_BUCKET_REGION");
  let endpoint = read_non_empty_env("SEEDANCE_VIDEO_BUCKET_ENDPOINT");
  let access_key = read_non_empty_env("SEEDANCE_VIDEO_BUCKET_ACCESS_KEY_ID");
  let secret_key = read_non_empty_env("SEEDANCE_VIDEO_BUCKET_SECRET_ACCESS_KEY");

  match (bucket_name, region, endpoint, access_key, secret_key) {
    (Some(bucket_name), Some(region), Some(endpoint), Some(access_key), Some(secret_key)) => {
      match BucketClientBuilder::new()
        .access_key(access_key)
        .secret_key(secret_key)
        .region_name(region)
        .bucket_name(&bucket_name)
        .endpoint(endpoint)
        .build()
      {
        Ok(client) => {
          info!("Seedance video bucket configured: {}", bucket_name);
          Some(client)
        }
        Err(err) => {
          warn!("Seedance video bucket env present but client setup failed: {}", err);
          None
        }
      }
    }
    (None, None, None, None, None) => {
      info!("Seedance video bucket not configured; archival uploads disabled.");
      None
    }
    _ => {
      warn!(
        "Seedance video bucket is only partially configured \
         (need all of SEEDANCE_VIDEO_BUCKET_NAME / _REGION / _ENDPOINT / \
         _ACCESS_KEY_ID / _SECRET_ACCESS_KEY); skipping setup."
      );
      None
    }
  }
}

/// Read an env var, treating unset or whitespace-only as absent.
fn read_non_empty_env(name: &str) -> Option<String> {
  match env::var(name) {
    Ok(value) if !value.trim().is_empty() => Some(value),
    _ => None,
  }
}
