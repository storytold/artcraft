use std::marker::PhantomData;

use sqlx::{Executor, MySql, QueryBuilder};

use tokens::tokens::tags::TagToken;

pub struct RecountTagUseCountsArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub tag_tokens: &'e [TagToken],
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Recompute `tags.use_count` for the given tags from the actual
/// `media_file_tags` link counts. Call after any add/remove of links,
/// passing only the affected tag tokens — the correlated COUNT probes
/// `index_tag_token`, so cost is proportional to the tags' link counts,
/// not table size.
///
/// Only links to LIVE media files count: media-file deletion is a soft
/// delete that leaves the link rows in place (so undelete restores the
/// user's tags), and those parked links must not inflate the rollup.
pub async fn recount_tag_use_counts<'e, 'c: 'e, E>(
  args: RecountTagUseCountsArgs<'e, 'c, E>,
) -> Result<(), sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  if args.tag_tokens.is_empty() {
    return Ok(());
  }

  let mut builder = QueryBuilder::<MySql>::new(
    "UPDATE tags \
     SET use_count = ( \
       SELECT COUNT(*) FROM media_file_tags \
       JOIN media_files \
         ON media_files.token = media_file_tags.media_file_token \
         AND media_files.user_deleted_at IS NULL \
         AND media_files.mod_deleted_at IS NULL \
       WHERE media_file_tags.tag_token = tags.token \
     ) \
     WHERE tags.token IN (",
  );

  let mut separated = builder.separated(", ");
  for token in args.tag_tokens {
    separated.push_bind(token.as_str());
  }
  separated.push_unseparated(")");

  builder.build().execute(args.mysql_executor).await?;
  Ok(())
}
