use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder};

use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

/// One sanitized tag to upsert. The caller is responsible for trimming,
/// lowercasing, and case-insensitive deduping.
#[derive(Debug, Clone)]
pub struct NewTagValue {
  /// The display value, original casing preserved.
  pub tag_value: String,

  /// Lowercased `tag_value` — the unique key within the creator's account.
  pub tag_value_lowercase: String,
}

pub struct UpsertTagsArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub new_tags: &'e [NewTagValue],
  pub creator_user_token: &'e UserToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Upsert tags for a user. New tags are created with freshly generated
/// tokens; tags that already exist (matched on the
/// `(tag_value_lowercase, creator_user_token)` unique key) are absorbed,
/// keeping their existing token and display casing. Previously
/// soft-deleted tags are revived (`maybe_deleted_at` reset to NULL) in
/// the same statement.
///
/// Callers should follow up with `select_tags_by_lowercase_values` to
/// learn the canonical tokens.
pub async fn upsert_tags<'e, 'c: 'e, E>(
  args: UpsertTagsArgs<'e, 'c, E>,
) -> Result<(), sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.new_tags.is_empty() {
    return Ok(());
  }

  let creator_user_token_str = args.creator_user_token.as_str();
  let mut builder = QueryBuilder::<MySql>::new(
    "INSERT INTO tags (token, tag_value, tag_value_lowercase, creator_user_token) ",
  );
  builder.push_values(args.new_tags, |mut b, new_tag| {
    b.push_bind(TagToken::generate().0)
      .push_bind(new_tag.tag_value.as_str())
      .push_bind(new_tag.tag_value_lowercase.as_str())
      .push_bind(creator_user_token_str);
  });
  builder.push(" ON DUPLICATE KEY UPDATE maybe_deleted_at = NULL");

  builder.build().execute(args.mysql_executor).await?;
  Ok(())
}
