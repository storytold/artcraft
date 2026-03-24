// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use anyhow::anyhow;
use chrono::{DateTime, Utc};
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation_provider::GenerationProvider;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_resolution::CommonResolution;
use errors::AnyhowResult;
use sqlx::pool::PoolConnection;
use sqlx::{MySql, MySqlPool};
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::payloads::prompt_args::prompt_inner_payload::PromptInnerPayload;

#[derive(Serialize, Debug)]
pub struct Prompt {
  pub token: PromptToken,

  pub prompt_type: PromptType,

  pub maybe_model_type: Option<CommonModelType>,
  pub maybe_generation_provider: Option<GenerationProvider>,

  pub maybe_creator_user_token: Option<UserToken>,

  pub maybe_positive_prompt: Option<String>,
  pub maybe_negative_prompt: Option<String>,

  pub maybe_other_args: Option<PromptInnerPayload>,

  pub maybe_generation_mode: Option<CommonGenerationMode>,
  pub maybe_aspect_ratio: Option<CommonAspectRatio>,
  pub maybe_resolution: Option<CommonResolution>,
  pub maybe_batch_count: Option<u8>,
  pub maybe_generate_audio: Option<bool>,
  pub maybe_duration_seconds: Option<u32>,

  /// For moderators only
  pub creator_ip_address: Option<String>,

  pub created_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct PromptRaw {
  pub token: PromptToken,

  pub prompt_type: PromptType,

  pub maybe_model_type: Option<CommonModelType>,
  pub maybe_generation_provider: Option<GenerationProvider>,

  pub maybe_creator_user_token: Option<UserToken>,

  pub maybe_positive_prompt: Option<String>,
  pub maybe_negative_prompt: Option<String>,

  pub maybe_other_args: Option<String>,

  pub maybe_generation_mode: Option<CommonGenerationMode>,
  pub maybe_aspect_ratio: Option<CommonAspectRatio>,
  pub maybe_resolution: Option<CommonResolution>,
  pub maybe_batch_count: Option<u8>,
  pub maybe_generate_audio: Option<bool>,
  pub maybe_duration_seconds: Option<u32>,

  /// For moderators only
  pub creator_ip_address: Option<String>,

  pub created_at: DateTime<Utc>,
}


pub async fn get_prompt(
  prompt_token: &PromptToken,
  mysql_pool: &MySqlPool
) -> AnyhowResult<Option<Prompt>> {
  let mut connection = mysql_pool.acquire().await?;
  get_prompt_from_connection(prompt_token, &mut connection).await
}

pub async fn get_prompt_from_connection(
  prompt_token: &PromptToken,
  mysql_connection: &mut PoolConnection<MySql>
) -> AnyhowResult<Option<Prompt>> {

  let record = select_record(prompt_token, mysql_connection).await;

  let record = match record {
    Ok(record) => record,
    Err(ref err) => {
      return match err {
        sqlx::Error::RowNotFound => Ok(None),
        _ => Err(anyhow!("database error: {:?}", err)),
      }
    }
  };

  Ok(Some(Prompt {
    token: record.token,
    prompt_type: record.prompt_type,
    maybe_model_type: record.maybe_model_type,
    maybe_generation_provider: record.maybe_generation_provider,
    maybe_creator_user_token: record.maybe_creator_user_token,
    maybe_positive_prompt: record.maybe_positive_prompt,
    maybe_negative_prompt: record.maybe_negative_prompt,
    maybe_generation_mode: record.maybe_generation_mode,
    maybe_aspect_ratio: record.maybe_aspect_ratio,
    maybe_resolution: record.maybe_resolution,
    maybe_batch_count: record.maybe_batch_count,
    maybe_generate_audio: record.maybe_generate_audio,
    maybe_duration_seconds: record.maybe_duration_seconds,
    maybe_other_args: record.maybe_other_args
        .as_deref()
        .map(|args| PromptInnerPayload::from_json(args))
        .transpose()?,
    creator_ip_address: record.creator_ip_address,
    created_at: record.created_at,
  }))
}

async fn select_record(
  prompt_token: &PromptToken,
  mysql_connection: &mut PoolConnection<MySql>
) -> Result<PromptRaw, sqlx::Error> {
  sqlx::query_as!(
      PromptRaw,
        r#"
SELECT
    p.token as `token: tokens::tokens::prompts::PromptToken`,

    p.prompt_type as `prompt_type: enums::by_table::prompts::prompt_type::PromptType`,

    p.maybe_model_type as `maybe_model_type: enums::common::generation::common_model_type::CommonModelType`,
    p.maybe_generation_provider as `maybe_generation_provider: enums::common::generation_provider::GenerationProvider`,

    p.maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,

    p.maybe_positive_prompt,
    p.maybe_negative_prompt,

    p.maybe_generation_mode as `maybe_generation_mode: enums::common::generation::common_generation_mode::CommonGenerationMode`,
    p.maybe_aspect_ratio as `maybe_aspect_ratio: enums::common::generation::common_aspect_ratio::CommonAspectRatio`,
    p.maybe_resolution as `maybe_resolution: enums::common::generation::common_resolution::CommonResolution`,
    p.maybe_batch_count as `maybe_batch_count: u8`,
    p.maybe_generate_audio as `maybe_generate_audio: bool`,
    p.maybe_duration_seconds as `maybe_duration_seconds: u32`,

    p.maybe_other_args,

    p.creator_ip_address,
    p.created_at

FROM prompts as p
WHERE
    p.token = ?
        "#,
      prompt_token
    )
      .fetch_one(&mut **mysql_connection)
      .await
}
