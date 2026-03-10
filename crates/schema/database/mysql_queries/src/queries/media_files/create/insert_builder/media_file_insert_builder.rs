use crate::queries::media_files::create::generic_insert::insert_media_file_generic::{insert_media_file_generic, InsertArgs};
use crate::queries::media_files::create::insert_builder::media_file_insert_builder_error::MediaFileInsertBuilderError;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::generic_synthetic_ids::id_category::IdCategory;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use sqlx::MySqlPool;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

/// Builder for inserting a media files into the database.
/// Resembles an ORM, but can still use statically type checked queries (which is probably
/// really important since we don't have tests on database functionality yet).
#[derive(Clone)]
pub struct MediaFileInsertBuilder {
  // TODO: Allow specifying the token externally
  // token: MediaFileToken,

  // Creator info
  maybe_creator_user_token: Option<UserToken>,
  maybe_creator_anonymous_visitor_token: Option<AnonymousVisitorTrackingToken>,
  creator_ip_address: Option<String>, // NB: Non-nullable field
  creator_set_visibility: Visibility, // NB: Non-nullable field

  // Important database indices
  media_file_class: MediaFileClass, // NB: Non-nullable field
  media_file_type: Option<MediaFileType>, // NB: Non-nullable field
  is_user_upload: bool,
  is_intermediate_system_file: bool,

  // Product and other origination information
  origin_category: Option<MediaFileOriginCategory>, // NB: Non-nullable field
  origin_product_category: MediaFileOriginProductCategory, // NB: Non-nullable field
  // maybe_origin_model_type: Option<MediaFileOriginModelType>,
  // maybe_origin_model_token: Option<&'a ModelWeightToken>,

  // Media info
  maybe_mime_type: Option<String>,
  file_size_bytes: u64, // NB: Non-nullable field
  maybe_duration_millis: Option<u64>,
  // maybe_audio_encoding: Option<&'a str>,
  // maybe_video_encoding: Option<&'a str>,
  maybe_frame_width: Option<u32>,
  maybe_frame_height: Option<u32>,
  checksum_sha2: Option<String>, // NB: Non-nullable field
  
  // File name
  maybe_title: Option<String>,
  maybe_origin_filename: Option<String>,

  // Media info for certain product areas
  maybe_engine_category: Option<MediaFileEngineCategory>, // TODO: Deprecate

  maybe_prompt_token: Option<PromptToken>,
  
  // // User text information
  // maybe_title: Option<&'a str>,
  // maybe_text_transcript: Option<&'a str>,

  // // If generated from a scene, this is the scene media file token.
  // maybe_scene_source_media_file_token: Option<&'a MediaFileToken>,

  // // If additional prompt details are stored, this is the prompt token.
  // maybe_prompt_token: Option<&'a PromptToken>,

  // // If batch generated, this is the batch token.
  maybe_batch_generation_token: Option<BatchGenerationToken>,

  // Cover image (e.g. thumbnail for 3D splats)
  maybe_cover_image_media_file_token: Option<MediaFileToken>,

  // Storage details
  public_bucket_directory_hash: Option<MediaFileBucketPath>, // NB: Non-nullable field(s)

  // Remaining fields...
}

impl MediaFileInsertBuilder {
  //pub fn generate_token() -> Self {
  //  Self::with_token(&MediaFileToken::generate())
  //}

  pub fn new() -> Self {
    MediaFileInsertBuilder {
      //token: token.clone(),
      maybe_creator_user_token: None,
      maybe_creator_anonymous_visitor_token: None,
      creator_ip_address: None,
      creator_set_visibility: Visibility::Public,
      media_file_class: MediaFileClass::Unknown,
      media_file_type: None,
      is_user_upload: false,
      is_intermediate_system_file: false,
      origin_category: None,
      origin_product_category: MediaFileOriginProductCategory::Unknown,
      maybe_mime_type: None,
      file_size_bytes: 0,
      maybe_duration_millis: None,
      maybe_frame_width: None,
      maybe_frame_height: None,
      checksum_sha2: None,
      maybe_title: None,
      maybe_origin_filename: None,
      maybe_engine_category: None,
      maybe_batch_generation_token: None,
      maybe_cover_image_media_file_token: None,
      public_bucket_directory_hash: None,
      maybe_prompt_token: None,
    }
  }

