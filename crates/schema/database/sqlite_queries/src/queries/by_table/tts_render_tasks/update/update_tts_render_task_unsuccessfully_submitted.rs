use enums::by_table::tts_render_tasks::tts_render_status::TtsRenderStatus;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::news_stories::NewsStoryToken;
use tokens::tokens::tts_render_tasks::TtsRenderTaskToken;

pub struct Args <'a> {
  pub tts_render_task_token: &'a TtsRenderTaskToken,
  pub tts_render_attempts: i64,

  pub sqlite_pool: &'a SqlitePool,
}

pub async fn update_tts_render_task_unsuccessfully_submitted(args: Args<'_>) -> AnyhowResult<()> {
  let mut tts_render_status = next_status(args.tts_render_attempts);

  let query = sqlx::query!(
        r#"
UPDATE tts_render_tasks
SET
  tts_render_status = ?,
  tts_render_attempts = ?,
  version = version + 1
WHERE
  token = ?
        "#,
        tts_render_status,
        args.tts_render_attempts,
        args.tts_render_task_token,
    );

  let query_result = query.execute(args.sqlite_pool)
      .await;

  match query_result {
    Ok(_) => Ok(()),
    Err(err) => Err(anyhow!("error updating: {:?}", err)),
  }
}

fn next_status(attempts: i64) -> TtsRenderStatus {
  if attempts >= 3 {
    TtsRenderStatus::PermanentlyFailed
  } else {
    TtsRenderStatus::Failed
  }
}
