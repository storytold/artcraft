use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

pub struct GetSoftDeletedTagByLowercaseArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub tag_value_lowercase: &'e str,
  pub creator_user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Find a user's SOFT-DELETED tag by its lowercased value. Soft-deleted
/// rows still occupy the `(tag_value_lowercase, creator_user_token)`
/// unique key, so a rename onto that value must purge the dead row
/// first — this lookup feeds that purge.
pub async fn get_soft_deleted_tag_by_lowercase<'e, 'c: 'e, E>(
  args: GetSoftDeletedTagByLowercaseArgs<'e, 'c, E>,
) -> Result<Option<TagToken>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
SELECT token as `token: TagToken`
FROM tags
WHERE creator_user_token = ?
  AND tag_value_lowercase = ?
  AND maybe_deleted_at IS NOT NULL
LIMIT 1
    "#,
    args.creator_user_token.as_str(),
    args.tag_value_lowercase,
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(result.map(|r| r.token))
}
