use tempdir::TempDir;

use bucket_paths::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;
use bucket_paths::legacy::old_bespoke_paths::bucket_path_unifier::BucketPathUnifier;
use enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType;
use errors::{anyhow, AnyhowResult};
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mysql_queries::queries::model_weights::migration::upsert_model_weight_from_voice_conversion_model::CopiedFileData;
use mysql_queries::queries::voice_conversion::migration::list_whole_voice_conversion_models_using_cursor::WholeVoiceConversionModelRecord;

use crate::deps::Deps;

pub async fn copy_cloud_files(model: &WholeVoiceConversionModelRecord, deps: &Deps) -> AnyhowResult<CopiedFileData> {
  let copied_file_data = copy_model(model, deps).await?;

  if model.has_index_file {
    copy_index_file(model, deps, &copied_file_data.bucket_path).await?;
  }

  Ok(copied_file_data)
}

async fn copy_model(model: &WholeVoiceConversionModelRecord, deps: &Deps) -> AnyhowResult<CopiedFileData> {
  let bucket_path_unifier = BucketPathUnifier::default_paths();

  let old_model_bucket_path = match model.model_type {
    VoiceConversionModelType::RvcV2 => bucket_path_unifier.rvc_v2_model_path(&model.private_bucket_hash),
    VoiceConversionModelType::SoVitsSvc => bucket_path_unifier.so_vits_svc_model_path(&model.private_bucket_hash),
    VoiceConversionModelType::SoftVc => return Err(anyhow!("we never built softvc models")),
  };

  // TODO(bt,2023-12-19): Probably faster to stream between buckets, but whatever.
  let temp_dir = TempDir::new("model_transfer")?;
  let model_temp_fs_path = temp_dir.path().join("model.bin");

  deps.bucket_production_private.download_file_to_disk(&old_model_bucket_path, &model_temp_fs_path).await?;

  let file_checksum = sha256_hash_file(&model_temp_fs_path)?;

  let new_model_bucket_path = match model.model_type {
    VoiceConversionModelType::RvcV2 => WeightFileBucketPath::generate_for_rvc_model(),
    VoiceConversionModelType::SoVitsSvc => WeightFileBucketPath::generate_for_svc_model(),
    VoiceConversionModelType::SoftVc => return Err(anyhow!("we never built softvc models")),
  };

  deps.bucket_production_public.upload_filename_with_content_type(
    &new_model_bucket_path.get_full_object_path_str(),
    &model_temp_fs_path,
    "application/octet-stream").await?;

  safe_delete_file(&model_temp_fs_path);
  safe_delete_directory(&temp_dir);

  Ok(CopiedFileData {
    bucket_path: new_model_bucket_path,
    file_sha_hash: file_checksum,
  })
}

async fn copy_index_file(model: &WholeVoiceConversionModelRecord, deps: &Deps, bucket_path: &WeightFileBucketPath) -> AnyhowResult<()> {
  let bucket_path_unifier = BucketPathUnifier::default_paths();

  let old_model_index_bucket_path = bucket_path_unifier.rvc_v2_model_index_path(&model.private_bucket_hash);

  // TODO(bt,2023-12-19): Probably faster to stream between buckets, but whatever.
  let temp_dir = TempDir::new("model_transfer")?;
  let model_temp_fs_path = temp_dir.path().join("model.bin");

  deps.bucket_production_private.download_file_to_disk(&old_model_index_bucket_path, &model_temp_fs_path).await?;

  let new_model_bucket_path =
      WeightFileBucketPath::rvc_index_file_from_object_hash(bucket_path.get_object_hash());

  deps.bucket_production_public.upload_filename_with_content_type(
    &new_model_bucket_path.get_full_object_path_str(),
    &model_temp_fs_path,
    "application/octet-stream").await?;

  safe_delete_file(&model_temp_fs_path);
  safe_delete_directory(&temp_dir);

  Ok(()) // NB: We don't care about the path of the index file.
}
