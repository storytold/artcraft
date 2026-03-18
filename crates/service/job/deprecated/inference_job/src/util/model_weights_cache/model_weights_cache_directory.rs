use std::path::PathBuf;
use std::sync::Arc;

use log::{error, info, warn};

use bucket_paths::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;
use cloud_storage::bucket_client::BucketClient;
use errors::AnyhowResult;
use filesys::file_size::file_size;
use filesys::rename_across_devices::{rename_across_devices, RenameError};
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporter;
use mysql_queries::queries::model_weights::get::get_weight::RetrievedModelWeight;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::util::filesystem::scoped_temp_dir_creator::ScopedTempDirCreator;
use crate::util::model_weights_cache::model_weights_cache_filename::ModelWeightsCacheMapping;

#[derive(Clone)]
pub struct ModelWeightsCacheDirectory {
  /// The path to the cache directory
  pub local_cache_directory: PathBuf,

  /// Create tempdirs during the download process.
  pub scoped_tempdir_creator: ScopedTempDirCreator,

  /// A client to download from the public bucket.
  pub public_bucket_client: BucketClient,

  /// NB: Sometimes the downloader incompletely downloads files. Typically, this is a zero file
  /// size, but the Rust system may report a non-zero (but small) number of bytes. This should
  /// later be investigated and the heuristic simplified. The intent here is merely to make sure
  /// we don't consider these okay:
  ///
  ///   -rw-r--r-- 1 root root 55824433 Nov 30 00:12 VM:012rkwsv91zb
  ///   -rw-r--r-- 1 root root 55823149 Nov 30 00:13 VM:79etbx4fdksv
  ///   -rw-r--r-- 1 root root        0 Nov 30 00:52 VM:1dzepsnwzbkc (bad file)
  ///   -rw-r--r-- 1 root root        0 Nov 30 00:29 VM:7c2df5a36qjb (bad file)
  ///
  pub maybe_cached_file_minimum_size_required: Option<u64>,

  /// Update the status of jobs when we manage the cache.
  pub maybe_job_progress_reporter: Option<Arc<dyn JobProgressReporter>>,
}


impl ModelWeightsCacheDirectory {
  /// Configure and try to create the directory if it doesn't exist.
  pub fn setup_from_env_and_deps(
    scoped_temp_dir_creator: &ScopedTempDirCreator,
    public_bucket_client: &BucketClient,
  ) -> AnyhowResult<Self> {
    let directory = easyenv::get_env_pathbuf_or_default(
      "MODEL_WEIGHTS_CACHE_DIR",
      "/model_weights_cache");

    info!("Using model weights cache directory: {:?}", directory);

    let directory = ModelWeightsCacheDirectory {
      local_cache_directory: directory,
      maybe_cached_file_minimum_size_required: Some(1000), // TODO(bt,2024-02-11): Make configurable
      maybe_job_progress_reporter: None, // TODO(bt,2024-02-11): Make Sync/Send to hold a copy
      scoped_tempdir_creator: scoped_temp_dir_creator.clone(),
      public_bucket_client: public_bucket_client.clone(),
    };

    directory.try_create_directory()?;

    Ok(directory)
  }


  /// Try to create the directory if it doesn't exist.
  fn try_create_directory(&self) -> std::io::Result<()> {
    if !self.local_cache_directory.exists() {
      std::fs::create_dir_all(&self.local_cache_directory)?;
    }
    Ok(())
  }


  pub fn model_weight_cache_path(&self, model_weight: &RetrievedModelWeight) -> PathBuf {
    let filename = ModelWeightsCacheMapping::new_from_model(model_weight);
    let full_path = self.local_cache_directory.join(filename.to_path_buf());
    full_path
  }


