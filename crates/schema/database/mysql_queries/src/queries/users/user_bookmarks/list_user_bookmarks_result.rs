use chrono::{DateTime, Utc};
use sqlx::{FromRow, Row};
use sqlx::mysql::MySqlRow;

use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::traits::mysql_from_row::MySqlFromRow as _;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use tokens::tokens::user_bookmarks::UserBookmarkToken;
use tokens::tokens::users::UserToken;

pub struct UserBookmark {
  pub token: UserBookmarkToken,

  pub entity_type: UserBookmarkEntityType,
  pub entity_token: String,

  pub maybe_media_file_type: Option<MediaFileType>,
  pub maybe_media_file_public_bucket_hash: Option<String>,
  pub maybe_media_file_public_bucket_prefix: Option<String>,
  pub maybe_media_file_public_bucket_extension: Option<String>,

  pub maybe_media_file_creator_user_token: Option<UserToken>,
  pub maybe_media_file_creator_username: Option<String>,
  pub maybe_media_file_creator_display_name: Option<String>,
  pub maybe_media_file_creator_gravatar_hash: Option<String>,

  /// Only set if the bookmark is of a media_files record *AND* the model has a cover image.
  pub maybe_media_file_cover_image_public_bucket_hash: Option<String>,

  /// Only set if the bookmark is of a media_files record *AND* the model has a cover image.

  pub maybe_media_file_cover_image_public_bucket_prefix: Option<String>,

  /// Only set if the bookmark is of a media_files record *AND* the model has a cover image.
  pub maybe_media_file_cover_image_public_bucket_extension: Option<String>,

  /// Something descriptive about the bookmarked entity.
  /// This might be TTS text, a username, etc. It depends on the entity type.
  pub maybe_entity_descriptive_text: Option<String>,

  /// Only set if the bookmark is of a model_weights record.
  pub maybe_model_weight_type: Option<WeightsType>,

  /// Only set if the bookmark is of a model_weights record.
  pub maybe_model_weight_category: Option<WeightsCategory>,

  /// Only set if the bookmark is of a model_weights record *AND* the model has a cover image.
  pub maybe_model_weight_cover_image_public_bucket_hash: Option<String>,

  /// Only set if the bookmark is of a model_weights record *AND* the model has a cover image.

  pub maybe_model_weight_cover_image_public_bucket_prefix: Option<String>,

  /// Only set if the bookmark is of a model_weights record *AND* the model has a cover image.
  pub maybe_model_weight_cover_image_public_bucket_extension: Option<String>,

  pub maybe_model_weight_creator_user_token: Option<UserToken>,
  pub maybe_model_weight_creator_username: Option<String>,
  pub maybe_model_weight_creator_display_name: Option<String>,
  pub maybe_model_weight_creator_gravatar_hash: Option<String>,

  // TODO(bt,2023-12-30): I don't think these user fields are necessary.
  //  We already know the user we're querying on behalf of, so presumably we
  //  already have their info (ie. profile page use).
  pub user_token: UserToken,
  pub username: String,
  pub user_display_name: String,
  pub user_gravatar_hash: String,

  pub maybe_ratings_positive_count: Option<u32>,
  pub maybe_ratings_negative_count: Option<u32>,
  pub maybe_bookmark_count: Option<u32>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub maybe_deleted_at: Option<DateTime<Utc>>,
}

pub struct RawUserBookmarkRecord {
  pub(crate) token: UserBookmarkToken,

  pub(crate) entity_type: UserBookmarkEntityType,
  pub(crate) entity_token: String,

  // TODO(bt,2023-12-30): I don't think these user fields are necessary.
  //  We already know the user we're querying on behalf of, so presumably we
  //  already have their info (ie. profile page use).
  pub(crate) user_token: UserToken,
  pub(crate) username: String,
  pub(crate) user_display_name: String,
  pub(crate) user_gravatar_hash: String,

  pub(crate) created_at: DateTime<Utc>,
  pub(crate) updated_at: DateTime<Utc>,
  pub(crate) deleted_at: Option<DateTime<Utc>>,

