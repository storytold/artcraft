use enums_db::by_table::tts_render_tasks::tts_render_status::TtsRenderStatus;
use errors::{anyhow, AnyhowResult};
use sqlx::SqlitePool;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::tts_render_tasks::TtsRenderTaskToken;

use crate::queries::by_table::tts_render_tasks::list::tts_render_task::TtsRenderTask;

pub async fn list_tts_render_tasks_awaiting_render(
  tts_render_status: TtsRenderStatus,
  last_id: i64,
  limit: i64,
  sqlite_pool: &SqlitePool,
) -> AnyhowResult<Vec<TtsRenderTask>> {

  // NB: Sqlx doesn't support `WHERE ... IN (...)` "yet". :(
  // https://github.com/launchbadge/sqlx/blob/6d0d7402c8a9cbea2676a1795e9fb50b0cf60c03/FAQ.md?plain=1#L73
  let tts_render_status = tts_render_status.to_str().to_string();

  let query = sqlx::query_as!(
    TtsRenderTask,
        r#"
SELECT
  id,
  token as `token: tokens::tokens::tts_render_tasks::TtsRenderTaskToken`,
  story_type,
  story_token,
  sequence_order,
  tts_service,
  tts_voice_identifier,
  full_text,
  maybe_inference_job_token,
  maybe_result_token,
  maybe_result_url,
  maybe_result_relative_filesystem_location,
  maybe_audio_duration_millis,
  tts_render_status as `tts_render_status: enums_db::by_table::tts_render_tasks::tts_render_status::TtsRenderStatus`,
  tts_render_attempts
FROM tts_render_tasks
WHERE
  tts_render_status = ?
  AND id > ?
ORDER BY id ASC
LIMIT ?
        "#,
        tts_render_status,
        last_id,
        limit,
    );

  let records = query.fetch_all(sqlite_pool)
      .await?;

  Ok(records)
}
