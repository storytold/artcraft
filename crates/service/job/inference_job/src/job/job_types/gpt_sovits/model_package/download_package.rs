use std::path::Path;

use anyhow::anyhow;
use log::{debug, error, info, warn};
use tempdir::TempDir;
use bucket_paths::legacy::typified_paths::public::weight_files::bucket_directory::WeightFileBucketDirectory;
use bucket_paths::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;
use cloud_storage::bucket_client::BucketClient;
use filesys::rename_across_devices::{rename_across_devices, RenameError};
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::gpt_sovits::model_package::model_package::GptSovitsPackageFileType;
use crate::util::filesystem::scoped_temp_dir_creator::ScopedTempDirCreator;

pub async fn download_package(
  model_weight_token: ModelWeightToken,
  weights_file_bucket_directory: &WeightFileBucketDirectory,
  download_directory: &Path,
  bucket_client: &BucketClient,
  scoped_tempdir_creator: &ScopedTempDirCreator,
  force_download: bool,
) -> Result<(), ProcessSingleJobError> {

  if !download_directory.exists() {
    std::fs::create_dir_all(&download_directory)
      .map_err(|err| ProcessSingleJobError::IoError(err))?;
  }

  let temp_dir_name = format!("model_download_{}", model_weight_token.entropy_suffix());

  let temp_dir = scoped_tempdir_creator.new_tempdir(&temp_dir_name)
    .map_err(|e| anyhow!("problem creating tempdir: {:?}", e))?;

  for entry in GptSovitsPackageFileType::all_variants() {
    let result = do_download_package(
      model_weight_token.clone(),
      weights_file_bucket_directory,
      download_directory,
      bucket_client,
      &temp_dir,
      force_download,
      entry,
    ).await;

    if let Err(err) = result {
      match entry {
        GptSovitsPackageFileType::GptModel | GptSovitsPackageFileType::SovitsCheckpoint => {
          // NB: The models are essential and are actual failures.
          error!("Error downloading model: {:?}", err);
          return Err(err);
        }
        GptSovitsPackageFileType::ReferenceAudio | GptSovitsPackageFileType::ReferenceTranscript => {
          // NB: The reference files are not essential and can be skipped
          warn!("Error downloading reference file: {:?}", err);
          continue;
        }
      }
    }
  }

  safe_delete_directory(&temp_dir);

  Ok(())
}

pub async fn do_download_package(
  model_weight_token: ModelWeightToken,
  weights_file_bucket_directory: &WeightFileBucketDirectory,
  download_directory: &Path,
  bucket_client: &BucketClient,
  temp_dir: &TempDir,
  force_download: bool,
  entry: GptSovitsPackageFileType,
) -> Result<(), ProcessSingleJobError> {

  let suffix_with_package_identifier = entry.get_expected_package_suffix();
  let temp_path = temp_dir.path().join(format!("{}{}", model_weight_token.to_string(), suffix_with_package_identifier));
  let final_download_path = download_directory.join(format!("{}{}", model_weight_token.to_string(), suffix_with_package_identifier));

  if final_download_path.exists() && !force_download {
    info!("Skipping download of {} because it already exists", final_download_path.display().to_string());
    return Ok(())
  }

  if final_download_path.exists() {
    debug!("Deleting existing file at {:?}", final_download_path.display().to_string());
    std::fs::remove_file(&final_download_path)
        .map_err(|err| ProcessSingleJobError::IoError(err))?;
  }

  let bucket_public_download_path = WeightFileBucketPath::from_object_hash(
    weights_file_bucket_directory.get_object_hash(),
    Some("weight_"),
    Some(&suffix_with_package_identifier),
  );

  debug!("Downloading to {} from bucket path: {:?}", temp_path.display().to_string(), &bucket_public_download_path.get_full_object_path_str());
  bucket_client.download_file_to_disk(bucket_public_download_path.get_full_object_path_str(), &temp_path)
      .await
      .map_err(|e| {
        anyhow!("couldn't download {} cloud object to disk: {:?}", &bucket_public_download_path.get_full_object_path_str(), e)
      })?;

  debug!("Renaming file from {:?} to {:?}!", &temp_path, final_download_path.display().to_string());

  rename_across_devices(&temp_path, final_download_path)
      .map_err(|err| {
        safe_delete_directory(&temp_dir);
        match err {
          RenameError::StorageFull => ProcessSingleJobError::FilesystemFull,
          RenameError::IoError(err) => ProcessSingleJobError::from_io_error(err),
        }})?;

  Ok(())
}
