use std::io::{BufReader, Cursor, Read};

use log::{error, info, warn};
use zip::ZipArchive;

use bucket_paths::legacy::typified_paths::public::weight_files::bucket_directory::WeightFileBucketDirectory;
use bucket_paths::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;
use cloud_storage::bucket_client::BucketClient;
use filesys::path_to_string::path_to_string;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;

use crate::job::job_types::gpt_sovits::model_package::model_package::{GptSovitsPackageDetails, GptSovitsPackageError, GptSovitsPackageFile, GptSovitsPackageFileType};
use crate::job::job_types::gpt_sovits::upload_model::get_gptsovits_zip_entries::get_gptsovits_zip_entries;

pub async fn extract_and_upload_gpt_sovits_package_files(
  zip_container_file_bytes: &[u8],
  bucket_client: &BucketClient,
  weights_file_bucket_directory: &WeightFileBucketDirectory,
) -> Result<GptSovitsPackageDetails, GptSovitsPackageError> {
  let cursor = Cursor::new(zip_container_file_bytes);
  let reader = BufReader::new(cursor);
  let mut archive = ZipArchive::new(reader)
    .map_err(|err| {
      error!("Error reading zip archive: {:?}", err);
      GptSovitsPackageError::InvalidArchive
    })?;

  if archive.len() > 255 {
    return Err(GptSovitsPackageError::TooManyFiles);
  }

  let mut gpt_model: Option<GptSovitsPackageFile> = None;
  let mut sovits_checkpoint: Option<GptSovitsPackageFile> = None;
  let mut reference_audio: Option<GptSovitsPackageFile> = None;
  let mut reference_transcript : Option<GptSovitsPackageFile> = None;

  let entries = get_gptsovits_zip_entries(&mut archive)?;

  for entry in entries.iter() {
    info!("Entry: {:?}", entry);

    let enclosed_name = path_to_string(&entry.enclosed_name);

    let mut file = archive.by_name(&enclosed_name)
      .map_err(|err| {
        error!("Problem reading file from archive: {:?}", err);
        GptSovitsPackageError::InvalidArchive
      })?;

    let mut zip_item_bytes = Vec::new();

    file.read_to_end(&mut zip_item_bytes)
      .map_err(|err| {
        error!("Problem reading file from archive: {:?}", err);
        GptSovitsPackageError::ExtractionError
      })?;

    match entry.package_type {
      GptSovitsPackageFileType::GptModel => {
        let bucket_public_upload_path = WeightFileBucketPath::from_object_hash(
          weights_file_bucket_directory.get_object_hash(),
          Some("weight_"),
          Some(&entry.package_type.get_expected_package_suffix()),
        );
        info!("Uploading GPT model to: {}", bucket_public_upload_path.get_full_object_path_str());
        bucket_client.upload_file(
          bucket_public_upload_path.get_full_object_path_str(),
          zip_item_bytes.as_ref())
          .await
          .map_err(|e| {
            warn!("Upload gpt package to bucket error: {:?}", e);
            GptSovitsPackageError::UploadError
          })?;

        let hash = sha256_hash_bytes(&zip_item_bytes)
          .map_err(|io_error| {
            error!("Problem hashing bytes: {:?}", io_error);
            GptSovitsPackageError::UploadError
          })?;

        let file_size_bytes = zip_item_bytes.len();

        gpt_model = Some(GptSovitsPackageFile {
          public_upload_path: bucket_public_upload_path,
          sha256_checksum: hash,
          file_size_bytes: file_size_bytes as u64,
        });
      },
      GptSovitsPackageFileType::SovitsCheckpoint => {
        let bucket_public_upload_path = WeightFileBucketPath::from_object_hash(
          weights_file_bucket_directory.get_object_hash(),
          Some("weight_"),
          Some(&entry.package_type.get_expected_package_suffix()),
        );
        info!("Uploading sovits checkpoint to {:?}", bucket_public_upload_path.get_full_object_path_str());
        bucket_client.upload_file(
          bucket_public_upload_path.get_full_object_path_str(),
          zip_item_bytes.as_ref())
          .await
          .map_err(|e| {
            warn!("Upload sovits package to bucket error: {:?}", e);
            GptSovitsPackageError::UploadError
          })?;

        let hash = sha256_hash_bytes(&zip_item_bytes)
          .map_err(|io_error| {
            error!("Problem hashing bytes: {:?}", io_error);
            GptSovitsPackageError::UploadError
          })?;

        let file_size_bytes = zip_item_bytes.len();

        sovits_checkpoint = Some(GptSovitsPackageFile {
          public_upload_path: bucket_public_upload_path,
          sha256_checksum: hash,
          file_size_bytes: file_size_bytes as u64,
        });
      },
      GptSovitsPackageFileType::ReferenceAudio => {
        let bucket_public_upload_path = WeightFileBucketPath::from_object_hash(
          weights_file_bucket_directory.get_object_hash(),
          Some("weight_"),
          Some(&entry.package_type.get_expected_package_suffix()),
        );
        info!("Uploading reference audio package to {:?}", bucket_public_upload_path.get_full_object_path_str());
        bucket_client.upload_file(
          bucket_public_upload_path.get_full_object_path_str(),
          zip_item_bytes.as_ref())
          .await
          .map_err(|e| {
            warn!("Upload reference audio package to bucket error: {:?}", e);
            GptSovitsPackageError::UploadError
          })?;

        let hash = sha256_hash_bytes(&zip_item_bytes)
          .map_err(|io_error| {
            error!("Problem hashing bytes: {:?}", io_error);
            GptSovitsPackageError::UploadError
          })?;

        let file_size_bytes = zip_item_bytes.len();

        reference_audio = Some(GptSovitsPackageFile {
          public_upload_path: bucket_public_upload_path,
          sha256_checksum: hash,
          file_size_bytes: file_size_bytes as u64,
        });
      },
      GptSovitsPackageFileType::ReferenceTranscript => {
        let bucket_public_upload_path = WeightFileBucketPath::from_object_hash(
          weights_file_bucket_directory.get_object_hash(),
          Some("weight_"),
          Some(&entry.package_type.get_expected_package_suffix()),
        );
        info!("Uploading reference transcript package to {:?}", bucket_public_upload_path.get_full_object_path_str());
        bucket_client.upload_file(
          bucket_public_upload_path.get_full_object_path_str(),
          zip_item_bytes.as_ref())
            .await
            .map_err(|e| {
              warn!("Upload reference transcript package to bucket error: {:?}", e);
              GptSovitsPackageError::UploadError
            })?;

        let hash = sha256_hash_bytes(&zip_item_bytes)
            .map_err(|io_error| {
              error!("Problem hashing bytes: {:?}", io_error);
              GptSovitsPackageError::UploadError
            })?;

        let file_size_bytes = zip_item_bytes.len();

        reference_transcript = Some(GptSovitsPackageFile {
          public_upload_path: bucket_public_upload_path,
          sha256_checksum: hash,
          file_size_bytes: file_size_bytes as u64,
        });
      },
    }
  }

  Ok(GptSovitsPackageDetails {
    gpt_model: gpt_model.ok_or(GptSovitsPackageError::InvalidArchive)?,
    sovits_checkpoint: sovits_checkpoint.ok_or(GptSovitsPackageError::InvalidArchive)?,
    reference_audio: reference_audio.ok_or(GptSovitsPackageError::InvalidArchive)?,
    reference_transcript: reference_transcript.ok_or(GptSovitsPackageError::InvalidArchive)?,
  })
}
