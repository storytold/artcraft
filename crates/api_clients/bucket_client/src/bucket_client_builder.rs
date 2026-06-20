use std::time::Duration;

use s3::creds::Credentials;
use s3::region::Region;
use s3::Bucket;

use crate::bucket_client::BucketClient;
use crate::bucket_client_error::BucketClientError;

/// Builder for [`BucketClient`].
///
/// `access_key`, `secret_key`, `region_name`, and `bucket_name` are required;
/// `endpoint` and `bucket_request_timeout` are optional.
///
/// - With an `endpoint` set, the bucket targets a custom S3-compatible host
///   (R2, GCS, MinIO, etc.) via `Region::Custom`, and uses path-style addressing
///   (subdomain-style for Google Cloud Storage).
/// - Without an `endpoint`, the `region_name` is parsed as an AWS region
///   (e.g. `"us-east-1"`), which determines the AWS endpoint automatically.
#[derive(Debug, Default, Clone)]
pub struct BucketClientBuilder {
  access_key: Option<String>,
  secret_key: Option<String>,
  region_name: Option<String>,
  bucket_name: Option<String>,
  endpoint: Option<String>,
  bucket_request_timeout: Option<Duration>,
}

impl BucketClientBuilder {
  pub fn new() -> Self {
    Self::default()
  }

  pub fn access_key(mut self, access_key: impl Into<String>) -> Self {
    self.access_key = Some(access_key.into());
    self
  }

  pub fn secret_key(mut self, secret_key: impl Into<String>) -> Self {
    self.secret_key = Some(secret_key.into());
    self
  }

  pub fn region_name(mut self, region_name: impl Into<String>) -> Self {
    self.region_name = Some(region_name.into());
    self
  }

  pub fn bucket_name(mut self, bucket_name: impl Into<String>) -> Self {
    self.bucket_name = Some(bucket_name.into());
    self
  }

  /// Optional custom S3-compatible endpoint (e.g. an R2/GCS/MinIO URL). When
  /// unset, an AWS endpoint is derived from `region_name`.
  pub fn endpoint(mut self, endpoint: impl Into<String>) -> Self {
    self.endpoint = Some(endpoint.into());
    self
  }

  pub fn bucket_request_timeout(mut self, timeout: Duration) -> Self {
    self.bucket_request_timeout = Some(timeout);
    self
  }

  /// Validate the configuration and construct a [`BucketClient`].
  pub fn build(self) -> Result<BucketClient, BucketClientError> {
    let access_key = require(self.access_key, "access_key")?;
    let secret_key = require(self.secret_key, "secret_key")?;
    let region_name = require(self.region_name, "region_name")?;
    let bucket_name = require(self.bucket_name, "bucket_name")?;

    let credentials = Credentials {
      access_key: Some(access_key),
      secret_key: Some(secret_key),
      security_token: None,
      session_token: None,
      expiration: None,
    };

    // A custom endpoint targets an S3-compatible host via `Region::Custom`;
    // otherwise the region name is parsed as a standard AWS region.
    let region = match self.endpoint.as_deref() {
      Some(endpoint) => Region::Custom {
        region: region_name.clone(),
        endpoint: endpoint.to_string(),
      },
      None => region_name.parse().map_err(|err| {
        BucketClientError::ClientBuilderSetupError(format!(
          "invalid region {region_name:?}: {err:?}"
        ))
      })?,
    };

    let mut bucket = Bucket::new(&bucket_name, region, credentials)?;
    bucket.set_request_timeout(self.bucket_request_timeout);

    // Addressing style only matters for custom endpoints: Google Cloud Storage
    // needs subdomain (virtual-hosted) style; other S3-compatible stores use
    // path style. AWS uses the crate default (virtual-hosted).
    if let Some(endpoint) = self.endpoint.as_deref() {
      if endpoint == "https://storage.googleapis.com" {
        bucket.set_subdomain_style();
      } else {
        bucket.set_path_style();
      }
    }

    Ok(BucketClient::from_bucket(*bucket))
  }
}

/// Resolve a required builder field, or report which one was missing.
fn require(value: Option<String>, field: &str) -> Result<String, BucketClientError> {
  value.ok_or_else(|| {
    BucketClientError::ClientBuilderSetupError(format!("{field} is required"))
  })
}
