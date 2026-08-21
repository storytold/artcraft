use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

pub struct GetFirstImagerefForPromptArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub prompt_token: &'e PromptToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Find the first (oldest-attached) non-deleted image reference attached to a
/// prompt. Used as a cover-image fallback for mesh/splat generations whose
/// webhook payload carries no thumbnail: the image the user generated the
/// model from stands in as the cover.
pub async fn get_first_imageref_for_prompt<'e, 'c: 'e, E>(
  args: GetFirstImagerefForPromptArgs<'e, 'c, E>,
) -> Result<Option<MediaFileToken>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
SELECT
  pci.media_token as `media_token: MediaFileToken`
FROM prompt_context_items pci
JOIN media_files m
  ON pci.media_token = m.token
WHERE pci.prompt_token = ?
  AND m.media_class = 'image'
  AND m.user_deleted_at IS NULL
  AND m.mod_deleted_at IS NULL
ORDER BY pci.id ASC
LIMIT 1
    "#,
    args.prompt_token.as_str(),
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(result.map(|r| r.media_token))
}
