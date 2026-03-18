use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::studio_gen2::studio_gen2_dependencies::StudioGen2Dependencies;
use std::path::PathBuf;
use tempdir::TempDir;

/// This is a temporary measure until we start using tempdirs for intermediate inputs and outputs.
pub struct StudioGen2Dirs {
  pub input_dir: TempDir,
  pub output_dir: TempDir,
}

impl StudioGen2Dirs {
  pub fn new(deps: &StudioGen2Dependencies) -> Result<Self, ProcessSingleJobError> {
    let input_dir = deps.input_directory.join("input");
    let input_dir = create_dir(input_dir)?;

    let output_dir = deps.output_directory.join("output");
    let output_dir = create_dir(output_dir)?;

    Ok(Self {
      input_dir,
      output_dir,
    })
  }
}


fn create_dir(path: PathBuf) -> Result<TempDir, ProcessSingleJobError> {
  if !path.exists() {
    std::fs::create_dir_all(&path)
        .map_err(|err| ProcessSingleJobError::IoError(err))?;
  }

  let tempdir = TempDir::new_in(&path, "studio_gen2_")
      .map_err(|err| ProcessSingleJobError::IoError(err))?;

  Ok(tempdir)
}