  pub(crate) maybe_ratings_positive_count: Option<u32>,
  pub(crate) maybe_ratings_negative_count: Option<u32>,
  pub(crate) maybe_bookmark_count: Option<u32>,

  pub(crate) maybe_media_file_type: Option<MediaFileType>,
  pub(crate) maybe_media_file_origin_category: Option<MediaFileOriginCategory>,
  pub(crate) maybe_media_file_origin_product: Option<MediaFileOriginProductCategory>,
  pub(crate) maybe_media_file_public_bucket_hash: Option<String>,
  pub(crate) maybe_media_file_public_bucket_prefix: Option<String>,
  pub(crate) maybe_media_file_public_bucket_extension: Option<String>,

  pub(crate) maybe_media_file_cover_image_public_bucket_hash: Option<String>,
  pub(crate) maybe_media_file_cover_image_public_bucket_prefix: Option<String>,
  pub(crate) maybe_media_file_cover_image_public_bucket_extension: Option<String>,

  pub(crate) maybe_media_file_creator_user_token: Option<UserToken>,
  pub(crate) maybe_media_file_creator_username: Option<String>,
  pub(crate) maybe_media_file_creator_display_name: Option<String>,
  pub(crate) maybe_media_file_creator_gravatar_hash: Option<String>,

  pub(crate) maybe_model_weight_type: Option<WeightsType>,
  pub(crate) maybe_model_weight_category: Option<WeightsCategory>,

  pub(crate) maybe_model_weight_cover_image_public_bucket_hash: Option<String>,
  pub(crate) maybe_model_weight_cover_image_public_bucket_prefix: Option<String>,
  pub(crate) maybe_model_weight_cover_image_public_bucket_extension: Option<String>,

  pub(crate) maybe_model_weight_creator_user_token: Option<UserToken>,
  pub(crate) maybe_model_weight_creator_username: Option<String>,
  pub(crate) maybe_model_weight_creator_display_name: Option<String>,
  pub(crate) maybe_model_weight_creator_gravatar_hash: Option<String>,

  pub(crate) maybe_descriptive_text_model_weight_title: Option<String>,
  pub(crate) maybe_descriptive_text_tts_model_title: Option<String>,
  pub(crate) maybe_descriptive_text_tts_result_inference_text: Option<String>,
  pub(crate) maybe_descriptive_text_user_display_name: Option<String>,
  pub(crate) maybe_descriptive_text_voice_conversion_model_title: Option<String>,
  pub(crate) maybe_descriptive_text_zs_voice_title: Option<String>,
}

