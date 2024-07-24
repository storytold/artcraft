use std::time::Duration;

use log::info;

use cloud_storage::bucket_client::BucketClient;
use errors::AnyhowResult;

pub struct BucketClients {
  pub public: BucketClient,
  pub private: BucketClient,
}

pub fn get_bucket_clients() -> AnyhowResult<BucketClients> {
  let access_key = easyenv::get_env_string_required("ACCESS_KEY")?;
  let secret_key = easyenv::get_env_string_required("SECRET_KEY")?;
  let region_name = easyenv::get_env_string_required("REGION_NAME")?;
  let public_bucket_name = easyenv::get_env_string_required("PUBLIC_BUCKET_NAME")?;
  let private_bucket_name = easyenv::get_env_string_required("PRIVATE_BUCKET_NAME")?;
  let s3_compatible_endpoint_url = easyenv::get_env_string_or_default("S3_COMPATIBLE_ENDPOINT_URL", "https://storage.googleapis.com");

  // NB: Long timeout for dev rust builds to upload to cloud buckets.
  // Unoptimized binaries sometimes take a lot of time to upload, presumably due to unoptimized code.
  let bucket_timeout = easyenv::get_env_duration_seconds_or_default(
    "BUCKET_TIMEOUT_SECONDS", Duration::from_secs(60 * 10));

  info!("Configuring public GCS bucket...");

  let public_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &public_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  info!("Configuring private GCS bucket...");

  let private_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &private_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  Ok(BucketClients {
    public: public_bucket_client,
    private: private_bucket_client,
  })
}
