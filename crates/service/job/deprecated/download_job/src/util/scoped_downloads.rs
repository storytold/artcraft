use std::collections::BTreeSet;

use anyhow::anyhow;
use log::info;

use enums::by_table::generic_download_jobs::generic_download_type::GenericDownloadType;
use errors::AnyhowResult;

/// Download types can be scoped down to only certain model types or categories.
#[derive(Clone)]
pub struct ScopedDownloads {
  /// If set, only these types of model type will be inferred.
  /// None means no scoping, so all types can execute.
  scoped_types: Option<BTreeSet<GenericDownloadType>>,
}

impl ScopedDownloads {

  pub fn new_from_set(scoped_types: BTreeSet<GenericDownloadType>) -> Self {
    Self {
      scoped_types: Some(scoped_types),
    }
  }

  pub fn new_from_env() -> AnyhowResult<Self> {
    let scoped_types =
        match easyenv::get_env_string_optional("SCOPED_DOWNLOAD_TYPES") {
          Some(comma_separated_types) => Some(parse_download_types(&comma_separated_types)?),
          None => None,
        };

    if let Some(types) = scoped_types.as_ref() {
      info!("Scoping download to model types: {:?}", types);
    }

    Ok(Self {
      scoped_types,
    })
  }

  pub fn can_run_job(&self, job_model_type: GenericDownloadType) -> bool {
    match self.scoped_types {
      None => true,
      Some(ref types) => types.contains(&job_model_type),
    }
  }

  pub fn get_scoped_model_types(&self) -> Option<&BTreeSet<GenericDownloadType>> {
    self.scoped_types.as_ref()
  }
}

pub fn parse_download_types(comma_separated_types: &str) -> AnyhowResult<BTreeSet<GenericDownloadType>> {
  let scoped_types = comma_separated_types.trim()
      .split(",")
      .map(|val| val.to_lowercase())
      .collect::<Vec<String>>();

  let mut model_types = BTreeSet::new();

  for t in scoped_types.into_iter() {
    let model_type = GenericDownloadType::from_str(&t)
        .map_err(|_err| anyhow!(
          "Invalid model type: {:?}; should include only items from: {:?}",
          t,
          GenericDownloadType::all_variants()))?;

    model_types.insert(model_type);
  }

  Ok(model_types)
}

#[cfg(test)]
mod tests {
  use std::collections::BTreeSet;

  use enums::by_table::generic_download_jobs::generic_download_type::GenericDownloadType;

  use crate::util::scoped_downloads::{parse_download_types, ScopedDownloads};

  #[test]
  fn test_parse() {
    assert_eq!(parse_download_types("rvc_v2,so_vits_svc").unwrap(),
      BTreeSet::from([GenericDownloadType::RvcV2, GenericDownloadType::SoVitsSvc]));
  }

  #[test]
  fn test_can_execute() {
    let scoping = ScopedDownloads::new_from_set(BTreeSet::from([
      GenericDownloadType::RvcV2,
      GenericDownloadType::Vits,
    ]));

    assert_eq!(true, scoping.can_run_job(GenericDownloadType::RvcV2));
    assert_eq!(true, scoping.can_run_job(GenericDownloadType::Vits));

    assert_eq!(false, scoping.can_run_job(GenericDownloadType::SoVitsSvc));
    assert_eq!(false, scoping.can_run_job(GenericDownloadType::Tacotron2));
  }
}