impl RawUserBookmarkRecord {
  pub fn into_public_type(self) -> UserBookmark {
    UserBookmark {
      token: self.token,
      entity_type: self.entity_type,
      entity_token: self.entity_token,
      maybe_media_file_type: self.maybe_media_file_type,
      maybe_media_file_public_bucket_hash: self.maybe_media_file_public_bucket_hash,
      maybe_media_file_public_bucket_prefix: self.maybe_media_file_public_bucket_prefix,
      maybe_media_file_public_bucket_extension: self.maybe_media_file_public_bucket_extension,
      maybe_media_file_creator_user_token: self.maybe_media_file_creator_user_token,
      maybe_media_file_creator_username: self.maybe_media_file_creator_username,
      maybe_media_file_creator_display_name: self.maybe_media_file_creator_display_name,
      maybe_media_file_creator_gravatar_hash: self.maybe_media_file_creator_gravatar_hash,
      maybe_media_file_cover_image_public_bucket_hash: self.maybe_media_file_cover_image_public_bucket_hash,
      maybe_media_file_cover_image_public_bucket_prefix: self.maybe_media_file_cover_image_public_bucket_prefix,
      maybe_media_file_cover_image_public_bucket_extension: self.maybe_media_file_cover_image_public_bucket_extension,
      maybe_entity_descriptive_text: match self.entity_type {
        UserBookmarkEntityType::User => self.maybe_descriptive_text_user_display_name,
        UserBookmarkEntityType::ModelWeight => self.maybe_descriptive_text_model_weight_title,
        UserBookmarkEntityType::TtsModel => self.maybe_descriptive_text_tts_model_title,
        UserBookmarkEntityType::TtsResult => self.maybe_descriptive_text_tts_result_inference_text,
        UserBookmarkEntityType::W2lTemplate => None,
        UserBookmarkEntityType::W2lResult => None,
        // TODO(bt,2023-11-21): Summary text needs to be better enriched.
        UserBookmarkEntityType::MediaFile => self.maybe_media_file_type
            .and_then(|media_file_type| match media_file_type {
              MediaFileType::Audio => Some("audio media file".to_string()),
              MediaFileType::Image => Some("image media file".to_string()),
              MediaFileType::Video => Some("video media file".to_string()),
              MediaFileType::Bvh => Some("3d file".to_string()),
              MediaFileType::Fbx => Some("3d file".to_string()),
              MediaFileType::Glb => Some("3d file".to_string()),
              MediaFileType::Gltf => Some("3d file".to_string()),
              MediaFileType::Spz => Some("3d splat".to_string()),
              MediaFileType::SceneRon => Some("3d scene".to_string()),
              MediaFileType::SceneJson => Some("3d scene".to_string()),
              MediaFileType::Pmd => Some("polygon data".to_string()),
              MediaFileType::Vmd => Some("motion data".to_string()),
              MediaFileType::Pmx => Some("pmx data".to_string()),
              MediaFileType::Csv => Some("animation data".to_string()),
              MediaFileType::Jpg => Some("image media file".to_string()),
              MediaFileType::Png => Some("image media file".to_string()),
              MediaFileType::Gif => Some("image media file".to_string()),
              MediaFileType::Mp4 => Some("video media file".to_string()),
              MediaFileType::Wav => Some("audio media file".to_string()),
              MediaFileType::Mp3 => Some("audio media file".to_string()),
            }),
        UserBookmarkEntityType::VoiceConversionModel => self.maybe_descriptive_text_voice_conversion_model_title,
        UserBookmarkEntityType::ZsVoice => self.maybe_descriptive_text_zs_voice_title,
      },
      maybe_model_weight_type: self.maybe_model_weight_type,
      maybe_model_weight_category: self.maybe_model_weight_category,
      maybe_model_weight_cover_image_public_bucket_hash: self.maybe_model_weight_cover_image_public_bucket_hash,
      maybe_model_weight_cover_image_public_bucket_prefix: self.maybe_model_weight_cover_image_public_bucket_prefix,
      maybe_model_weight_cover_image_public_bucket_extension: self.maybe_model_weight_cover_image_public_bucket_extension,
      maybe_model_weight_creator_user_token: self.maybe_model_weight_creator_user_token,
      maybe_model_weight_creator_username: self.maybe_model_weight_creator_username,
      maybe_model_weight_creator_display_name: self.maybe_model_weight_creator_display_name,
      maybe_model_weight_creator_gravatar_hash: self.maybe_model_weight_creator_gravatar_hash,
      user_token: self.user_token,
      username: self.username,
      user_display_name: self.user_display_name,
      user_gravatar_hash: self.user_gravatar_hash,
      maybe_ratings_positive_count: self.maybe_ratings_positive_count,
      maybe_ratings_negative_count: self.maybe_ratings_negative_count,
      maybe_bookmark_count: self.maybe_bookmark_count,
      created_at: self.created_at,
      updated_at: self.updated_at,
      maybe_deleted_at: self.deleted_at,
    }
  }
}

