use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder};

use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

pub struct InsertMediaFileTagsArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub media_file_tokens: &'e [MediaFileToken],
  pub tag_tokens: &'e [TagToken],
  pub user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Attach every tag to every media file (full cartesian product) in a
/// single multi-row statement. Uses `INSERT IGNORE` so already-attached
/// pairs are absorbed without error — idempotent, which is what makes
/// the add/set endpoints upsert-friendly. Returns the number of rows
/// actually inserted.
///
/// Callers must cap the input sizes; the row count is
/// `media_file_tokens.len() * tag_tokens.len()`.
pub async fn insert_media_file_tags<'e, 'c: 'e, E>(
  args: InsertMediaFileTagsArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.media_file_tokens.is_empty() || args.tag_tokens.is_empty() {
    return Ok(0);
  }

  let user_token_str = args.user_token.as_str();
  let pairs = args.media_file_tokens.iter()
    .flat_map(|media_file_token| {
      args.tag_tokens.iter()
        .map(move |tag_token| (media_file_token, tag_token))
    });

  let mut builder = QueryBuilder::<MySql>::new(
    "INSERT IGNORE INTO media_file_tags (media_file_token, tag_token, user_token) ",
  );
  builder.push_values(pairs, |mut b, (media_file_token, tag_token)| {
    b.push_bind(media_file_token.as_str())
      .push_bind(tag_token.as_str())
      .push_bind(user_token_str);
  });

  let result = builder.build().execute(args.mysql_executor).await?;
  Ok(result.rows_affected())
}
