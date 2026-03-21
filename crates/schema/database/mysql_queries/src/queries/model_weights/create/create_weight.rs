use log::warn;
use sqlx::MySqlPool;

use enums_db::by_table::model_weights::weights_category::WeightsCategory;
use enums_db::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::{model_weights::ModelWeightToken, users::UserToken};
use tokens::tokens::media_files::MediaFileToken;

pub struct CreateModelWeightsArgs<'a> {
    pub token: &'a ModelWeightToken,
    pub weights_type: WeightsType,
    pub weights_category: WeightsCategory,
    pub title: String,
    pub maybe_cover_image_media_file_token: Option<MediaFileToken>,
    pub maybe_description_markdown: Option<String>,
    pub maybe_description_rendered_html: Option<String>,
    pub creator_user_token: Option<&'a UserToken>,
    pub creator_ip_address: &'a str,
    pub creator_set_visibility: Visibility,
    pub maybe_last_update_user_token: Option<String>,
    pub original_download_url: Option<String>,
    pub original_filename: Option<String>,
    pub file_size_bytes: u64,
    pub file_checksum_sha2: String,
    pub public_bucket_hash: String,
    pub maybe_public_bucket_prefix: Option<String>,
    pub maybe_public_bucket_extension: Option<String>,
    pub version: u32,
    pub mysql_pool: &'a MySqlPool,
}

pub async fn create_weight(args: CreateModelWeightsArgs<'_>) -> AnyhowResult<ModelWeightToken> {
    
    let transaction = args.mysql_pool.begin().await?;
    let query_result = sqlx
        ::query!(
            r#"
        INSERT INTO model_weights
        SET
          token = ?,
          weights_type = ?,
          weights_category = ?,
          title = ?,
          maybe_cover_image_media_file_token = ?,
          maybe_description_markdown = ?,
          maybe_description_rendered_html = ?,
          creator_user_token = ?,
          creator_ip_address = ?,
          creator_set_visibility = ?,
          maybe_last_update_user_token = ?,
          original_download_url = ?,
          original_filename = ?,
          file_size_bytes = ?,
          file_checksum_sha2 = ?,
          public_bucket_hash = ?,
          maybe_public_bucket_prefix = ?,
          maybe_public_bucket_extension = ?,
          version = ?
        "#,
            args.token.as_str(),
            args.weights_type.to_str(),
            args.weights_category.to_str(),
            args.title,
            args.maybe_cover_image_media_file_token.as_ref().map(|s| s.as_str()),
            args.maybe_description_markdown,
            args.maybe_description_rendered_html,
            args.creator_user_token.as_deref(),
            args.creator_ip_address,
            args.creator_set_visibility.to_str(),
            args.maybe_last_update_user_token,
            args.original_download_url,
            args.original_filename,
            args.file_size_bytes,
            args.file_checksum_sha2,
            args.public_bucket_hash,
            args.maybe_public_bucket_prefix,
            args.maybe_public_bucket_extension,
            args.version
        )
        .execute(args.mysql_pool).await;

    match query_result {
        Ok(_) => { Ok(args.token.clone()) }
        Err(err) => {
            transaction.rollback().await?;
            warn!("Transaction failure: {:?}", err);
            Err(err.into())
        }
    }
}
