use chrono::{DateTime, Utc};
use sqlx::mysql::MySqlRow;
use sqlx::pool::PoolConnection;
use sqlx::{FromRow, MySql, QueryBuilder, Row};

use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_bitrate::CommonBitrate;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation_provider::GenerationProvider;
use enums::traits::mysql_from_row::MySqlFromRow;
use tokens::tokens::prompts::PromptToken;
use tokens::traits::mysql_token_from_row::MySqlTokenFromRow;

pub struct BatchPromptResult {
  pub token: PromptToken,
  pub prompt_type: PromptType,
  pub maybe_model_type: Option<CommonModelType>,
  pub maybe_generation_provider: Option<GenerationProvider>,
  pub maybe_positive_prompt: Option<String>,
  pub maybe_negative_prompt: Option<String>,
  pub maybe_generation_mode: Option<CommonGenerationMode>,
  pub maybe_aspect_ratio: Option<CommonAspectRatio>,
  pub maybe_resolution: Option<CommonResolution>,
  pub maybe_bitrate: Option<CommonBitrate>,
  pub maybe_batch_count: Option<u8>,
  pub maybe_generate_audio: Option<bool>,
  pub maybe_duration_seconds: Option<u32>,
  pub created_at: DateTime<Utc>,
}

impl FromRow<'_, MySqlRow> for BatchPromptResult {
  fn from_row(row: &MySqlRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      token: PromptToken::try_from_mysql_row(row, "token")?,
      prompt_type: PromptType::try_from_mysql_row(row, "prompt_type")?,
      maybe_model_type: row.try_get::<Option<String>, _>("maybe_model_type")?
        .and_then(|s| CommonModelType::from_str(&s).ok()),
      maybe_generation_provider: row.try_get::<Option<String>, _>("maybe_generation_provider")?
        .and_then(|s| GenerationProvider::from_str(&s).ok()),
      maybe_positive_prompt: row.try_get("maybe_positive_prompt")?,
      maybe_negative_prompt: row.try_get("maybe_negative_prompt")?,
      maybe_generation_mode: row.try_get::<Option<String>, _>("maybe_generation_mode")?
        .and_then(|s| CommonGenerationMode::from_str(&s).ok()),
      maybe_aspect_ratio: row.try_get::<Option<String>, _>("maybe_aspect_ratio")?
        .and_then(|s| CommonAspectRatio::from_str(&s).ok()),
      maybe_resolution: row.try_get::<Option<String>, _>("maybe_resolution")?
        .and_then(|s| CommonResolution::from_str(&s).ok()),
      maybe_bitrate: row.try_get::<Option<String>, _>("maybe_bitrate")?
        .and_then(|s| CommonBitrate::from_str(&s).ok()),
      maybe_batch_count: row.try_get("maybe_batch_count")?,
      maybe_generate_audio: row.try_get("maybe_generate_audio")?,
      maybe_duration_seconds: row.try_get("maybe_duration_seconds")?,
      created_at: row.try_get("created_at")?,
    })
  }
}

pub async fn batch_get_prompts(
  tokens: &[PromptToken],
  mysql_connection: &mut PoolConnection<MySql>,
) -> Result<Vec<BatchPromptResult>, sqlx::Error> {
  if tokens.is_empty() {
    return Ok(Vec::new());
  }

  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(r#"
SELECT
    p.token,
    p.prompt_type,
    p.maybe_model_type,
    p.maybe_generation_provider,
    p.maybe_positive_prompt,
    p.maybe_negative_prompt,
    p.maybe_generation_mode,
    p.maybe_aspect_ratio,
    p.maybe_resolution,
    p.maybe_bitrate,
    p.maybe_batch_count,
    p.maybe_generate_audio,
    p.maybe_duration_seconds,
    p.created_at
FROM prompts as p
WHERE p.token IN (
  "#);

  let mut separated = query_builder.separated(", ");

  for token in tokens {
    separated.push_bind(token.to_string());
  }

  separated.push_unseparated(") ");

  let query = query_builder.build_query_as::<BatchPromptResult>();

  query.fetch_all(&mut **mysql_connection).await
}
