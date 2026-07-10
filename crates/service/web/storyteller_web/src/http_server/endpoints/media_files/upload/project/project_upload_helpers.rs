//! Small helpers shared by [`super::save_new_project`] and
//! [`super::update_project`].

use std::io::Read;

use actix_multipart::form::tempfile::TempFile;
use log::{error, info, warn};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::upload::project::project_upload_config::{ProjectUploadConfig, PROJECT_MIMETYPE};
use crate::state::server_state::ServerState;

pub(super) fn read_and_hash_form_file(file: &mut TempFile) -> Result<(Vec<u8>, String), CommonWebError> {
  let mut file_bytes = Vec::new();
  file.file.read_to_end(&mut file_bytes)
      .map_err(|err| {
        error!("Problem reading uploaded project file: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  let sha256_checksum = sha256_hash_bytes(&file_bytes)
      .map_err(|err| {
        error!("Problem hashing uploaded project file: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  Ok((file_bytes, sha256_checksum))
}

pub(super) async fn upload_project_to_bucket(
  server_state: &ServerState,
  config: &ProjectUploadConfig,
  file_bytes: &[u8],
) -> Result<MediaFileBucketPath, CommonWebError> {
  let public_upload_path = MediaFileBucketPath::generate_new(
    Some(config.bucket_prefix), Some(config.bucket_suffix));

  info!("Uploading project media to bucket path: {}",
    public_upload_path.get_full_object_path_str());

  server_state.public_bucket_client.upload_file_with_content_type_process(
    public_upload_path.get_full_object_path_str(),
    file_bytes,
    PROJECT_MIMETYPE)
      .await
      .map_err(|err| {
        warn!("Upload project bytes to bucket error: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  Ok(public_upload_path)
}
