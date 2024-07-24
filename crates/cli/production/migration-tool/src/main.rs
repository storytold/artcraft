//! migration-tool
//!
//! Migrate database records.
//!

use std::time::Duration;

use log::info;
use sqlx::{MySql, Pool};
use sqlx::mysql::MySqlPoolOptions;

use cloud_storage::bucket_client::BucketClient;
use config::shared_constants::DEFAULT_RUST_LOG;
use errors::AnyhowResult;

use crate::cli_args::{Action, parse_cli_args};
use crate::deps::Deps;
use crate::migrations::tts_models_to_weights::migrate::migrate_tts_to_weights;
use crate::migrations::voice_conversion_to_weights::migrate::migrate_voice_conversion_to_weights;

pub mod cli_args;
pub mod deps;
pub mod migrations;

#[tokio::main]
pub async fn main() -> AnyhowResult<()> {
  println!("migration-tool: migrate database records");

  easyenv::init_all_with_default_logging(Some(DEFAULT_RUST_LOG));

  // NB: This secrets file differs from the rest because we might actually want to cross
  // development/production boundaries for migration. We don't want to pull in secrets
  // from other sources. (Hopefully this isn't getting out of hand at this point.)
  easyenv::from_filename(".env-migration-tool-secrets")?;

  let deps = Deps {
    mysql_development: get_mysql("MYSQL_DEVELOPMENT_URL").await?,
    mysql_production: get_mysql("MYSQL_PRODUCTION_URL").await?,

    bucket_development_public: get_bucket_client("DEVELOPMENT_PUBLIC")?,
    bucket_development_private: get_bucket_client("DEVELOPMENT_PRIVATE")?,
    bucket_production_public: get_bucket_client("PRODUCTION_PUBLIC")?,
    bucket_production_private: get_bucket_client("PRODUCTION_PRIVATE")?,
  };

  let args = parse_cli_args()?;

  match args.action {
    Action::MigrateVoiceConversion => {
      migrate_voice_conversion_to_weights(&deps).await?;
    }
    Action::MigrateTts => {
      migrate_tts_to_weights(&deps).await?;
    }
  }

  Ok(())
}

async fn get_mysql(env_var_name: &str) -> AnyhowResult<Pool<MySql>> {
  info!("Connecting to MySQL {env_var_name}...");

  let pool = MySqlPoolOptions::new()
      .max_connections(easyenv::get_env_num("MYSQL_MAX_CONNECTIONS", 3)?)
      .connect(&easyenv::get_env_string_required(env_var_name)?)
      .await?;

  Ok(pool)
}

pub fn get_bucket_client(env_var_suffix: &str) -> AnyhowResult<BucketClient> {
  let env_var_suffix = env_var_suffix.to_uppercase();
  let access_key = easyenv::get_env_string_required(&format!("ACCESS_KEY_{env_var_suffix}"))?;
  let secret_key = easyenv::get_env_string_required(&format!("SECRET_KEY_{env_var_suffix}"))?;
  let region_name = easyenv::get_env_string_required(&format!("REGION_NAME_{env_var_suffix}"))?;
  let bucket_name = easyenv::get_env_string_required(&format!("BUCKET_NAME_{env_var_suffix}"))?;

  let s3_compatible_endpoint_url = easyenv::get_env_string_or_default(
    &format!("S3_COMPATIBLE_ENDPOINT_URL_{env_var_suffix}"), "https://storage.googleapis.com");
  // NB: Long timeout for dev rust builds to upload to cloud buckets.
  // Unoptimized binaries sometimes take a lot of time to upload, presumably due to unoptimized code.
  let bucket_timeout = easyenv::get_env_duration_seconds_or_default(
    "BUCKET_TIMEOUT_SECONDS", Duration::from_secs(60 * 10));

  info!("Configuring GCS bucket {env_var_suffix} ...");

  Ok(BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?)
}
