use std::marker::PhantomData;

use log::{error, warn};
use sqlx::pool::PoolConnection;
use sqlx::{Acquire, MySql, Transaction};

use mysql_queries::queries::tags::clear_media_file_tags::{
  clear_media_file_tags, ClearMediaFileTagsArgs,
};
use mysql_queries::queries::tags::delete_links_to_soft_deleted_tags::{
  delete_links_to_soft_deleted_tags, DeleteLinksToSoftDeletedTagsArgs,
};
use mysql_queries::queries::tags::delete_media_file_tags_not_in_set::{
  delete_media_file_tags_not_in_set, DeleteMediaFileTagsNotInSetArgs,
};
use mysql_queries::queries::tags::insert_media_file_tags::{
  insert_media_file_tags, InsertMediaFileTagsArgs,
};
use mysql_queries::queries::tags::list_linked_tag_tokens_for_media_files::{
  list_linked_tag_tokens_for_media_files, ListLinkedTagTokensForMediaFilesArgs,
};
use mysql_queries::queries::tags::recount_tag_use_counts::{
  recount_tag_use_counts, RecountTagUseCountsArgs,
};
use mysql_queries::queries::tags::select_tags_by_lowercase_values::{
  select_tags_by_lowercase_values, SelectTagsByLowercaseValuesArgs,
};
use mysql_queries::queries::tags::select_tags_by_tokens_for_owner::{
  select_tags_by_tokens_for_owner, SelectTagsByTokensForOwnerArgs,
};
use mysql_queries::queries::tags::tag_row::TagRow;
use mysql_queries::queries::tags::upsert_tags::{upsert_tags, NewTagValue, UpsertTagsArgs};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::tags::TagToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;

pub struct ApplyTagsOutcome {
  /// The requested tags after upsert, with canonical tokens and fresh
  /// use counts. Empty for pure clear operations.
  pub tags: Vec<TagRow>,

  /// How many existing tag links were removed (always 0 when
  /// `remove_unmentioned` is false).
  pub removed_count: u64,
}

/// The shared engine behind the add / set / clear / bulk_add / bulk_set
/// endpoints: upsert the requested tags (reviving soft-deleted ones),
/// attach them to every media file, optionally remove links that weren't
/// mentioned ("set" semantics), and recount `use_count` for every tag
/// whose link set changed — all in one transaction.
///
/// The caller must have already ownership-filtered `media_file_tokens`
/// and sanitized `new_tags`. On any failure the transaction is
/// explicitly rolled back before the original error is re-raised.
pub async fn apply_tags_to_media_files(
  conn: &mut PoolConnection<MySql>,
  user_token: &UserToken,
  media_file_tokens: &[MediaFileToken],
  new_tags: &[NewTagValue],
  remove_unmentioned: bool,
) -> Result<ApplyTagsOutcome, CommonWebError> {
  let mut tx = conn.begin().await.map_err(|err| {
    warn!("Failed to begin apply-tags transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let work_result = perform_apply_work(
    &mut tx,
    user_token,
    media_file_tokens,
    new_tags,
    remove_unmentioned,
  ).await;

  match work_result {
    Ok(outcome) => {
      tx.commit().await.map_err(|err| {
        warn!("Failed to commit apply-tags transaction: {:?}", err);
        CommonWebError::from_error(err)
      })?;
      Ok(outcome)
    }
    Err(err) => {
      if let Err(rollback_err) = tx.rollback().await {
        error!(
          "Rollback after apply-tags failure also failed: {:?} (original error: {:?})",
          rollback_err, err,
        );
      }
      Err(err)
    }
  }
}

async fn perform_apply_work(
  tx: &mut Transaction<'_, MySql>,
  user_token: &UserToken,
  media_file_tokens: &[MediaFileToken],
  new_tags: &[NewTagValue],
  remove_unmentioned: bool,
) -> Result<ApplyTagsOutcome, CommonWebError> {
  // Tags already linked to these files may lose links below, so their
  // use counts need recounting too. Only "set" semantics remove links.
  let previously_linked_tag_tokens = if remove_unmentioned {
    list_linked_tag_tokens_for_media_files(ListLinkedTagTokensForMediaFilesArgs {
      media_file_tokens,
      user_token,
      mysql_executor: &mut **tx,
      phantom: PhantomData,
    }).await.map_err(|err| {
      warn!("list_linked_tag_tokens_for_media_files failed: {:?}", err);
      CommonWebError::from_error(err)
    })?
  } else {
    Vec::new()
  };

  upsert_tags(UpsertTagsArgs {
    new_tags,
    creator_user_token: user_token,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("upsert_tags failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let lowercase_values: Vec<String> = new_tags.iter()
    .map(|t| t.tag_value_lowercase.clone())
    .collect();
  let tag_rows = select_tags_by_lowercase_values(SelectTagsByLowercaseValuesArgs {
    tag_values_lowercase: &lowercase_values,
    creator_user_token: user_token,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("select_tags_by_lowercase_values failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;
  let tag_tokens: Vec<TagToken> = tag_rows.iter().map(|row| row.token.clone()).collect();

  let removed_count = if remove_unmentioned {
    let removed = if tag_tokens.is_empty() {
      clear_media_file_tags(ClearMediaFileTagsArgs {
        media_file_tokens,
        user_token,
        mysql_executor: &mut **tx,
        phantom: PhantomData,
      }).await
    } else {
      delete_media_file_tags_not_in_set(DeleteMediaFileTagsNotInSetArgs {
        media_file_tokens,
        keep_tag_tokens: &tag_tokens,
        user_token,
        mysql_executor: &mut **tx,
        phantom: PhantomData,
      }).await
    };
    removed.map_err(|err| {
      warn!("Removing unmentioned tag links failed: {:?}", err);
      CommonWebError::from_error(err)
    })?
  } else {
    0
  };

  insert_media_file_tags(InsertMediaFileTagsArgs {
    media_file_tokens,
    tag_tokens: &tag_tokens,
    user_token,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("insert_media_file_tags failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // Guard against a concurrent tag delete: our snapshot SELECT above
  // may have seen the tag as live while another transaction soft-
  // deleted it (hard-deleting its links). This DELETE is a locking
  // read, so it observes the committed soft-delete and removes any
  // links we just re-inserted, instead of leaving orphans.
  delete_links_to_soft_deleted_tags(DeleteLinksToSoftDeletedTagsArgs {
    tag_tokens: &tag_tokens,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("delete_links_to_soft_deleted_tags failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // Recount every tag whose link set may have changed: the requested
  // tags plus any tags that previously linked to these files.
  let mut recount_tag_tokens = tag_tokens.clone();
  for token in previously_linked_tag_tokens {
    if !recount_tag_tokens.contains(&token) {
      recount_tag_tokens.push(token);
    }
  }
  recount_tag_use_counts(RecountTagUseCountsArgs {
    tag_tokens: &recount_tag_tokens,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("recount_tag_use_counts failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // Re-read the requested tags so the response carries fresh use counts.
  let fresh_tag_rows = select_tags_by_tokens_for_owner(SelectTagsByTokensForOwnerArgs {
    tag_tokens: &tag_tokens,
    creator_user_token: user_token,
    mysql_executor: &mut **tx,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("select_tags_by_tokens_for_owner failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(ApplyTagsOutcome {
    tags: fresh_tag_rows,
    removed_count,
  })
}
