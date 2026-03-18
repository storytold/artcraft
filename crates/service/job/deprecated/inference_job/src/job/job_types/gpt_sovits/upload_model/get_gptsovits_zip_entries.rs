use std::io::{BufReader, Read, Seek};
use std::path::PathBuf;

use log::{error, info};
use zip::ZipArchive;

use crate::job::job_types::gpt_sovits::model_package::model_package::{GptSovitsPackageError, GptSovitsPackageFileType};

// We want most of our users to name the reference audio and text transcript files as
// "reference.wav" and "reference.txt" respectively. (Even if this isn't universally
// adopted as standard, we can use heuristics to make other inputs work.)
const EXPECTED_REFERENCE_FILE_STEM : &str = "reference";

// Justin's files start with "ref_audio" and "ref_text". He packs other audio files in
// as well, so we'll want to ignore those.
const BACKUP_REFERENCE_FILE_PREFIX: &str = "ref_";

#[derive(Debug,Clone)]
pub struct PackageZipEntryDetails {
  pub package_type: GptSovitsPackageFileType,
  pub enclosed_name: PathBuf,
  pub stem: String,
  pub extension: String,
  pub maybe_better_alternative_output_name: String,
  pub file_size: u64,
  pub is_valid_file_extension: bool,
}

pub fn get_gptsovits_zip_entries<R: Read + Seek>(archive: &mut ZipArchive<BufReader<R>>) -> Result<Vec<PackageZipEntryDetails>, GptSovitsPackageError> {
  let entries = find_archive_files_of_interest(archive)?;
  let entries = filter_expected_reference_file_names(entries)?;
  let entries = filter_prefixed_reference_file_names(entries)?;
  let entries = filter_matching_reference_file_names(entries)?;
  let entries = fail_on_duplicate_files(entries)?;
  let entries = fail_on_no_models(entries)?;

  for entry in entries.iter() {
    info!("Entry: {:?}", entry);
  }

  Ok(entries)
}

fn find_archive_files_of_interest<R: Read + Seek>(archive: &mut ZipArchive<BufReader<R>>) -> Result<Vec<PackageZipEntryDetails>, GptSovitsPackageError> {
  let mut entries: Vec<PackageZipEntryDetails> = Vec::with_capacity(archive.len());

  for i in 0..archive.len() {
    info!("Reading file {}...", i);

    let file = archive.by_index(i)
        .map_err(|err| {
          error!("Problem reading file from archive: {:?}", err);
          GptSovitsPackageError::InvalidArchive
        })?;

    let filename = file.name();
    let filename_lowercase = filename.to_lowercase();

    info!("File {} is {:?} - is file = {}", i, filename, file.is_file());
    info!("Enclosed name: {:?}", file.enclosed_name());

    if file.is_dir() {
      info!("Skipping directory: {:?}", filename);
      continue;
    }

    if filename_lowercase.starts_with("__macosx/") {
      info!("Skipping __MACOSX directory entry: {:?}", filename);
      // Mac users sometimes have a bogus __MACOSX directory, which may double the file count.
      continue;
    }

    let enclosed_name = match file.enclosed_name() {
      None => {
        info!("No enclosed name for file: {:?}", filename);
        continue;
      },
      Some(name) => name,
    };

    // "reference.wav" --> "reference"
    let maybe_stem = enclosed_name.file_stem()
        .map(|stem| stem.to_str())
        .flatten();

    // "reference.wav" --> "wav"
    let maybe_extension = enclosed_name.extension()
        .map(|ext| ext.to_str())
        .flatten();

    let stem = match maybe_stem {
      Some(stem) => stem,
      None => {
        info!("No stem for file: {:?}", filename);
        continue;
      }
    };

    let extension = match maybe_extension {
      Some(extension) => extension,
      None => {
        info!("No extension for file: {:?}", filename);
        continue;
      }
    };

    info!("Attempting to process file with name {} extension: {}", enclosed_name.display(), extension);

    match GptSovitsPackageFileType::for_extension(extension) {
      None => {
        info!("Skipping file with name {} extension: {}", enclosed_name.display(), extension);
        continue;
      }
      Some(package_type) => {
        info!("Adding file with name {} extension: {}", enclosed_name.display(), extension);
        entries.push(PackageZipEntryDetails {
          enclosed_name: enclosed_name.to_path_buf(),
          maybe_better_alternative_output_name: package_type.package_identifier().to_string(),
          file_size: file.size(),
          is_valid_file_extension: package_type.extension_is_allowed(extension),
          package_type,
          extension: extension.to_string(),
          stem: stem.to_string(),
        });
      }
    }
  }

  Ok(entries)
}