  pub fn creator_user(mut self, user_token: &UserToken) -> Self {
    self.maybe_creator_user_token = Some(user_token.clone());
    self
  }

  pub fn maybe_creator_user(mut self, maybe_user: Option<&UserToken>) -> Self {
    self.maybe_creator_user_token = maybe_user.map(|token| token.clone());
    self
  }

  pub fn creator_anonymous_visitor(mut self, avt: &AnonymousVisitorTrackingToken) -> Self {
    self.maybe_creator_anonymous_visitor_token = Some(avt.clone());
    self
  }

  pub fn maybe_creator_anonymous_visitor(mut self, maybe_avt: Option<&AnonymousVisitorTrackingToken>) -> Self {
    self.maybe_creator_anonymous_visitor_token = maybe_avt.map(|token| token.clone());
    self
  }

  pub fn creator_ip_address(mut self, ip_address: &str) -> Self {
    self.creator_ip_address = Some(ip_address.to_string());
    self
  }

  pub fn creator_set_visibility(mut self, visibility: Visibility) -> Self {
    self.creator_set_visibility = visibility;
    self
  }

  pub fn media_file_class(mut self, media_file_class: MediaFileClass) -> Self {
    self.media_file_class = media_file_class;
    self
  }

  pub fn media_file_type(mut self, media_file_type: MediaFileType) -> Self {
    self.media_file_type = Some(media_file_type);
    self
  }

  #[allow(clippy::wrong_self_convention)]
  pub fn is_user_upload(mut self, is_user_upload: bool) -> Self {
    self.is_user_upload = is_user_upload;
    self
  }

  #[allow(clippy::wrong_self_convention)]
  pub fn is_intermediate_system_file(mut self, is_intermediate_system_file: bool) -> Self {
    self.is_intermediate_system_file = is_intermediate_system_file;
    self
  }

  pub fn media_file_origin_category(mut self, origin_category: MediaFileOriginCategory) -> Self {
    self.origin_category = Some(origin_category);
    self
  }

  pub fn media_file_origin_product_category(mut self, origin_category: MediaFileOriginProductCategory) -> Self {
    self.origin_product_category = origin_category;
    self
  }

  pub fn maybe_prompt_token(mut self, maybe_prompt_token: Option<&PromptToken>) -> Self {
    self.maybe_prompt_token = maybe_prompt_token.map(|token| token.clone());
    self
  }

  // TODO: Method for maybe_origin_model_type
  // TODO: Method for maybe_origin_model_token

  pub fn mime_type(mut self, mime_type: &str) -> Self {
    self.maybe_mime_type = Some(mime_type.to_string());
    self
  }

  pub fn file_size_bytes(mut self, file_size_bytes: u64) -> Self {
    self.file_size_bytes = file_size_bytes;
    self
  }

  pub fn maybe_duration_millis(mut self, maybe_duration_millis: Option<u64>) -> Self {
    self.maybe_duration_millis = maybe_duration_millis;
    self
  }

  // TODO: maybe_audio_encoding
  // TODO: maybe_video_encoding
  
  pub fn frame_width(mut self, frame_width: u32) -> Self {
    self.maybe_frame_width = Some(frame_width);
    self
  }

  pub fn maybe_frame_width(mut self, maybe_frame_width: Option<u32>) -> Self {
    self.maybe_frame_width = maybe_frame_width;
    self
  }

  pub fn frame_height(mut self, frame_height: u32) -> Self {
    self.maybe_frame_height = Some(frame_height);
    self
  }
  
  pub fn maybe_frame_height(mut self, maybe_frame_height: Option<u32>) -> Self {
    self.maybe_frame_height = maybe_frame_height;
    self
  }

  pub fn checksum_sha2(mut self, checksum_sha2: &str) -> Self {
    self.checksum_sha2 = Some(checksum_sha2.to_string());
    self
  }

  pub fn maybe_engine_category(mut self, maybe_engine_category: Option<MediaFileEngineCategory>) -> Self {
    self.maybe_engine_category = maybe_engine_category;
    self
  }

  pub fn maybe_title(mut self, maybe_title: Option<&str>) -> Self {
    self.maybe_title = maybe_title.map(|title| title.to_string());
    self
  }

  pub fn maybe_origin_filename(mut self, maybe_origin_filename: Option<&str>) -> Self {
    self.maybe_origin_filename = maybe_origin_filename.map(|s| s.to_string());
    self
  }

