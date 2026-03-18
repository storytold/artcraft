use std::path::{Path, PathBuf};

use log::{info, warn};
use tempdir::TempDir;

use errors::AnyhowResult;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use mimetypes::mimetype_for_file::get_mimetype_for_file;

#[derive(Debug)]
pub enum DownloadedRvcFile {
  /// Error - wrong file type was uploaded
  InvalidModel,

  /// Only the model file (.pth) was uploaded
  ModelFileOnly {
    model_file: PathBuf,
  },

  /// Archive containing both files was uploaded.
  ModelAndIndexFile {
    model_file: PathBuf,
    index_file: PathBuf,
  },
}

pub fn extract_rvc_files(download_file: &Path, temp_dir: &TempDir) -> AnyhowResult<DownloadedRvcFile> {
  let maybe_mimetype = get_mimetype_for_file(download_file)?;

  if maybe_mimetype != Some("application/zip") {
    warn!("File must be an application/zip (either .pth or .zip)");
    return Ok(DownloadedRvcFile::InvalidModel);
  }

  info!("Opening download archive: {:?}", &download_file);

  let file = std::fs::File::open(download_file)?;
  let reader = std::io::BufReader::new(file);
  let mut archive = zip::ZipArchive::new(reader)?;

  if archive.len() > 50 {
    // If there are hundreds of entries, this is likely a .pth file rather than .zip file.
    // The fact that it looks like a zip file is a consequence of the .pth serialization format
    // being the same as zip archives.
    // In any case, we'll verify that the model is valid downstream of this call.
    return Ok(DownloadedRvcFile::ModelFileOnly { model_file: download_file.to_path_buf() });
  }

  if archive.len() > 7 {
    // There's something suspicious if the model files has more than 7 entries.
    // It should have the .pth file, a .index file, and _maybe_ a .txt file for credits.
    // Mac users sometimes have a bogus __MACOSX directory, which may double the file count.
    warn!("File has wrong number of entries to be a valid model: {}", archive.len());
    return Ok(DownloadedRvcFile::InvalidModel);
  }

  let mut maybe_path_to_model = None;
  let mut maybe_path_to_index = None;

  info!("Reading archive contents...");

  for i in 0..archive.len() {
    let mut file = archive.by_index(i)?;
    let filename = file.name().to_lowercase();

    if filename.starts_with("__macosx/") {
      // Mac users sometimes have a bogus __MACOSX directory, which may double the file count.
      continue;
    }

    let temp_file_path;

    if filename.ends_with(".pth") {
      temp_file_path = temp_dir.path().join("model.pth");
      maybe_path_to_model = Some(temp_file_path.clone());
    } else if filename.ends_with(".index") || filename.ends_with(".idx") {
      temp_file_path = temp_dir.path().join("model.index");
      maybe_path_to_index = Some(temp_file_path.clone());
    } else {
      continue;
    }

    info!("Extracting item {} to {:?} ...", i, &temp_file_path);

    let mut outfile = std::fs::File::create(&temp_file_path)?;
    std::io::copy(&mut file, &mut outfile)?;
  }

  let path_to_model = match maybe_path_to_model {
    Some(path_to_model) => path_to_model,
    None => {
      // It isn't valid to not have a model file.
      if let Some(path_to_index) = maybe_path_to_index {
        safe_delete_file(&path_to_index);
      }
      warn!("Archive did not have a model file within.");
      return Ok(DownloadedRvcFile::InvalidModel);
    }
  };

  if let Some(path_to_index) = maybe_path_to_index {
    Ok(DownloadedRvcFile::ModelAndIndexFile {
      model_file: path_to_model,
      index_file: path_to_index,
    })
  } else {
    Ok(DownloadedRvcFile::ModelFileOnly {
      model_file: path_to_model,
    })
  }
}

#[cfg(test)]
mod tests {
  use std::str::FromStr;

  use anyhow::bail;
  use tempdir::TempDir;

  use errors::AnyhowResult;
  use storyteller_root::get_seed_tool_data_root;

  use crate::job_types::voice_conversion::rvc_v2::extract_rvc_files::{DownloadedRvcFile, extract_rvc_files};

  #[test]
  #[ignore]
  fn test_rvc_with_macos_directory() -> AnyhowResult<()> {
    let root = get_seed_tool_data_root();
    let broken_model = root.join("models/rvc/sakura-hkt48.zip");
    let tempdir = TempDir::new("test").expect("tempdir creation failed");

    let extracted = extract_rvc_files(&broken_model, &tempdir).unwrap();

    match extracted {
      DownloadedRvcFile::InvalidModel => bail!("should not be broken"),
      DownloadedRvcFile::ModelFileOnly { .. } => bail!("should not be model file only"),
      DownloadedRvcFile::ModelAndIndexFile { model_file, index_file } => {
        assert!(model_file.ends_with("model.pth"));
        assert!(index_file.ends_with("model.index"));
      }
    }

    Ok(())
  }
}