  /// Download the model if we don't already have a copy.
  /// Return the path from the cache.
  pub async fn get_model_weight_from_cache_or_bucket(
    &self,
    model_weight: &RetrievedModelWeight
  ) -> Result<PathBuf, ProcessSingleJobError> {
    let cache_filesystem_path = self.model_weight_cache_path(model_weight);

    if self.is_model_already_cached(model_weight, &cache_filesystem_path)? {
      return Ok(cache_filesystem_path);
    }

    self.report_progress(format!("downloading model {}", &model_weight.token)).await;

    let bucket_object_path = WeightFileBucketPath::from_object_hash(
      &model_weight.public_bucket_hash,
      model_weight.maybe_public_bucket_prefix.as_deref(),
      model_weight.maybe_public_bucket_extension.as_deref(),
    );

    let bucket_object_path = bucket_object_path.to_full_object_pathbuf();

    info!("Downloading model weight (type {:?} token {:?}) from bucket object path {:?}",
        &model_weight.weights_type,
        &model_weight.token,
        &bucket_object_path);

    // NB (1): Download to temp directory to stop concurrent writes and race conditions from other
    //         workers writing to a shared volume.
    // NB (2): TempDir exists until it goes out of scope, at which point it should delete from filesystem.
    let temp_dir = self.scoped_tempdir_creator.new_tempdir("model_weight_download")
        .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

    let temp_path = temp_dir.path().join("download.part");

    self.public_bucket_client.download_file_to_disk(&bucket_object_path, &temp_path)
        .await
        .map_err(|e| {
          safe_delete_directory(&temp_dir);
          ProcessSingleJobError::Other(e)
        })?;

    info!("Downloaded successfully from bucket!");

    let original_size = file_size(&temp_path)
        .map_err(|err| ProcessSingleJobError::from_anyhow_error(err))?;

    info!("File size of temp download file {:?} is {original_size}", &temp_path);

    info!("Renaming temp file from {:?} to {:?}!", &temp_path, &cache_filesystem_path);

    rename_across_devices(&temp_path, &cache_filesystem_path)
        .map_err(|err| {
          error!("could not rename on disk: {:?}", err);
          safe_delete_file(&temp_path);
          safe_delete_directory(&temp_dir);
          match err {
            RenameError::StorageFull => ProcessSingleJobError::FilesystemFull,
            RenameError::IoError(err) => ProcessSingleJobError::from_io_error(err),
          }
        })?;

    info!("Finished downloading and moving file to {:?}", &cache_filesystem_path);

    safe_delete_file(&temp_path);
    safe_delete_directory(&temp_dir);

    Ok(cache_filesystem_path)
  }


  fn is_model_already_cached(&self, model_weight: &RetrievedModelWeight, full_cache_filesystem_path: &PathBuf) -> Result<bool, ProcessSingleJobError> {
    if !full_cache_filesystem_path.exists() {
      warn!("Model weight (type {:?} token {:?}) does not already exist at path {:?}",
        &model_weight.weights_type,
        &model_weight.token,
        &full_cache_filesystem_path);

      return Ok(false);
    }

    info!("Model weight (type {:?} token {:?}) exists at path {:?}",
      &model_weight.weights_type,
      &model_weight.token,
      &full_cache_filesystem_path);

    if let Some(existing_file_minimum_size_required) = self.maybe_cached_file_minimum_size_required {
      let size = file_size(full_cache_filesystem_path)
          .map_err(|err| ProcessSingleJobError::from_anyhow_error(err))?;

      info!("Model weight has file size = {size}");

      if size < existing_file_minimum_size_required {
        return Ok(false); // NB: We want to re-download the file.
      }
    }

    // TODO(bt, 2022-07-15): Check signature of file as best proof of file validity
    Ok(true)
  }


  async fn report_progress(&self, _description: String) {
    if let Some(_job_progress_reporter) = &self.maybe_job_progress_reporter {
      // TODO(bt,2024-02-10): Needs interior mutability. Meh. Also fail open.
      //job_progress_reporter.log_status(&description)
      //    .map_err(|e| ProcessSingleJobError::Other(e))?;
    }
  }
}
