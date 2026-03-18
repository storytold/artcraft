use std::path::Path;

use log::{error, info, warn};

use cloud_storage::bucket_client::BucketClient;
use filesys::file_size::file_size;
use filesys::rename_across_devices::{rename_across_devices, RenameError};
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporter;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::util::filesystem::scoped_temp_dir_creator::ScopedTempDirCreator;

// TODO(bt, 2022-07-15): Make a concrete type for bucket paths

#[deprecated(note="Try to use a more modern downloader instead.")]
pub struct MaybeDownloadArgs<'a> {
  pub name_or_description_of_file: &'a str,
  pub final_filesystem_file_path: &'a Path,
  pub bucket_object_path: &'a Path,
  pub bucket_client: &'a BucketClient,
  pub job_progress_reporter: &'a mut Box<dyn JobProgressReporter>,
  pub job_progress_update_description: &'a str,
  pub job_id: i64,
  pub scoped_tempdir_creator: &'a ScopedTempDirCreator,
  pub maybe_existing_file_minimum_size_required: Option<u64>,
}

#[deprecated(note="Try to use a more modern downloader instead.")]
pub async fn maybe_download_file_from_bucket(
  args: MaybeDownloadArgs<'_>
) -> Result<(), ProcessSingleJobError> {

  if args.final_filesystem_file_path.exists() {
    // TODO(bt, 2022-07-15): Check signature of file as best proof of file validity
    let mut existing_file_is_valid = true;

    if let Some(existing_file_minimum_size_required) = args.maybe_existing_file_minimum_size_required {
      // NB: Sometimes the downloader incompletely downloads files. Typically this is a zero file
      // size, but the Rust system may report a non-zero (but small) number of bytes. This should
      // later be investigated and the heuristic simplified. The intent here is merely to make sure
      // we don't consider these okay:
      //
      //   -rw-r--r-- 1 root root 55824433 Nov 30 00:12 VM:012rkwsv91zb
      //   -rw-r--r-- 1 root root 55823149 Nov 30 00:13 VM:79etbx4fdksv
      //   -rw-r--r-- 1 root root        0 Nov 30 00:52 VM:1dzepsnwzbkc
      //   -rw-r--r-- 1 root root        0 Nov 30 00:29 VM:7c2df5a36qjb
      //
      let size = file_size(args.final_filesystem_file_path)
          .map_err(|err| ProcessSingleJobError::from_anyhow_error(err))?;

      info!("{} exists at path {:?} ; file size = {size}",
        &args.name_or_description_of_file,&args.final_filesystem_file_path);

      if size < existing_file_minimum_size_required {
        existing_file_is_valid = false;
      }
    }

    if existing_file_is_valid {
      return Ok(())
    }
  } else {
    warn!("{} does not exist at path: {:?}", args.name_or_description_of_file, &args.final_filesystem_file_path);
  }

  args.job_progress_reporter.log_status(args.job_progress_update_description)
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  // NB: Download to temp directory to stop concurrent writes and race conditions from other
  // workers writing to a shared volume.
  let temp_dir = format!("temp_download_{}", args.job_id);

  // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let temp_dir = args.scoped_tempdir_creator.new_tempdir(&temp_dir)
      .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  let temp_path = temp_dir.path().join("download.part");

  info!("Downloading {} from bucket path: {:?}", args.name_or_description_of_file, &args.bucket_object_path);

  args.bucket_client.download_file_to_disk(&args.bucket_object_path, &temp_path)
      .await
      .map_err(|e| {
        safe_delete_directory(&temp_dir);
        ProcessSingleJobError::Other(e)
      })?;

  info!("Downloaded {} from bucket!", args.name_or_description_of_file);

  let original_size = file_size(&temp_path)
      .map_err(|err| ProcessSingleJobError::from_anyhow_error(err))?;

  info!("File size of {} temp download file {:?} is {original_size}",
    args.name_or_description_of_file, &temp_path);

  info!("Renaming {} temp file from {:?} to {:?}!",
    args.name_or_description_of_file, &temp_path, &args.final_filesystem_file_path);

  rename_across_devices(&temp_path, &args.final_filesystem_file_path)
      .map_err(|err| {
        error!("could not rename on disk: {:?}", err);
        safe_delete_file(&temp_path);
        safe_delete_directory(&temp_dir);
        match err {
          RenameError::StorageFull => ProcessSingleJobError::FilesystemFull,
          RenameError::IoError(err) => ProcessSingleJobError::from_io_error(err),
        }
      })?;

//  info!("Copying {} temp file from {:?} to {:?}!",
//    args.name_or_description_of_file, &temp_path, &args.final_filesystem_file_path);
//
//  // NB: We're now seeing a bug where the resultant copied file is 0 bytes
//  match copy_with_logging(&temp_path, &args.final_filesystem_file_path) {
//    Err(err) => {
//      error!("Error Copying {} temp file from {:?} to {:?}! {err}",
//        args.name_or_description_of_file, &temp_path, &args.final_filesystem_file_path);
//
//      safe_delete_file(&temp_path);
//      safe_delete_directory(&temp_dir);
//
//      return Err(ProcessSingleJobError::from_anyhow_error(err));
//    }
//    Ok(false) => {
//      error!("Error copying {} temp file from {:?} to {:?}! File size in bytes did not match.",
//        args.name_or_description_of_file, &temp_path, &args.final_filesystem_file_path);
//
//      reattempt_copy_if_failed(&args, &temp_dir, &temp_path, original_size)?;
//    }
//    Ok(true) => {
//      // Success case
//    }
//  }

  info!("Finished downloading {} file to {:?}", args.name_or_description_of_file, &args.final_filesystem_file_path);

  safe_delete_file(&temp_path);
  safe_delete_directory(&temp_dir);

  Ok(())
}

