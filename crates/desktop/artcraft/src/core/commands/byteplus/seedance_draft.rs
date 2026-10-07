use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_model_type::TaskModelType;
use log::error;
use sqlite_tasks::queries::get_completed_task_by_media_file_token::{
  get_completed_task_by_media_file_token, GetCompletedTaskByMediaFileTokenArgs,
};
use tokens::tokens::media_files::MediaFileToken;

use crate::core::commands::generate::byteplus::byteplus_video_models::SEEDANCE_2P5_DRAFT_MODEL;
use crate::core::state::task_database::TaskDatabase;

/// ModelArk keeps a draft's task for 7 days; after that it can't render the final video.
pub const DRAFT_LIFETIME_SECONDS: i64 = 7 * 24 * 60 * 60;

/// A finished Seedance 2.5 draft, found from the media file it produced.
pub struct SeedanceDraft {
  pub draft_task_id: String,
  pub maybe_prompt_token: Option<String>,
  /// Unix seconds.
  pub expires_at: i64,
}

impl SeedanceDraft {
  pub fn is_expired(&self, now_unix_seconds: i64) -> bool {
    now_unix_seconds >= self.expires_at
  }
}

/// The Seedance 2.5 draft that produced `media_file_token`, or `None` for any other file.
pub async fn find_seedance_draft(
  task_database: &TaskDatabase,
  media_file_token: &MediaFileToken,
) -> Result<Option<SeedanceDraft>, String> {
  let maybe_task = get_completed_task_by_media_file_token(GetCompletedTaskByMediaFileTokenArgs {
    db: task_database.get_connection(),
    provider: GenerationProvider::Byteplus,
    media_file_token,
  }).await.map_err(|err| {
    error!("Could not look up the task for {}: {:?}", media_file_token.as_str(), err);
    "Could not look up this video's draft.".to_string()
  })?;

  let Some(task) = maybe_task else {
    return Ok(None);
  };

  let is_draft = matches!(&task.model_type, Some(TaskModelType::Unknown(model)) if model == SEEDANCE_2P5_DRAFT_MODEL);
  let Some(draft_task_id) = task.provider_job_id.filter(|_| is_draft) else {
    return Ok(None);
  };

  Ok(Some(SeedanceDraft {
    draft_task_id,
    maybe_prompt_token: task.prompt_token,
    expires_at: task.created_at + DRAFT_LIFETIME_SECONDS,
  }))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn a_draft_expires_seven_days_after_it_was_made() {
    let made_at = 1_790_000_000;
    let draft = SeedanceDraft {
      draft_task_id: "cgt-123".to_string(),
      maybe_prompt_token: None,
      expires_at: made_at + DRAFT_LIFETIME_SECONDS,
    };
    assert!(!draft.is_expired(made_at + DRAFT_LIFETIME_SECONDS - 1));
    assert!(draft.is_expired(made_at + DRAFT_LIFETIME_SECONDS));
  }
}
