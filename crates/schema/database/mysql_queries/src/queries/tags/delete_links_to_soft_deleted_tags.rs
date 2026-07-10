use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder};

use tokens::tokens::tags::TagToken;

pub struct DeleteLinksToSoftDeletedTagsArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub tag_tokens: &'e [TagToken],
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Remove any `media_file_tags` links pointing at tags that are
/// soft-deleted, among the given tag tokens. Guards the apply-tags
/// transaction against a concurrent tag delete: the DELETE is a locking
/// read, so unlike the transaction's snapshot SELECTs it observes a
/// just-committed soft-delete and cleans up links the snapshot happily
/// inserted. Cheap — an IN-list probe on `index_tag_token` plus a
/// primary-key lookup per link.
pub async fn delete_links_to_soft_deleted_tags<'e, 'c: 'e, E>(
  args: DeleteLinksToSoftDeletedTagsArgs<'e, 'c, E>,
) -> Result<u64, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.tag_tokens.is_empty() {
    return Ok(0);
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "DELETE media_file_tags FROM media_file_tags \
     JOIN tags ON tags.token = media_file_tags.tag_token \
     WHERE tags.maybe_deleted_at IS NOT NULL \
       AND media_file_tags.tag_token IN (",
  );

  let mut separated = builder.separated(", ");
  for token in args.tag_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  let result = builder.build().execute(args.mysql_executor).await?;
  Ok(result.rows_affected())
}
