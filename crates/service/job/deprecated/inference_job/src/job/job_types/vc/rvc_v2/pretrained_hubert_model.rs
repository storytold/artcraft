use std::path::PathBuf;

use anyhow::anyhow;
use log::{error, info};

use cloud_storage::bucket_client::BucketClient;
use filesys::create_dir_all_if_missing::create_dir_all_if_missing;
use filesys::file_exists::file_exists;
use filesys::rename_across_devices::rename_across_devices;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::util::filesystem::scoped_temp_dir_creator::ScopedTempDirCreator;

#[derive(Clone)]
pub struct PretrainedHubertModel {
  pub cloud_bucket_path: String,
  pub filesystem_path: PathBuf,
}

impl PretrainedHubertModel {
  pub fn from_env() -> Self {
    // NB: For now rvc-v2 is all that uses this hubert, but other models
    // may (re)use it in the future.
    let cloud_bucket_path = easyenv::get_env_string_or_default(
      "RVC_V2_PRETRAINED_HUBERT_BUCKET_PATH",
      "/hubert_pretrained/rvc_v2_hubert_base.pt");

    // NB: For now rvc-v2 is all that uses this hubert, but other models
    // may (re)use it in the future.
    let filesystem_path = easyenv::get_env_pathbuf_or_default(
      "RVC_V2_PRETRAINED_HUBERT_FILESYSTEM_PATH",
      // NB: For now this path is on the shared SMB drive in GKE K8S
      "/tmp/downloads/hubert/rvc_v2_hubert_base.pt");

    Self {
      cloud_bucket_path,
      filesystem_path,
    }
  }

  pub async fn download_if_not_on_filesystem(
    &self,
    bucket_client: &BucketClient,
    scoped_tempdir_creator: &ScopedTempDirCreator,
  ) -> Result<(), ProcessSingleJobError> {
    if file_exists(&self.filesystem_path) {
      return Ok(());
    }

    if let Some(parent_directory_path) = self.filesystem_path.parent() {
      create_dir_all_if_missing(parent_directory_path)?;
    }

    // NB: Download to temp directory to stop concurrent writes and race conditions from other
    // workers writing to a shared volume.
    // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
    let temp_dir = scoped_tempdir_creator.new_tempdir("hubert_download")
        .map_err(|e| anyhow!("problem creating tempdir: {:?}", e))?;

    let temp_path = temp_dir.path().join("download.part");

    info!("Downloading hubert from bucket path: {:?}", &self.cloud_bucket_path);

    bucket_client.download_file_to_disk(&self.cloud_bucket_path, &temp_path)
        .await
        .map_err(|e| {
          error!("could not download hubert model to disk: {:?}", e);
          safe_delete_directory(&temp_dir);
          anyhow!("couldn't download cloud object to disk: {:?}", e)
        })?;

    info!("Downloaded hubert from bucket");

    info!("Renaming hubert file from {:?} to {:?}!", &temp_path, &self.filesystem_path);

    rename_across_devices(&temp_path, &self.filesystem_path)
        .map_err(|e| {
          error!("could rename hubert model on disk: {:?}", e);
          safe_delete_directory(&temp_dir);
          anyhow!("couldn't rename disk files: {:?}", e)
        })?;

    info!("Finished downloading hubert file to {:?}", &self.filesystem_path);

    safe_delete_directory(&temp_dir);

    Ok(())
  }
}
