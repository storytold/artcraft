use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::warn;
use sqlx::{Error, MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::vocoder_models::VocoderModelToken;
use tokens::tokens::voice_conversion_models::VoiceConversionModelToken;

use crate::helpers::boolean_converters::{i8_to_bool, nullable_i8_to_optional_bool};

/// This is meant to be the entire table
#[derive(Debug)]
pub struct WholeVoiceConversionModelRecord {
  pub id: i64,
  pub token: VoiceConversionModelToken,

  pub model_type: VoiceConversionModelType,
  pub maybe_model_vocoder_token: Option<VocoderModelToken>,

  pub title: String,
  pub description_markdown: String,
  pub description_rendered_html: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub has_index_file: bool,

  pub is_front_page_featured: bool,

  pub original_download_url: Option<String>,
  pub original_filename: Option<String>,
  pub file_size_bytes: i32,

  pub creator_user_token: UserToken,

  pub ip_address_creation: String,
  pub ip_address_last_update: String,

  pub maybe_last_update_user_token: Option<UserToken>,

  pub creator_set_visibility: Visibility,

  pub private_bucket_hash: String,
  pub private_bucket_object_name: String,

  pub is_public_listing_approved: Option<bool>,
  pub is_locked_from_user_modification: bool,

  pub maybe_mod_comments: Option<String>,

  pub maybe_migration_new_model_weights_token: Option<ModelWeightToken>,

  pub version: i32,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}

pub async fn list_whole_voice_conversion_models_using_cursor(
  mysql_pool: &MySqlPool,
  page_size: u64,
  cursor: u64,
) -> AnyhowResult<Vec<WholeVoiceConversionModelRecord>> {
  let mut connection = mysql_pool.acquire().await?;

  let maybe_models
      = list_whole_voice_conversion_models(&mut connection, page_size, cursor)
        .await;

  let models : Vec<RawRecord> = match maybe_models {
    Ok(models) => models,
    Err(err) => {
      return match err {
        Error::RowNotFound => {
          Ok(Vec::new())
        },
        _ => {
          warn!("vc model list query error: {:?}", err);
          Err(anyhow!("vc model list query error"))
        }
      }
    }
  };

  Ok(models.into_iter()
    .map(|model| {
      WholeVoiceConversionModelRecord {
        id: model.id,
        token: model.token,
        model_type: model.model_type,
        maybe_model_vocoder_token: model.maybe_vocoder_token,
        title: model.title,
        description_markdown: model.description_markdown,
        description_rendered_html: model.description_rendered_html,
        ietf_language_tag: model.ietf_language_tag,
        ietf_primary_language_subtag: model.ietf_primary_language_subtag,
        has_index_file: i8_to_bool(model.has_index_file),
        is_front_page_featured: i8_to_bool(model.is_front_page_featured),
        original_download_url: model.original_download_url,
        original_filename: model.original_filename,
        file_size_bytes: model.file_size_bytes,
        creator_user_token: model.creator_user_token,
        ip_address_creation: model.ip_address_creation,
        ip_address_last_update: model.ip_address_last_update,
        maybe_last_update_user_token: model.maybe_last_update_user_token,
        creator_set_visibility: model.creator_set_visibility,
        private_bucket_hash: model.private_bucket_hash,
        private_bucket_object_name: model.private_bucket_object_name,
        is_public_listing_approved: nullable_i8_to_optional_bool(model.is_public_listing_approved),
        is_locked_from_user_modification: i8_to_bool(model.is_locked_from_user_modification),
        maybe_mod_comments: model.maybe_mod_comments,
        maybe_migration_new_model_weights_token: model.maybe_migration_new_model_weights_token,
        version: model.version,
        created_at: model.created_at,
        updated_at: model.updated_at,
        user_deleted_at: model.user_deleted_at,
        mod_deleted_at: model.mod_deleted_at,
      }
    })
    .collect::<Vec<WholeVoiceConversionModelRecord>>())
}

async fn list_whole_voice_conversion_models(
  mysql_connection: &mut PoolConnection<MySql>,
  page_size: u64,
  cursor: u64,
) -> Result<Vec<RawRecord>, Error> {
  Ok(sqlx::query_as!(
      RawRecord,
        r#"
SELECT
    id,
    token as `token: tokens::tokens::voice_conversion_models::VoiceConversionModelToken`,

    model_type as `model_type: enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType`,
    maybe_vocoder_token as `maybe_vocoder_token: tokens::tokens::vocoder_models::VocoderModelToken`,

    title,
    description_markdown,
    description_rendered_html,

    ietf_language_tag,
    ietf_primary_language_subtag,

    has_index_file,

    is_front_page_featured,

    original_download_url,
    original_filename,
    file_size_bytes,

    creator_user_token as `creator_user_token: tokens::tokens::users::UserToken`,

    ip_address_creation,
    ip_address_last_update,

    maybe_last_update_user_token as `maybe_last_update_user_token: tokens::tokens::users::UserToken`,

    creator_set_visibility as `creator_set_visibility: enums_db::common::visibility::Visibility`,

    private_bucket_hash,
    private_bucket_object_name,

    is_public_listing_approved,
    is_locked_from_user_modification,
    maybe_mod_comments,

    maybe_migration_new_model_weights_token as `maybe_migration_new_model_weights_token: tokens::tokens::model_weights::ModelWeightToken`,

    version,

    created_at,
    updated_at,

    user_deleted_at,
    mod_deleted_at

FROM voice_conversion_models
WHERE
  id > ?
ORDER BY id ASC
LIMIT ?
        "#,
      cursor,
      page_size
  )
      .fetch_all(&mut **mysql_connection)
      .await?)
}

struct RawRecord {
  pub id: i64,
  pub token: VoiceConversionModelToken,

  pub model_type: VoiceConversionModelType,
  pub maybe_vocoder_token: Option<VocoderModelToken>,

  pub title: String,
  pub description_markdown: String,
  pub description_rendered_html: String,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub has_index_file: i8, // bool

  pub is_front_page_featured: i8, // bool

  pub original_download_url: Option<String>,
  pub original_filename: Option<String>,
  pub file_size_bytes: i32,

  pub creator_user_token: UserToken,

  pub ip_address_creation: String,
  pub ip_address_last_update: String,

  pub maybe_last_update_user_token: Option<UserToken>,

  pub creator_set_visibility: Visibility,

  pub private_bucket_hash: String,
  pub private_bucket_object_name: String,

  pub is_public_listing_approved: Option<i8>, // bool
  pub is_locked_from_user_modification: i8, // bool

  pub maybe_mod_comments: Option<String>,

  pub maybe_migration_new_model_weights_token: Option<ModelWeightToken>,

  pub version: i32,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}
