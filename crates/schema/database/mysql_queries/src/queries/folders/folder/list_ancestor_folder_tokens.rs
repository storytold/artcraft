use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::users::UserToken;

/// Maximum hops the recursive CTE will walk before giving up. Prevents
/// runaway recursion on already-corrupt data (a folder graph that
/// somehow contains a cycle).
const MAX_ANCESTOR_DEPTH: i64 = 64;

pub struct ListAncestorFolderTokensArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  /// The folder whose ancestor chain we're walking. Its own token is
  /// NOT included in the result — only strict ancestors.
  pub folder_token: &'e FolderToken,

  /// Scope to a single owner so we never traverse into another user's
  /// folder tree, even if the parent pointer were ever cross-owner.
  pub owner_user_token: &'e UserToken,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Return the strict ancestors of the given folder, walking up the
/// `maybe_parent_folder_token` chain. Order is nearest-ancestor first.
/// Deleted folders are excluded — a soft-deleted parent terminates the
/// chain. The walk is capped at [`MAX_ANCESTOR_DEPTH`] hops.
pub async fn list_ancestor_folder_tokens<'e, 'c: 'e, E>(
  args: ListAncestorFolderTokensArgs<'e, 'c, E>,
) -> Result<Vec<FolderToken>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let rows = sqlx::query!(
    r#"
WITH RECURSIVE ancestor_chain (token, parent_token, depth) AS (
  SELECT token, maybe_parent_folder_token, 0
  FROM folders
  WHERE token = ?
    AND owner_user_token = ?
    AND maybe_deleted_at IS NULL
  UNION ALL
  SELECT f.token, f.maybe_parent_folder_token, ac.depth + 1
  FROM folders f
  INNER JOIN ancestor_chain ac
    ON f.token = ac.parent_token
  WHERE f.owner_user_token = ?
    AND f.maybe_deleted_at IS NULL
    AND ac.depth < ?
)
SELECT token as `token!: FolderToken`
FROM ancestor_chain
WHERE depth > 0
ORDER BY depth ASC
    "#,
    args.folder_token.as_str(),
    args.owner_user_token.as_str(),
    args.owner_user_token.as_str(),
    MAX_ANCESTOR_DEPTH,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  Ok(rows.into_iter().map(|r| r.token).collect())
}
