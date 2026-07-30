use sqlx::{MySqlPool, Row};

use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

/// A pending job created by the DEV_FAKE_GENERATION short-circuit
/// (external_third_party_id starts with `fake_`), joined with its prompt text
/// so the dev resolver can honor the synthetic-failure prompt triggers.
pub struct PendingFakeGenerationJob {
  pub job_token: InferenceJobToken,
  /// e.g. "image_generation", "video_generation".
  pub inference_category: String,
  pub maybe_prompt_token: Option<PromptToken>,
  pub maybe_positive_prompt: Option<String>,
  pub maybe_creator_user_token: Option<UserToken>,
}

/// List pending fake-generation jobs older than `min_age_seconds`, oldest
/// first. Development-only: production never writes `fake_` external ids.
///
/// NB: runtime query (not the compile-time macro) because this dev-only SELECT
/// isn't in the sqlx offline cache.
pub async fn list_pending_fake_generation_jobs(
  mysql_pool: &MySqlPool,
  min_age_seconds: u32,
  limit: u32,
) -> Result<Vec<PendingFakeGenerationJob>, sqlx::Error> {
  let rows = sqlx::query(
        r#"
SELECT
  j.token AS job_token,
  j.inference_category,
  j.maybe_prompt_token,
  j.maybe_creator_user_token,
  p.maybe_positive_prompt
FROM generic_inference_jobs AS j
LEFT JOIN prompts AS p
  ON p.token = j.maybe_prompt_token
WHERE j.status = 'pending'
  AND j.maybe_external_third_party_id LIKE 'fake\_%'
  AND j.created_at <= NOW() - INTERVAL ? SECOND
ORDER BY j.created_at ASC
LIMIT ?
        "#)
      .bind(min_age_seconds)
      .bind(limit)
      .fetch_all(mysql_pool)
      .await?;

  let jobs = rows.into_iter()
      .map(|row| PendingFakeGenerationJob {
        job_token: InferenceJobToken::new(row.get::<String, _>("job_token")),
        inference_category: row.get::<String, _>("inference_category"),
        maybe_prompt_token: row.get::<Option<String>, _>("maybe_prompt_token")
            .map(PromptToken::new),
        maybe_positive_prompt: row.get::<Option<String>, _>("maybe_positive_prompt"),
        maybe_creator_user_token: row.get::<Option<String>, _>("maybe_creator_user_token")
            .map(UserToken::new),
      })
      .collect();

  Ok(jobs)
}
