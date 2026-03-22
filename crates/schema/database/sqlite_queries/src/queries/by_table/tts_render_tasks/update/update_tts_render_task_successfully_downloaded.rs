use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::news_stories::NewsStoryToken;
use tokens::tokens::tts_render_tasks::TtsRenderTaskToken;

pub struct Args <'a> {
  pub tts_render_task_token: &'a TtsRenderTaskToken,

  pub tts_result_token: &'a str,

  pub result_url: &'a str,

  pub audio_duration_millis: i64,

  pub sqlite_pool: &'a SqlitePool,
}

// TODO: Split inference + downloads

pub async fn update_tts_render_task_successfully_downloaded(args: Args<'_>) -> AnyhowResult<()> {
  let query = sqlx::query!(
        r#"
UPDATE tts_render_tasks
SET
  maybe_result_token = ?,
  maybe_result_url = ?,
  maybe_audio_duration_millis = ?,

  tts_render_status = "success",
  tts_render_attempts = tts_render_attempts + 1,
  version = version + 1
WHERE
  token = ?
        "#,
        args.tts_result_token,
        args.result_url,
        args.audio_duration_millis,
        args.tts_render_task_token,
    );

  let query_result = query.execute(args.sqlite_pool)
      .await;

  match query_result {
    Ok(_) => Ok(()),
    Err(err) => Err(anyhow!("error updating: {:?}", err)),
  }
}
