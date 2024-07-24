use std::time::Duration;

use log::info;
use sqlx::mysql::MySqlPoolOptions;

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::bucket_client::BucketClient;
use config::shared_constants::{DEFAULT_MYSQL_CONNECTION_STRING, DEFAULT_RUST_LOG};
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use errors::{AnyhowResult, bail};
use filesys::file_read_bytes::file_read_bytes;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mysql_queries::queries::media_files::create::insert_media_file_from_cli_tool::{insert_media_file_from_cli_tool, InsertArgs};

use crate::cli_args::parse_cli_args;

pub mod cli_args;

#[tokio::main]
pub async fn main() -> AnyhowResult<()> {
  easyenv::init_all_with_default_logging(Some(DEFAULT_RUST_LOG));

  info!("Media file upload");

  // NB: Read secrets (eg. ACCESS_KEY)
  easyenv::from_filename(".env-secrets")?;

  let db_connection_string =
      easyenv::get_env_string_or_default(
        "MYSQL_URL",
        DEFAULT_MYSQL_CONNECTION_STRING);

  info!("Connecting to MySQL...");

  let pool = MySqlPoolOptions::new()
      .max_connections(easyenv::get_env_num("MYSQL_MAX_CONNECTIONS", 3)?)
      .connect(&db_connection_string)
      .await?;

  let access_key = easyenv::get_env_string_required("ACCESS_KEY")?;
  let secret_key = easyenv::get_env_string_required("SECRET_KEY")?;
  let region_name = easyenv::get_env_string_required("REGION_NAME")?;
  let public_bucket_name = easyenv::get_env_string_required("PUBLIC_BUCKET_NAME")?;

  let s3_compatible_endpoint_url = easyenv::get_env_string_or_default(
    "S3_COMPATIBLE_ENDPOINT_URL", "");
  let bucket_timeout = easyenv::get_env_duration_seconds_or_default(
    "BUCKET_TIMEOUT_SECONDS", Duration::from_secs(60 * 5));

  info!("Configuring GCS bucket...");

  let public_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &public_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  let args = parse_cli_args()?;

  info!("Reading file to upload: {:?} ...", args.file_path);

  let bytes = file_read_bytes(args.file_path)?;
  let mimetype = get_mimetype_for_bytes(&bytes);

  let media_file_type;
  let maybe_mime_type;
  let maybe_public_bucket_prefix;
  let maybe_public_bucket_extension;

  match mimetype {
    Some("audio/wav") |
    Some("audio/x-wav") => {
      media_file_type = MediaFileType::Video;
      maybe_mime_type = Some("audio/wav");
      maybe_public_bucket_prefix = Some("dev_upload_");
      maybe_public_bucket_extension = Some(".wav");

    }
    Some("video/mp4") => {
      media_file_type = MediaFileType::Video;
      maybe_mime_type = mimetype;
      maybe_public_bucket_prefix = Some("dev_upload_");
      maybe_public_bucket_extension = Some(".mp4");
    }
    Some("image/jpeg") => {
      media_file_type = MediaFileType::Image;
      maybe_mime_type = mimetype;
      maybe_public_bucket_prefix = Some("dev_upload_");
      maybe_public_bucket_extension = Some(".jpg");
    }
    Some("image/png") => {
      media_file_type = MediaFileType::Image;
      maybe_mime_type = mimetype;
      maybe_public_bucket_prefix = Some("dev_upload_");
      maybe_public_bucket_extension = Some(".png");
    }
    _ => {
      bail!("Invalid mime type: {:?}", mimetype);
    }
  }

  let mimetype = mimetype.unwrap_or("text/plain");

  let creator_set_visibility = Visibility::Public;

  let public_upload_path = MediaFileBucketPath::generate_new(
    maybe_public_bucket_prefix,
    maybe_public_bucket_extension);

  info!("Uploading media to bucket path: {}", public_upload_path.get_full_object_path_str());

  let _r = public_bucket_client.upload_file_with_content_type(
    public_upload_path.get_full_object_path_str(),
    bytes.as_ref(),
    mimetype)
      .await?;

  let (media_file_token, _id) = insert_media_file_from_cli_tool(InsertArgs {
    pool: &pool,
    maybe_use_apriori_media_token: None,
    media_file_type,
    maybe_mime_type,
    file_size_bytes: 0, // TODO
    sha256_checksum: "", // TODO
    maybe_origin_filename: None,
    maybe_creator_user_token: None,
    creator_set_visibility,
    public_bucket_directory_hash: public_upload_path.get_object_hash(),
    maybe_public_bucket_prefix,
    maybe_public_bucket_extension,
  }).await?;

  info!("New media file token: {:?}", media_file_token);

  let bucket_url = format!(
    "https://storage.cloud.google.com/{}{}",
    public_bucket_name,
    public_upload_path.get_full_object_path_str()
  );

  let gcp_url = format!(
    "https://console.cloud.google.com/storage/browser/_details/{}{}",
    public_bucket_name,
    public_upload_path.get_full_object_path_str()
  );

  println!("\n\n   ========== FILE INFO ==========\n\n");
  println!(" token: {}", media_file_token);
  println!(" URL: {}", bucket_url);
  println!(" GCP Admin: {}", gcp_url);
  println!("\n");

  Ok(())
}