impl FromRow<'_, MySqlRow> for RawUserBookmarkRecord {
    fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
        token: UserBookmarkToken::new(row.try_get("token")?),
        entity_type: UserBookmarkEntityType::try_from_mysql_row(row, "entity_type")?,
        entity_token: row.try_get("entity_token")?,
        user_token: row.try_get("user_token")?,
        username: row.try_get("username")?,
        user_display_name: row.try_get("user_display_name")?,
        user_gravatar_hash: row.try_get("user_gravatar_hash")?,
        created_at: row.try_get("created_at")?,
        updated_at: row.try_get("updated_at")?,
        deleted_at: row.try_get("deleted_at")?,
        maybe_ratings_positive_count: row.try_get("maybe_ratings_positive_count")?,
        maybe_ratings_negative_count: row.try_get("maybe_ratings_negative_count")?,
        maybe_bookmark_count: row.try_get("maybe_bookmark_count")?,
        maybe_media_file_type: MediaFileType::try_from_mysql_row_nullable(row, "maybe_media_file_type")?,
        maybe_media_file_origin_category: MediaFileOriginCategory::try_from_mysql_row_nullable(row,"maybe_media_file_origin_category")?,
        maybe_media_file_origin_product: MediaFileOriginProductCategory::try_from_mysql_row_nullable(row,"maybe_media_file_origin_product")?,
        maybe_media_file_public_bucket_hash: row.try_get("maybe_media_file_public_bucket_hash")?,
        maybe_media_file_public_bucket_prefix: row.try_get("maybe_media_file_public_bucket_prefix")?,
        maybe_media_file_public_bucket_extension: row.try_get("maybe_media_file_public_bucket_extension")?,
        maybe_media_file_cover_image_public_bucket_hash: row.try_get("maybe_media_file_cover_image_public_bucket_hash")?,
        maybe_media_file_cover_image_public_bucket_prefix: row.try_get("maybe_media_file_cover_image_public_bucket_prefix")?,
        maybe_media_file_cover_image_public_bucket_extension: row.try_get("maybe_media_file_cover_image_public_bucket_extension")?,
        maybe_media_file_creator_user_token: row.try_get("maybe_media_file_creator_user_token")?,
        maybe_media_file_creator_username: row.try_get("maybe_media_file_creator_username")?,
        maybe_media_file_creator_display_name: row.try_get("maybe_media_file_creator_display_name")?,
        maybe_media_file_creator_gravatar_hash: row.try_get("maybe_media_file_creator_gravatar_hash")?,
        maybe_model_weight_type: WeightsType::try_from_mysql_row_nullable(row, "maybe_model_weight_type")?,
        maybe_model_weight_category: WeightsCategory::try_from_mysql_row_nullable(row, "maybe_model_weight_category")?,
        maybe_model_weight_cover_image_public_bucket_hash: row.try_get("maybe_model_weight_cover_image_public_bucket_hash")?,
        maybe_model_weight_cover_image_public_bucket_prefix: row.try_get("maybe_model_weight_cover_image_public_bucket_prefix")?,
        maybe_model_weight_cover_image_public_bucket_extension: row.try_get("maybe_model_weight_cover_image_public_bucket_extension")?,
        maybe_model_weight_creator_user_token: row.try_get("maybe_model_weight_creator_user_token")?,
        maybe_model_weight_creator_username: row.try_get("maybe_model_weight_creator_username")?,
        maybe_model_weight_creator_display_name: row.try_get("maybe_model_weight_creator_display_name")?,
        maybe_model_weight_creator_gravatar_hash: row.try_get("maybe_model_weight_creator_gravatar_hash")?,
        maybe_descriptive_text_model_weight_title: row.try_get("maybe_descriptive_text_model_weight_title")?,
        maybe_descriptive_text_tts_model_title: row.try_get("maybe_descriptive_text_tts_model_title")?,
        maybe_descriptive_text_tts_result_inference_text: row.try_get("maybe_descriptive_text_tts_result_inference_text")?,
        maybe_descriptive_text_user_display_name: row.try_get("maybe_descriptive_text_user_display_name")?,
        maybe_descriptive_text_voice_conversion_model_title: row.try_get("maybe_descriptive_text_voice_conversion_model_title")?,
        maybe_descriptive_text_zs_voice_title: row.try_get("maybe_descriptive_text_zs_voice_title")?,
        })
    }
}