// NB: Debugging failures with rename_across_devices() -
// fn reattempt_copy_if_failed(args: &MaybeDownloadArgs, temp_dir: &TempDir, temp_path: &Path, original_size: u64) -> Result<(), ProcessSingleJobError> {
//   let copied_size = file_size(&args.final_filesystem_file_path)
//       .map_err(|err| ProcessSingleJobError::from_anyhow_error(err))?;
//
//   info!("Final copied size of {} file {:?} is {copied_size} (original size was {original_size})",
//     args.name_or_description_of_file, &args.final_filesystem_file_path);
//
//   if copied_size != 0 {
//     safe_delete_file(&temp_path);
//     safe_delete_directory(&temp_dir);
//
//     return Ok(());
//   }
//
//   error!("Copied size was 0! Removing destination file and retrying...");
//
//   if let Err(err) = std::fs::remove_file(&args.final_filesystem_file_path) {
//     match err.kind() {
//       ErrorKind::NotFound => {
//         // NB: We seem to be seeing this in production.
//         // Perhaps another pod deleted it in a race condition?
//         // Fall through case.
//         warn!("File couldn't be removed: it's already gone.")
//       },
//       _ => {
//         safe_delete_file(&temp_path);
//         safe_delete_directory(&temp_dir);
//         return Err(ProcessSingleJobError::from_io_error(err));
//       }
//     }
//   } else {
//     warn!("File removed.");
//   }
//
//   warn!("Retrying copy...");
//
//   rename_across_devices(&temp_path, &args.final_filesystem_file_path)
//       .map_err(|err| {
//         error!("could not rename on disk: {:?}", err);
//         safe_delete_file(&temp_path);
//         safe_delete_directory(&temp_dir);
//         match err {
//           RenameError::StorageFull => ProcessSingleJobError::FilesystemFull,
//           RenameError::IoError(err) => ProcessSingleJobError::from_io_error(err),
//         }
//       })?;
//
//   let copied_size = file_size(&args.final_filesystem_file_path)
//       .map_err(|err| ProcessSingleJobError::from_anyhow_error(err))?;
//
//   warn!("Last copy attempt. Final copied size of {} file {:?} is {copied_size}.",
//     args.name_or_description_of_file, &args.final_filesystem_file_path);
//
//   Ok(())
// }
//
//
// pub fn copy_with_logging<P: AsRef<Path>, Q: AsRef<Path>>(from: P, to: Q) -> AnyhowResult<bool> {
//   let original_size = file_size(&from)?;
//
//   let num_bytes_copied = std::fs::copy(&from, &to)?;
//
//   let destination_size = file_size(&to)?;
//
//   info!(r#"Copied {:?} to {:?}
//    - Copied bytes: {num_bytes_copied}
//    - Orig. bytes:  {original_size}
//    - Dest. bytes:  {destination_size}
//   "#, from.as_ref(), to.as_ref());
//
//   let file_sizes_match = original_size == destination_size;
//
//   Ok(file_sizes_match)
// }
