use sqlx::{MySql, Pool};

use cloud_storage::legacy_bucket_client::LegacyBucketClient;

pub struct Deps {
  pub mysql_development : Pool<MySql>,
  pub mysql_production : Pool<MySql>,

  pub bucket_development_public: LegacyBucketClient,
  pub bucket_development_private: LegacyBucketClient,

  pub bucket_production_public: LegacyBucketClient,
  pub bucket_production_private: LegacyBucketClient,
}
