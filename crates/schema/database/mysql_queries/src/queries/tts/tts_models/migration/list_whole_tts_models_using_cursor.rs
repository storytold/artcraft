use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::warn;
use sqlx::{Error, MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use enums_db::by_table::tts_models::tts_model_type::TtsModelType;
use enums::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::users::UserToken;
use tokens::tokens::vocoder_models::VocoderModelToken;

use crate::helpers::boolean_converters::{i8_to_bool, nullable_i8_to_optional_bool};

/// This is meant to be the entire table
#[derive(Debug)]
pub struct WholeTtsModelRecord {
  pub id: i64,
  pub token: TtsModelToken,

  pub tts_model_type: TtsModelType,
  pub text_pipeline_type: Option<String>,

  pub has_self_contained_vocoder: bool,
  pub has_self_contained_duration_model: bool,
  pub has_self_contained_pitch_model: bool,

  pub text_preprocessing_algorithm: Option<String>,

  // Weird mel multiplication hack
  pub use_default_mel_multiply_factor: bool,
  pub maybe_custom_mel_multiply_factor: Option<f64>, // 10

  // Vocoder
  pub maybe_default_pretrained_vocoder: Option<String>,
  pub maybe_custom_vocoder_token: Option<VocoderModelToken>,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub title: String,
  pub description_markdown: String,
  pub description_rendered_html: String,

  pub voice_name: Option<String>,
  pub actor_name: Option<String>,
  pub characteristic: Option<String>, // 20
  pub version_string: Option<String>,

  pub is_front_page_featured: bool,
  pub is_twitch_featured: bool,

  pub maybe_suggested_unique_bot_command: Option<String>,

  pub original_download_url: Option<String>,
  pub original_filename: Option<String>,
  pub file_size_bytes: i32,

  pub creator_user_token: UserToken,

  pub creator_ip_address_creation: String,
  pub creator_ip_address_last_update: String, // 30

  pub creator_set_visibility: Visibility,

  pub private_bucket_hash: String,
  pub private_bucket_object_name: String,

  pub private_bucket_object_is_archive: bool,

  pub user_ratings_total_count: u32,
  pub user_ratings_positive_count: u32,
  pub user_ratings_negative_count: u32,

  pub is_public_listing_approved: Option<bool>,
  pub is_locked_from_user_modification: bool,
  pub is_locked_from_use: bool, // 40

  pub maybe_mod_comments: Option<String>,
  pub maybe_mod_user_token: Option<UserToken>,

  pub maybe_migration_new_model_weights_token: Option<ModelWeightToken>,

  pub version: i32,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>, // 48 fields total
}

pub async fn list_whole_tts_models_using_cursor(
  mysql_pool: &MySqlPool,
  page_size: u64,
  cursor: u64,
) -> AnyhowResult<Vec<WholeTtsModelRecord>> {
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
      WholeTtsModelRecord {
        id: model.id,
        token: model.token,
        tts_model_type: model.tts_model_type,
        text_pipeline_type: model.text_pipeline_type,
        has_self_contained_vocoder: i8_to_bool(model.has_self_contained_vocoder),
        has_self_contained_duration_model: i8_to_bool(model.has_self_contained_duration_model),
        has_self_contained_pitch_model: i8_to_bool(model.has_self_contained_pitch_model),
        text_preprocessing_algorithm: model.text_preprocessing_algorithm,
        use_default_mel_multiply_factor: i8_to_bool(model.use_default_mel_multiply_factor),
        maybe_custom_mel_multiply_factor: model.maybe_custom_mel_multiply_factor,
        maybe_default_pretrained_vocoder: model.maybe_default_pretrained_vocoder,
        title: model.title,
        description_markdown: model.description_markdown,
        description_rendered_html: model.description_rendered_html,
        voice_name: model.voice_name,
        actor_name: model.actor_name,
        characteristic: model.characteristic,
        ietf_language_tag: model.ietf_language_tag,
        ietf_primary_language_subtag: model.ietf_primary_language_subtag,
        is_front_page_featured: i8_to_bool(model.is_front_page_featured),
        is_twitch_featured: i8_to_bool(model.is_twitch_featured),
        maybe_suggested_unique_bot_command: model.maybe_suggested_unique_bot_command,
        original_download_url: model.original_download_url,
        original_filename: model.original_filename,
        file_size_bytes: model.file_size_bytes,
        creator_user_token: model.creator_user_token,
        creator_ip_address_creation: model.creator_ip_address_creation,
        creator_ip_address_last_update: model.creator_ip_address_last_update,
        creator_set_visibility: model.creator_set_visibility,
        private_bucket_hash: model.private_bucket_hash,
        private_bucket_object_name: model.private_bucket_object_name,
        private_bucket_object_is_archive: i8_to_bool(model.private_bucket_object_is_archive),
        user_ratings_total_count: model.user_ratings_total_count,
        user_ratings_positive_count: model.user_ratings_positive_count,
        user_ratings_negative_count: model.user_ratings_negative_count,
        is_public_listing_approved: nullable_i8_to_optional_bool(model.is_public_listing_approved),
        is_locked_from_user_modification: i8_to_bool(model.is_locked_from_user_modification),
        is_locked_from_use: i8_to_bool(model.is_locked_from_use),
        maybe_mod_comments: model.maybe_mod_comments,
        maybe_mod_user_token: model.maybe_mod_user_token,
        maybe_migration_new_model_weights_token: model.maybe_migration_new_model_weights_token,
        version: model.version,
        created_at: model.created_at,
        updated_at: model.updated_at,
        user_deleted_at: model.user_deleted_at,
        mod_deleted_at: model.mod_deleted_at,
        maybe_custom_vocoder_token: model.maybe_custom_vocoder_token,
        version_string: model.version_string
      }
    })
    .collect::<Vec<WholeTtsModelRecord>>())
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
    token as `token: tokens::tokens::tts_models::TtsModelToken`,

    tts_model_type as `tts_model_type: enums_db::by_table::tts_models::tts_model_type::TtsModelType`,

    text_pipeline_type,
    has_self_contained_vocoder,
    has_self_contained_duration_model,
    has_self_contained_pitch_model,
    text_preprocessing_algorithm,

    use_default_mel_multiply_factor,
    maybe_custom_mel_multiply_factor,
    maybe_default_pretrained_vocoder,
    maybe_custom_vocoder_token as `maybe_custom_vocoder_token: tokens::tokens::vocoder_models::VocoderModelToken`,

    ietf_language_tag,
    ietf_primary_language_subtag,

    title,
    description_markdown,
    description_rendered_html,

    voice_name,
    actor_name,
    characteristic,
    version_string,

    is_front_page_featured,
    is_twitch_featured,

    maybe_suggested_unique_bot_command,

    original_download_url,
    original_filename,
    file_size_bytes,

    creator_user_token as `creator_user_token: tokens::tokens::users::UserToken`,

    creator_ip_address_creation,
    creator_ip_address_last_update,

    creator_set_visibility as `creator_set_visibility: enums::common::visibility::Visibility`,

    private_bucket_hash,
    private_bucket_object_name,

    private_bucket_object_is_archive,

    user_ratings_total_count,
    user_ratings_positive_count,
    user_ratings_negative_count,

    is_public_listing_approved,
    is_locked_from_user_modification,
    is_locked_from_use,

    maybe_mod_comments,
    maybe_mod_user_token as `maybe_mod_user_token: tokens::tokens::users::UserToken`,

    maybe_migration_new_model_weights_token as `maybe_migration_new_model_weights_token: tokens::tokens::model_weights::ModelWeightToken`,

    version,

    created_at,
    updated_at,

    user_deleted_at,
    mod_deleted_at

