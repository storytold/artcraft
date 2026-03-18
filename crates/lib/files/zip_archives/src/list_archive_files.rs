use std::path::Path;

use errors::{anyhow, AnyhowResult};

// NB: Untested
pub fn list_archive_files<P: AsRef<Path>>(file_path: P) -> AnyhowResult<Vec<String>> {
  let file = std::fs::File::open(&file_path)?;
  let reader = std::io::BufReader::new(file);
  let mut archive = zip::ZipArchive::new(reader)?;

  let mut entries = Vec::with_capacity(archive.len());

  for i in 0..archive.len() {
    let file = archive.by_index(i)?;

    let _inner_path = match file.enclosed_name() {
      Some(path) => path,
      None => {
        return Err(anyhow!("Entry {} has a suspicious path", file.name()));
      }
    };

    if (*file.name()).ends_with('/') {
      continue; // Directory
    }

    //entries.push(format!("{}", _inner_path.display()));
    entries.push(file.name().to_string());
  }

  Ok(entries)
}
