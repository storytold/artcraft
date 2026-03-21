use anyhow::anyhow;
use log::error;
use sqlx;
use sqlx::MySqlPool;

use enums_db::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums_db::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums_db::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

pub struct InsertArgs<'a> {
  pub pool: &'a MySqlPool,

  /// If supplied, use this media token rather than generating a new one.
  /// This is good to support idempotency in development and testing.
  pub maybe_use_apriori_media_token: Option<&'a MediaFileToken>,

  pub media_file_type: MediaFileType,
  pub maybe_mime_type: Option<&'a str>,
  pub file_size_bytes: u64,
  pub sha256_checksum: &'a str,

  pub maybe_origin_filename: Option<&'a str>,

  pub maybe_creator_user_token: Option<&'a UserToken>,
  pub creator_set_visibility: Visibility,

  pub public_bucket_directory_hash: &'a str,
  pub maybe_public_bucket_prefix: Option<&'a str>,
  pub maybe_public_bucket_extension: Option<&'a str>,
}

// NB: Do not use from website / jobs. This is meant to be used from the CLI tool,
// and shoudl allow for a more free-form interface.
pub async fn insert_media_file_from_cli_tool(
  args: InsertArgs<'_>
) -> AnyhowResult<(MediaFileToken, u64)>
{
  let media_file_token = args.maybe_use_apriori_media_token
      .map(|token| token.clone())
      .unwrap_or_else(|| MediaFileToken::generate());

  let mut transaction = args.pool.begin().await?;

  const ORIGIN_CATEGORY : MediaFileOriginCategory = MediaFileOriginCategory::Upload;
  const ORIGIN_PRODUCT_CATEGORY : MediaFileOriginProductCategory = MediaFileOriginProductCategory::Unknown;

  // TODO(bt,2023-10-19): UserToken should automatically serialize to the DB. What's going on?
  let maybe_user_token = args.maybe_creator_user_token.map(|u| u.to_string());

  let record_id = {
    let query_result = sqlx::query!(
        r#"
INSERT INTO media_files
SET
  token = ?,

  origin_category = ?,
  origin_product_category = ?,

  media_type = ?,
  maybe_mime_type = ?,
  file_size_bytes = ?,
  checksum_sha2 = ?,

  maybe_origin_filename = ?,

  public_bucket_directory_hash = ?,
  maybe_public_bucket_prefix = ?,
  maybe_public_bucket_extension = ?,

  maybe_creator_user_token = ?,
  creator_ip_address = ?,

  creator_set_visibility = ?
        "#,
      media_file_token,

      ORIGIN_CATEGORY,
      ORIGIN_PRODUCT_CATEGORY,

      args.media_file_type,
      args.maybe_mime_type,
      args.file_size_bytes,
      args.sha256_checksum,

      args.maybe_origin_filename,

      args.public_bucket_directory_hash,
      args.maybe_public_bucket_prefix,
      args.maybe_public_bucket_extension,

      maybe_user_token,
      "127.0.0.1",

      args.creator_set_visibility.to_str(),
    )
        .execute(&mut *transaction)
        .await;

    let record_id = match query_result {
      Ok(res) => {
        res.last_insert_id()
      },
      Err(err) => {
        // TODO: handle better
        //transaction.rollback().await?;
        error!("Error executing query: {:?}", err);
        return Err(anyhow!("Mysql error: {:?}", err));
      }
    };

    record_id
  };

  transaction.commit().await?;

  Ok((media_file_token, record_id))
}