FROM tts_models
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
  pub token: TtsModelToken,

  pub tts_model_type: TtsModelType,
  pub text_pipeline_type: Option<String>,

  pub has_self_contained_vocoder: i8, // bool
  pub has_self_contained_duration_model: i8, // bool
  pub has_self_contained_pitch_model: i8, // bool

  pub text_preprocessing_algorithm: Option<String>,

  pub use_default_mel_multiply_factor: i8, // bool
  pub maybe_custom_mel_multiply_factor: Option<f64>,

  pub maybe_default_pretrained_vocoder: Option<String>,
  pub maybe_custom_vocoder_token: Option<VocoderModelToken>,

  pub ietf_language_tag: String,
  pub ietf_primary_language_subtag: String,

  pub title: String,
  pub description_markdown: String,
  pub description_rendered_html: String,

  pub voice_name: Option<String>,
  pub actor_name: Option<String>,
  pub characteristic: Option<String>,
  pub version_string: Option<String>,

  pub is_front_page_featured: i8, // bool
  pub is_twitch_featured: i8, // bool

  pub maybe_suggested_unique_bot_command: Option<String>,

  pub original_download_url: Option<String>,
  pub original_filename: Option<String>,
  pub file_size_bytes: i32,

  pub creator_user_token: UserToken,

  pub creator_ip_address_creation: String,
  pub creator_ip_address_last_update: String,

  pub creator_set_visibility: Visibility,

  pub private_bucket_hash: String,
  pub private_bucket_object_name: String,

  pub private_bucket_object_is_archive: i8, // bool

  pub user_ratings_total_count: u32,
  pub user_ratings_positive_count: u32,
  pub user_ratings_negative_count: u32,

  pub is_public_listing_approved: Option<i8>, // bool
  pub is_locked_from_user_modification: i8, // bool
  pub is_locked_from_use: i8, // bool

  pub maybe_mod_comments: Option<String>,
  pub maybe_mod_user_token: Option<UserToken>,

  pub maybe_migration_new_model_weights_token: Option<ModelWeightToken>,

  pub version: i32,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,

  pub user_deleted_at: Option<DateTime<Utc>>,
  pub mod_deleted_at: Option<DateTime<Utc>>,
}