  // TODO: maybe_text_transcript
  // TODO: maybe_scene_source_media_file_token
  // TODO: maybe_prompt_token

  pub fn maybe_batch_generation_token(mut self, maybe_batch_token: Option<&BatchGenerationToken>) -> Self {
    self.maybe_batch_generation_token = maybe_batch_token
        .map(|token| token.clone());
    self
  }

  pub fn maybe_cover_image_media_file_token(mut self, maybe_token: Option<&MediaFileToken>) -> Self {
    self.maybe_cover_image_media_file_token = maybe_token.cloned();
    self
  }

  pub fn public_bucket_directory_hash(mut self, public_bucket_directory_hash: &MediaFileBucketPath) -> Self {
    self.public_bucket_directory_hash = Some(public_bucket_directory_hash.clone());
    self
  }

  // TODO(bt,2025-04-26): Other connector options.
  pub async fn insert_pool(self, mysql_pool: &MySqlPool) -> Result<MediaFileToken, MediaFileInsertBuilderError> {
    let media_file_type = self.media_file_type
        .ok_or_else(|| MediaFileInsertBuilderError::MissingRequiredField(
          "Media file type is required".to_string()))?;

    let origin_category = self.origin_category
        .ok_or_else(|| MediaFileInsertBuilderError::MissingRequiredField(
          "Origin category is required".to_string()))?;

    let checksum_sha2 = self.checksum_sha2
        .ok_or_else(|| MediaFileInsertBuilderError::MissingRequiredField(
          "Checksum SHA2 is required".to_string()))?;

    let bucket_path = self.public_bucket_directory_hash
        .ok_or_else(|| MediaFileInsertBuilderError::MissingRequiredField(
          "Public bucket directory hash is required".to_string()))?;

    let result = insert_media_file_generic(InsertArgs {
      pool: mysql_pool,
      maybe_creator_user_token: self.maybe_creator_user_token.as_ref(),
      maybe_creator_anonymous_visitor_token: self.maybe_creator_anonymous_visitor_token.as_ref(),
      creator_ip_address: self.creator_ip_address.as_deref().unwrap_or("127.0.0.1"),
      creator_set_visibility: self.creator_set_visibility,
      media_class: self.media_file_class,
      media_type: media_file_type,
      is_user_upload: self.is_user_upload,
      is_intermediate_system_file: self.is_intermediate_system_file,
      origin_category,
      origin_product_category: self.origin_product_category,
      maybe_origin_model_type: None, // TODO
      maybe_origin_model_token: None, // TODO
      maybe_origin_filename: self.maybe_origin_filename,
      maybe_mime_type: self.maybe_mime_type.as_deref(),
      file_size_bytes: self.file_size_bytes,
      maybe_duration_millis: self.maybe_duration_millis,
      maybe_audio_encoding: None, // TODO
      maybe_video_encoding: None, // TODO
      maybe_frame_width: self.maybe_frame_width,
      maybe_frame_height: self.maybe_frame_height,
      maybe_engine_category: self.maybe_engine_category,
      checksum_sha2: &checksum_sha2,
      maybe_title: self.maybe_title.as_deref(),
      maybe_text_transcript: None, // TODO
      maybe_scene_source_media_file_token: None, // TODO
      maybe_prompt_token: self.maybe_prompt_token.as_ref(),
      maybe_batch_token: self.maybe_batch_generation_token.as_ref(),
      public_bucket_directory_hash: bucket_path.get_object_hash(),
      maybe_public_bucket_prefix: bucket_path.get_optional_prefix(),
      maybe_public_bucket_extension: bucket_path.get_optional_extension(),
      maybe_creator_file_synthetic_id_category: IdCategory::MediaFile, // TODO: Remove this
      maybe_creator_category_synthetic_id_category: IdCategory::FileUpload, // TODO: Remove this
      maybe_extra_media_info: None, // TODO
      maybe_cover_image_media_file_token: self.maybe_cover_image_media_file_token.as_ref(),
      is_generated_on_prem: false, // TODO
      generated_by_worker: None, // TODO
      generated_by_cluster: None, // TODO
      maybe_mod_user_token: None, // TODO
    }).await;

    match result {
      Ok(result) => Ok(result.0),
      Err(err) => Err(MediaFileInsertBuilderError::ProbablyDatabaseError(err)),
    }
  }
}