fn filter_expected_reference_file_names(entries: Vec<PackageZipEntryDetails>) -> Result<Vec<PackageZipEntryDetails>, GptSovitsPackageError> {
  let mut filtered = Vec::with_capacity(entries.len());
  let mut audio_reference_files = Vec::with_capacity(entries.len());
  let mut text_reference_files = Vec::with_capacity(entries.len());

  for entry in entries {
    if let Some(package_type) = GptSovitsPackageFileType::for_extension(&entry.extension) {
      match package_type {
        GptSovitsPackageFileType::GptModel | GptSovitsPackageFileType::SovitsCheckpoint => filtered.push(entry),
        GptSovitsPackageFileType::ReferenceAudio => audio_reference_files.push(entry),
        GptSovitsPackageFileType::ReferenceTranscript => text_reference_files.push(entry),
      }
    }
  }

  let maybe_audio = audio_reference_files.iter()
      .find(|file| {
        &file.stem == EXPECTED_REFERENCE_FILE_STEM
      });

  let maybe_text = text_reference_files.iter()
      .find(|file| {
        &file.stem == EXPECTED_REFERENCE_FILE_STEM
      });

  // If we find both names as expected, discard any and all other audio and text files.
  if let Some(audio) = maybe_audio {
    if let Some(text) = maybe_text {
      audio_reference_files = vec![audio.clone()];
      text_reference_files = vec![text.clone()];
    }
  }

  filtered.extend(audio_reference_files);
  filtered.extend(text_reference_files);

  Ok(filtered)
}

fn filter_matching_reference_file_names(entries: Vec<PackageZipEntryDetails>) -> Result<Vec<PackageZipEntryDetails>, GptSovitsPackageError> {
  let mut filtered = Vec::with_capacity(entries.len());
  let mut audio_reference_files = Vec::with_capacity(entries.len());
  let mut text_reference_files = Vec::with_capacity(entries.len());

  for entry in entries {
    if let Some(package_type) = GptSovitsPackageFileType::for_extension(&entry.extension) {
      match package_type {
        GptSovitsPackageFileType::GptModel | GptSovitsPackageFileType::SovitsCheckpoint => filtered.push(entry),
        GptSovitsPackageFileType::ReferenceAudio => audio_reference_files.push(entry),
        GptSovitsPackageFileType::ReferenceTranscript => text_reference_files.push(entry),
      }
    }
  }

  let maybe_audio = audio_reference_files.iter()
      .find(|file| {
        file.stem.starts_with(BACKUP_REFERENCE_FILE_PREFIX)
      });

  let maybe_text = text_reference_files.iter()
      .find(|file| {
        file.stem.starts_with(BACKUP_REFERENCE_FILE_PREFIX)
      });

  // If we find both names as expected, discard any and all other audio and text files.
  if let Some(audio) = maybe_audio {
    if let Some(text) = maybe_text {
      audio_reference_files = vec![audio.clone()];
      text_reference_files = vec![text.clone()];
    }
  }

  filtered.extend(audio_reference_files);
  filtered.extend(text_reference_files);

  Ok(filtered)
}

fn filter_prefixed_reference_file_names(entries: Vec<PackageZipEntryDetails>) -> Result<Vec<PackageZipEntryDetails>, GptSovitsPackageError> {
  let mut filtered = Vec::with_capacity(entries.len());
  let mut audio_reference_files = Vec::with_capacity(entries.len());
  let mut text_reference_files = Vec::with_capacity(entries.len());

  for entry in entries {
    if let Some(package_type) = GptSovitsPackageFileType::for_extension(&entry.extension) {
      match package_type {
        GptSovitsPackageFileType::GptModel | GptSovitsPackageFileType::SovitsCheckpoint => filtered.push(entry),
        GptSovitsPackageFileType::ReferenceAudio => audio_reference_files.push(entry),
        GptSovitsPackageFileType::ReferenceTranscript => text_reference_files.push(entry),
      }
    }
  }

  // If there are multiple audio files, try to pair them with matching text transcript files on the basis of name matching.
  if audio_reference_files.len() > 1 {
    for text_reference in text_reference_files.iter() {
      let maybe_audio = audio_reference_files.iter()
          .find(|audio| {
            &audio.stem == &text_reference.stem
          });

      if let Some(audio) = maybe_audio {
        audio_reference_files = vec![audio.clone()];
        text_reference_files = vec![text_reference.clone()];
        break;
      }
    }
  }

  // If there are multiple text transcript files, try to pair them with matching audio files on the basis of name matching.
  if text_reference_files.len() > 1 {
    for audio_reference in audio_reference_files.iter() {
      let maybe_text = text_reference_files.iter()
          .find(|text| {
            &text.stem == &audio_reference.stem
          });

      if let Some(text) = maybe_text {
        text_reference_files = vec![text.clone()];
        audio_reference_files = vec![audio_reference.clone()];
        break;
      }
    }
  }

  filtered.extend(audio_reference_files);
  filtered.extend(text_reference_files);

  Ok(filtered)
}

