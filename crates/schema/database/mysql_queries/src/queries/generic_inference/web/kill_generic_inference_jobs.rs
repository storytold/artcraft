use std::collections::HashSet;

use anyhow::anyhow;
use sqlx::{MySql, MySqlPool, QueryBuilder};

use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use enums::common::job_status::JobStatus;
use errors::AnyhowResult;

/// Only certain job statuses should be modified.
#[derive(Copy, Clone, PartialEq, Eq, Hash)]
pub enum KillableStatus {
  Failed,
  Pending,
  Started,
}

/// Target everything, by job category, or by model type.
#[derive(Clone)]
pub enum KillableTarget {
  AllJobs,
  Category(InferenceCategory),
  ModelType(InferenceModelType),
}

pub struct KillGenericInferenceJobsArgs<'a> {
  pub job_statuses: HashSet<KillableStatus>,
  pub target: KillableTarget,
  pub maybe_priority_or_lower: Option<u8>,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn kill_generic_inference_jobs(args: KillGenericInferenceJobsArgs<'_>) -> AnyhowResult<()> {
  let mut query = query_builder(
    args.job_statuses,
    args.target,
    args.maybe_priority_or_lower
  );

  let query = query.build();

  let result = query.execute(args.mysql_pool).await;

  match result {
    Err(err) => {
      Err(anyhow!("error with query: {:?}", err))
    },
    Ok(_r) => Ok(()),
  }
}

fn query_builder(
  job_statuses: HashSet<KillableStatus>,
  target: KillableTarget,
  maybe_priority_or_lower: Option<u8>,
) -> QueryBuilder<MySql> {

  // NB: Query cannot be statically checked by sqlx
  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
    r#"
UPDATE generic_inference_jobs
SET status='cancelled_by_system'
WHERE status IN(
    "#
  );

  let job_statuses = job_statuses.into_iter()
      .map(|status| match status {
        KillableStatus::Failed => JobStatus::AttemptFailed.to_str(),
        KillableStatus::Pending => JobStatus::Pending.to_str(),
        KillableStatus::Started => JobStatus::Started.to_str(),
      })
      .collect::<Vec<_>>();

  // NB: Syntax will be wrong if list has zero length
  let mut separated = query_builder.separated(", ");
  for value_type in job_statuses.into_iter() {
    separated.push_bind(value_type);
  }
  separated.push_unseparated(") ");

  if let Some(priority) = maybe_priority_or_lower {
    query_builder.push(format!(" AND priority_level <= {priority} "));
  }

  match target {
    KillableTarget::AllJobs => {
      // No need to modify query.
    }
    KillableTarget::Category(category) => {
      query_builder.push(" AND inference_category = ");
      query_builder.push_bind(category);
    }
    KillableTarget::ModelType(model_type) => {
      query_builder.push(" AND maybe_model_type = ");
      query_builder.push_bind(model_type);
    }
  }

  query_builder
}

#[cfg(test)]
mod tests {
  use std::collections::HashSet;

  use regex::Regex;

  use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
  use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;

  use crate::queries::generic_inference::web::kill_generic_inference_jobs::{KillableStatus, KillableTarget, query_builder};

  fn cleanup_query(query: &str) -> String {
    let regex = Regex::new(r#"\s+"#).unwrap();
    let result = regex.replace_all(query, " ").trim().to_string();
    result
  }

  #[test]
  fn test_statuses() {
    let statuses = HashSet::from([KillableStatus::Failed]);
    let builder = query_builder(statuses, KillableTarget::AllJobs, None);
    let query = cleanup_query(builder.into_sql().as_str());
    assert_eq!(query, "UPDATE generic_inference_jobs SET status='cancelled_by_system' WHERE status IN( ?)".to_string());

    let statuses = HashSet::from([KillableStatus::Failed, KillableStatus::Pending, KillableStatus::Started]);
    let builder = query_builder(statuses, KillableTarget::AllJobs, None);
    let query = cleanup_query(builder.into_sql().as_str());
    assert_eq!(query, "UPDATE generic_inference_jobs SET status='cancelled_by_system' WHERE status IN( ?, ?, ?)".to_string());
  }

  #[test]
  fn test_priority() {
    let statuses = HashSet::from([KillableStatus::Failed]);
    let builder = query_builder(statuses, KillableTarget::AllJobs, Some(10));
    let query = cleanup_query(builder.into_sql().as_str());
    assert_eq!(query, "UPDATE generic_inference_jobs SET status='cancelled_by_system' WHERE status IN( ?) AND priority_level <= 10".to_string());
  }

  #[test]
  fn test_category_target() {
    let statuses = HashSet::from([KillableStatus::Failed]);
    let builder = query_builder(statuses, KillableTarget::Category(InferenceCategory::LipsyncAnimation), None);
    let query = cleanup_query(builder.into_sql().as_str());
    assert_eq!(query, "UPDATE generic_inference_jobs SET status='cancelled_by_system' WHERE status IN( ?) AND inference_category = ?".to_string());
  }

  #[test]
  fn test_model_target() {
    let statuses = HashSet::from([KillableStatus::Failed]);
    let builder = query_builder(statuses, KillableTarget::ModelType(InferenceModelType::RvcV2), None);
    let query = cleanup_query(builder.into_sql().as_str());
    assert_eq!(query, "UPDATE generic_inference_jobs SET status='cancelled_by_system' WHERE status IN( ?) AND maybe_model_type = ?".to_string());
  }
}
