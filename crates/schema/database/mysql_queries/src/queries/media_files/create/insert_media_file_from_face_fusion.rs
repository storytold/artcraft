use sqlx;
use sqlx::MySqlPool;

use enums_db::by_table::generic_synthetic_ids::id_category::IdCategory;
use enums_db::by_table::media_files::media_file_class::MediaFileClass;
use enums_db::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums_db::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use enums_db::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums_db::by_table::media_files::media_file_type::MediaFileType;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;
use crate::payloads::media_file_extra_info::inner_payloads::face_fusion_video_extra_info::FaceFusionVideoExtraInfo;
use crate::payloads::media_file_extra_info::inner_payloads::live_portrait_video_extra_info::LivePortraitVideoExtraInfo;
use crate::payloads::media_file_extra_info::media_file_extra_info::MediaFileExtraInfo;
use crate::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use crate::queries::media_files::create::generic_insert::insert_media_file_generic_from_job::{insert_media_file_generic_from_job, InsertFromJobArgs};

pub struct InsertFaceFusionArgs<'a> {
  pub pool: &'a MySqlPool,
  pub job: &'a AvailableInferenceJob,

  // Face fusion specific info
  pub face_fusion_video_info: &'a FaceFusionVideoExtraInfo,

  // Probably mp4, but could change.
  pub media_type: MediaFileType,
  pub maybe_mime_type: Option<&'a str>,
  pub maybe_audio_encoding: Option<&'a str>,
  pub maybe_video_encoding: Option<&'a str>,
  pub maybe_frame_width: Option<u32>,
  pub maybe_frame_height: Option<u32>,

  pub maybe_duration_millis: Option<u64>,
  pub file_size_bytes: u64,
  pub sha256_checksum: &'a str,

  pub maybe_title: Option<&'a str>,

  pub public_bucket_directory_hash: &'a str,
  pub maybe_public_bucket_prefix: Option<&'a str>,
  pub maybe_public_bucket_extension: Option<&'a str>,

  pub is_on_prem: bool,
  pub worker_hostname: &'a str,
  pub worker_cluster: &'a str,
}

pub async fn insert_media_file_from_face_fusion(
  args: InsertFaceFusionArgs<'_>
) -> AnyhowResult<MediaFileToken>
{
  let extra_media_info = MediaFileExtraInfo::F(args.face_fusion_video_info.clone());

  let (new_media_token, _id) = insert_media_file_generic_from_job(InsertFromJobArgs {
    pool: &args.pool,
    job: &args.job,

    // Dynamic bits (face fusion specific)
    maybe_extra_media_info: Some(&extra_media_info),

    // Dynamic bits (file type and details)
    media_type: args.media_type,
    maybe_mime_type: args.maybe_mime_type,
    maybe_audio_encoding: args.maybe_audio_encoding,
    maybe_video_encoding: args.maybe_video_encoding,
    file_size_bytes: args.file_size_bytes,
    maybe_duration_millis: args.maybe_duration_millis,
    maybe_frame_width: args.maybe_frame_width,
    maybe_frame_height: args.maybe_frame_height,
    checksum_sha2: args.sha256_checksum,

    // Dynamic bits (file data)
    maybe_title: args.maybe_title,

    // Dynamic bits (bucket storage)
    public_bucket_directory_hash: args.public_bucket_directory_hash,
    maybe_public_bucket_prefix: args.maybe_public_bucket_prefix,
    maybe_public_bucket_extension: args.maybe_public_bucket_extension,

    // Dynamic bits (worker details)
    is_generated_on_prem: args.is_on_prem,
    generated_by_worker: Some(args.worker_hostname),
    generated_by_cluster: Some(args.worker_cluster),

    // Static bits (lookup)
    media_class: MediaFileClass::Video,
    origin_category: MediaFileOriginCategory::Inference,
    origin_product_category: MediaFileOriginProductCategory::FaceFusion,
    maybe_origin_model_type: Some(MediaFileOriginModelType::FaceFusion),

    // Static bits (counters)
    maybe_creator_file_synthetic_id_category: IdCategory::MediaFile,
    maybe_creator_category_synthetic_id_category: IdCategory::FaceFusionResult,

    // Static bits (unused misc)
    maybe_origin_model_token: None,
    maybe_text_transcript: None,
    maybe_origin_filename: None,
    maybe_batch_token: None,
    maybe_prompt_token: None,
    maybe_mod_user_token: None,
    maybe_scene_source_media_file_token: None,
    is_intermediate_system_file: false,
  }).await?;

  Ok(new_media_token)
}