fn fail_on_duplicate_files(entries: Vec<PackageZipEntryDetails>) -> Result<Vec<PackageZipEntryDetails>, GptSovitsPackageError> {
  let mut filtered = Vec::with_capacity(entries.len());

  for entry in entries {
    if let Some(package_type) = GptSovitsPackageFileType::for_extension(&entry.extension) {
      if filtered.iter().any(|entry: &PackageZipEntryDetails| &entry.package_type == &package_type) {
        return match package_type {
          GptSovitsPackageFileType::GptModel => {
            Err(GptSovitsPackageError::InvalidGPTModel("Multiple GPT models found".to_string()))
          }
          GptSovitsPackageFileType::SovitsCheckpoint => {
            Err(GptSovitsPackageError::InvalidSovitsCheckpoint("Multiple Sovits checkpoints found".to_string()))
          }
          GptSovitsPackageFileType::ReferenceAudio => {
            Err(GptSovitsPackageError::InvalidReferenceAudio("Multiple reference audio files found".to_string()))
          }
          GptSovitsPackageFileType::ReferenceTranscript => {
            Err(GptSovitsPackageError::InvalidReferenceTranscript("Multiple reference transcript files found".to_string()))
          }
        }
      }
      filtered.push(entry);
    }
  }

  Ok(filtered)
}

fn fail_on_no_models(entries: Vec<PackageZipEntryDetails>) -> Result<Vec<PackageZipEntryDetails>, GptSovitsPackageError> {
  // Only the model files are truly essential
  let has_no_gpt = entries.iter()
      .find(|entry| entry.package_type == GptSovitsPackageFileType::GptModel)
      .is_none();

  let has_no_sovits = entries.iter()
      .find(|entry| entry.package_type == GptSovitsPackageFileType::SovitsCheckpoint)
      .is_none();

  if has_no_gpt || has_no_sovits {
    return Err(GptSovitsPackageError::InvalidArchive);
  }

  Ok(entries)
}

#[cfg(test)]
mod tests {
  use std::fs::File;
  use std::io::BufReader;

  use zip::ZipArchive;

  use testing::test_file_path::test_file_path;

  use crate::job::job_types::gpt_sovits::model_package::model_package::{GptSovitsPackageError, GptSovitsPackageFileType};
  use crate::job::job_types::gpt_sovits::upload_model::get_gptsovits_zip_entries::get_gptsovits_zip_entries;

  fn read_archive(path: &str) -> ZipArchive<BufReader<File>> {
    let path = test_file_path(path).unwrap();
    let file = File::open(path).unwrap();
    let reader = BufReader::new(file);
    ZipArchive::new(reader).unwrap()
  }

  #[test]
  fn test_empty_archive() {
    let mut archive = read_archive("test_data/archive/zip/empty.zip");
    let result = get_gptsovits_zip_entries(&mut archive);
    assert!(result.is_err());
    assert_eq!(result.err().unwrap(), GptSovitsPackageError::InvalidArchive);
  }

  #[test]
  fn test_archive_with_just_model() {
    let mut archive = read_archive("test_data/archive/zip/gptsovits/just_model.zip");
    let result = get_gptsovits_zip_entries(&mut archive);

    assert!(result.is_ok());

    let result = result.unwrap();
    assert_eq!(result.len(), 2);

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::GptModel).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "just_model/gpt.ckpt");

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::SovitsCheckpoint).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "just_model/sovits.pth");
  }

  #[test]
  fn test_archive_with_single_files() {
    let mut archive = read_archive("test_data/archive/zip/gptsovits/all_files.zip");
    let result = get_gptsovits_zip_entries(&mut archive);

    assert!(result.is_ok());

    let result = result.unwrap();
    assert_eq!(result.len(), 4);

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::GptModel).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "all_files/gpt.ckpt");

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::SovitsCheckpoint).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "all_files/sovits.pth");

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::ReferenceAudio).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "all_files/reference.wav");

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::ReferenceTranscript).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "all_files/reference.txt");
  }

  #[test]
  fn test_archive_with_many_files() {
    let mut archive = read_archive("test_data/archive/zip/gptsovits/many_files.zip");
    let result = get_gptsovits_zip_entries(&mut archive);

    assert!(result.is_ok());

    let result = result.unwrap();
    assert_eq!(result.len(), 4);

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::GptModel).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "many_files/gpt.ckpt");

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::SovitsCheckpoint).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "many_files/sovits.pth");

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::ReferenceAudio).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "many_files/reference_file_matching_name.wav");

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::ReferenceTranscript).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "many_files/reference_file_matching_name.txt");
  }

  #[test]
  fn test_justin_archive_format() {
    let mut archive = read_archive("test_data/archive/zip/gptsovits/justin_archive_format.zip");
    let result = get_gptsovits_zip_entries(&mut archive);

    assert!(result.is_ok());

    let result = result.unwrap();
    assert_eq!(result.len(), 4);

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::GptModel).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "justin_archive_format/GokuV2-e100.ckpt");

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::SovitsCheckpoint).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "justin_archive_format/GokuV2_e100_s9000.pth");

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::ReferenceAudio).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "justin_archive_format/ref_audio.wav");

    let entry = result.iter().find(|entry| entry.package_type == GptSovitsPackageFileType::ReferenceTranscript).unwrap();
    assert_eq!(entry.enclosed_name.to_str().unwrap(), "justin_archive_format/ref_text.txt");
  }
}
