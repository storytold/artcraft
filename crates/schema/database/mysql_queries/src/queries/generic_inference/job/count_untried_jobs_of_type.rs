use std::collections::BTreeSet;

use anyhow::anyhow;
use chrono::Utc;
use sqlx::MySqlPool;

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::i8_to_bool;
use crate::payloads::generic_inference_args::generic_inference_args::GenericInferenceArgs;
use crate::queries::generic_inference::job::_keys::GenericInferenceJobId;

pub struct UntriedJobCount {
  pub job_count: usize,
}
pub struct CountUntriedJobsOfTypeArgs<'a> {
  pub maybe_scope_by_job_type: Option<&'a BTreeSet<InferenceJobType>>,
  pub maybe_scope_by_model_type: Option<&'a BTreeSet<InferenceModelType>>,
  pub maybe_scope_by_job_category: Option<&'a BTreeSet<InferenceCategory>>,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn count_untried_jobs_of_type(
  args: CountUntriedJobsOfTypeArgs<'_>,
)
  -> AnyhowResult<UntriedJobCount>
{
  let query = perform_query(args).await;

  let result = query?;
  
  Ok(UntriedJobCount {
    job_count: result.job_count as usize,
  })
}

async fn perform_query(args: CountUntriedJobsOfTypeArgs<'_>) -> Result<UntriedJobCountRawInternal, sqlx::Error> {
  // NB: Can't be type checked because of WHERE IN clause with dynamic contents
  let mut query = core_query(&args);

  let query = sqlx::query_as::<_, UntriedJobCountRawInternal>(&query);

  query.fetch_one(args.mysql_pool)
      .await
}

// TODO(bt,2024-01-25): Make QueryBuilder
fn core_query(args: &CountUntriedJobsOfTypeArgs<'_>) -> String {
  // NB: Can't be type checked because of WHERE IN clause with dynamic contents
  let mut query = r#"
SELECT
  count(*) as job_count

FROM generic_inference_jobs

WHERE
  (
    status IN ("pending")
  )
  AND
  (
    retry_at IS NULL
  )
  AND
  (
    attempt_count = 0
  )
"#.to_string();

  if let Some(job_types) = args.maybe_scope_by_job_type {
    if !job_types.is_empty() {
      query.push_str(&format!(r#"
      AND
      (
        job_type IN ({})
      )
    "#, job_type_predicate(job_types)));
    }
  }

  if let Some(model_types) = args.maybe_scope_by_model_type {
    if !model_types.is_empty() {
      query.push_str(&format!(r#"
      AND
      (
        maybe_model_type IN ({})
      )
    "#, model_type_predicate(model_types)));
    }
  }

  if let Some(inference_categories) = args.maybe_scope_by_job_category {
    if !inference_categories.is_empty() {
      query.push_str(&format!(r#"
      AND
      (
        inference_category IN ({})
      )
    "#, inference_category_predicate(&inference_categories)));
    }
  }

  query
}

#[derive(Debug)]
#[derive(sqlx::FromRow)]
struct UntriedJobCountRawInternal {
  pub job_count: u64,
}

/// Return a comma-separated predicate, since SQLx does not yet support WHERE IN(?) for Vec<T>, etc.
/// Issue: https://github.com/launchbadge/sqlx/issues/875
fn job_type_predicate(types: &BTreeSet<InferenceJobType>) -> String {
  let mut vec = types.iter()
      .map(|ty| ty.to_str())
      .map(|ty| format!("\"{}\"", ty))
      .collect::<Vec<String>>();
  vec.sort(); // NB: For the benefit of tests.
  vec.join(", ")
}

/// Return a comma-separated predicate, since SQLx does not yet support WHERE IN(?) for Vec<T>, etc.
/// Issue: https://github.com/launchbadge/sqlx/issues/875
fn model_type_predicate(types: &BTreeSet<InferenceModelType>) -> String {
  let mut vec = types.iter()
      .map(|ty| ty.to_str())
      .map(|ty| format!("\"{}\"", ty))
      .collect::<Vec<String>>();
  vec.sort(); // NB: For the benefit of tests.
  vec.join(", ")
}

/// Return a comma-separated predicate, since SQLx does not yet support WHERE IN(?) for Vec<T>, etc.
/// Issue: https://github.com/launchbadge/sqlx/issues/875
fn inference_category_predicate(categories: &BTreeSet<InferenceCategory>) -> String {
  let mut vec = categories.iter()
      .map(|ty| ty.to_str())
      .map(|ty| format!("\"{}\"", ty))
      .collect::<Vec<String>>();
  vec.sort(); // NB: For the benefit of tests.
  vec.join(", ")
}

#[cfg(test)]
mod tests {
  use std::collections::BTreeSet;

  use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
  use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
  use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;

  use crate::queries::generic_inference::job::count_untried_jobs_of_type::{inference_category_predicate, job_type_predicate, model_type_predicate};

  #[test]
  fn test_job_type_predicate() {
    // None
    let types = BTreeSet::from([]);
    assert_eq!(job_type_predicate(&types), "".to_string());

    // One
    let types = BTreeSet::from([
      InferenceJobType::RvcV2,
    ]);

    assert_eq!(job_type_predicate(&types), "\"rvc_v2\"".to_string());

    // Multiple
    let types = BTreeSet::from([
      InferenceJobType::MocapNet,
      InferenceJobType::RvcV2,
    ]);
    assert_eq!(job_type_predicate(&types), "\"mocap_net\", \"rvc_v2\"".to_string());
  }

  #[test]
  fn test_model_type_predicate() {
    // None
    let types = BTreeSet::from([]);
    assert_eq!(model_type_predicate(&types), "".to_string());

    // One
    let types = BTreeSet::from([
      InferenceModelType::RvcV2,
    ]);

    assert_eq!(model_type_predicate(&types), "\"rvc_v2\"".to_string());

    // Multiple
    let types = BTreeSet::from([
      InferenceModelType::RvcV2,
      InferenceModelType::SoVitsSvc,
    ]);
    assert_eq!(model_type_predicate(&types), "\"rvc_v2\", \"so_vits_svc\"".to_string());
  }

  #[test]
  fn test_inference_category_predicate() {
    // None
    let types = BTreeSet::from([]);
    assert_eq!(inference_category_predicate(&types), "".to_string());

    // Some
    let types = BTreeSet::from([
      InferenceCategory::VoiceConversion,
    ]);

    assert_eq!(inference_category_predicate(&types), "\"voice_conversion\"".to_string());
    // All
    let types = BTreeSet::from([
      InferenceCategory::TextToSpeech,
      InferenceCategory::VoiceConversion,
    ]);
    assert_eq!(inference_category_predicate(&types), "\"text_to_speech\", \"voice_conversion\"".to_string());
  }
}
