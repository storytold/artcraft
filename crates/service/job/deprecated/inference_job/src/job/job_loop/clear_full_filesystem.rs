use std::path::Path;

use log::warn;

use collections::multiple_random_from_vec::multiple_random_from_vec;
use errors::AnyhowResult;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use jobs_common::semi_persistent_cache_dir::SemiPersistentCacheDir;

pub fn clear_full_filesystem(cache_dir: &SemiPersistentCacheDir) -> AnyhowResult<()> {
  warn!("Deleting cached models to free up disk space.");

  decimate_directory(cache_dir.custom_vocoder_model_directory())?;
  decimate_directory(cache_dir.tts_synthesizer_model_directory())?;
  decimate_directory(cache_dir.voice_conversion_model_directory())?;

  Ok(())
}

fn decimate_directory(path: &Path) -> AnyhowResult<()> {
  // TODO: When this is no longer sufficient, delete other types of locally-cached data.
  let paths = std::fs::read_dir(path)?
      .map(|res| res.map(|e| e.path()))
      .collect::<Result<Vec<_>, std::io::Error>>()?;

  let quarter = paths.len() / 4;

  let models_to_delete = multiple_random_from_vec(&paths, quarter);

  for model_to_delete in models_to_delete {
    warn!("Deleting cached model file: {:?}", model_to_delete);

    let full_model_path = path.join(model_to_delete);
    safe_delete_file(full_model_path);
  }

  Ok(())
}
