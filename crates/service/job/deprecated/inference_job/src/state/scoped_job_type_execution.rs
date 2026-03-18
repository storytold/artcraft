use std::collections::BTreeSet;

use anyhow::anyhow;
use log::info;

use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use errors::AnyhowResult;

/// Execution can be scoped down to run on only certain model types or inference categories.
#[derive(Clone)]
pub struct ScopedJobTypeExecution {
  /// If set, only these types of model type will be inferred.
  /// None means no scoping, so all types can execute.
  scoped_types: Option<BTreeSet<InferenceJobType>>,
}

impl ScopedJobTypeExecution {

  pub fn new_from_set(scoped_types: BTreeSet<InferenceJobType>) -> Self {
    Self {
      scoped_types: Some(scoped_types),
    }
  }

  pub fn new_from_env() -> AnyhowResult<Self> {
    let scoped_types =
        match easyenv::get_env_string_optional("SCOPED_EXECUTION_JOB_TYPES") {
          Some(comma_separated_types) => Some(parse_job_types(&comma_separated_types)?),
          None => None,
        };

    if let Some(types) = scoped_types.as_ref() {
      info!("Scoping execution to job types: {:?}", types);
    }

    Ok(Self {
      scoped_types,
    })
  }

  pub fn can_run_job(&self, job_type: InferenceJobType) -> bool {
    match self.scoped_types {
      None => false,
      Some(ref types) => types.contains(&job_type),
    }
  }

  pub fn get_scoped_job_types(&self) -> Option<&BTreeSet<InferenceJobType>> {
    self.scoped_types.as_ref()
        .filter(|scoped_types| !scoped_types.is_empty())
  }
}

pub fn parse_job_types(comma_separated_types: &str) -> AnyhowResult<BTreeSet<InferenceJobType>> {
  let scoped_types = comma_separated_types.trim()
      .split(",")
      .map(|val| val.trim().to_lowercase())
      .filter(|val| !val.is_empty())
      .collect::<Vec<String>>();

  let mut job_types = BTreeSet::new();

  for t in scoped_types.into_iter() {
    let model_type = InferenceJobType::from_str(&t)
        .map_err(|_err| anyhow!(
          "Invalid job type: {:?}; should include only items from: {:?}",
          t,
          InferenceJobType::all_variants()))?;

    job_types.insert(model_type);
  }

  Ok(job_types)
}

#[cfg(test)]
mod tests {
  use std::collections::BTreeSet;

  use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;

  use crate::state::scoped_job_type_execution::{parse_job_types, ScopedJobTypeExecution};

  #[test]
  fn test_parse() {
    assert_eq!(parse_job_types("rvc_v2,live_portrait").unwrap(),
      BTreeSet::from([InferenceJobType::RvcV2, InferenceJobType::LivePortrait]));
  }

  #[test]
  fn test_parse_empty() {
    assert_eq!(parse_job_types("").unwrap(), BTreeSet::from([]));
    assert_eq!(parse_job_types("   ").unwrap(), BTreeSet::from([]));
    assert_eq!(parse_job_types(" ,,, , ,  ").unwrap(), BTreeSet::from([]));
  }

  #[test]
  fn test_can_execute() {
    let scoping = ScopedJobTypeExecution::new_from_set(BTreeSet::from([
      InferenceJobType::RvcV2,
      InferenceJobType::SadTalker,
    ]));

    assert_eq!(true, scoping.can_run_job(InferenceJobType::RvcV2));
    assert_eq!(true, scoping.can_run_job(InferenceJobType::SadTalker));

    assert_eq!(false, scoping.can_run_job(InferenceJobType::SoVitsSvc));
    assert_eq!(false, scoping.can_run_job(InferenceJobType::LivePortrait));
  }

  #[test]
  fn test_can_execute_empty() {
    let scoping = ScopedJobTypeExecution::new_from_set(BTreeSet::from([]));

    assert_eq!(false, scoping.can_run_job(InferenceJobType::RvcV2));
    assert_eq!(false, scoping.can_run_job(InferenceJobType::SadTalker));
    assert_eq!(false, scoping.can_run_job(InferenceJobType::SoVitsSvc));
    assert_eq!(false, scoping.can_run_job(InferenceJobType::LivePortrait));
  }

  #[test]
  fn test_get_scoped_job_types() {
    let scoping = ScopedJobTypeExecution::new_from_set(BTreeSet::from([
      InferenceJobType::RvcV2,
      InferenceJobType::SadTalker,
    ]));

    assert_eq!(scoping.get_scoped_job_types(), Some(&BTreeSet::from([
      InferenceJobType::RvcV2,
      InferenceJobType::SadTalker,
    ])));
  }

  #[test]
  fn test_get_scoped_job_types_empty() {
    let scoping = ScopedJobTypeExecution::new_from_set(BTreeSet::from([]));

    assert_eq!(scoping.get_scoped_job_types(), None);
  }
}
