// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
//#![forbid(unused_variables)]

use chrono::{DateTime, Utc};
use sqlx::MySqlPool;

use enums::common::visibility::Visibility;
use errors::AnyhowResult;

use crate::config::shared_constants::DEFAULT_MYSQL_QUERY_RESULT_PAGE_SIZE;

#[derive(Serialize)]
pub struct TtsInferenceListPage {
  pub inference_records: Vec<TtsInferenceRecordForList>,
  pub sort_ascending: bool,

  /// ID of the first record in `inference_records`.
  pub first_id: Option<i64>,

  /// ID of the last record in `inference_records`.
  pub last_id: Option<i64>,
}

#[derive(Serialize)]
pub struct TtsInferenceRecordForList {
  pub tts_result_token: String,

  pub tts_model_token: String,
  pub tts_model_title: String,
  pub raw_inference_text: String,

  pub public_bucket_wav_audio_path: String,

  pub maybe_creator_user_token: Option<String>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,

  pub maybe_creator_result_id: Option<u64>,

  pub file_size_bytes: u32,
  pub duration_millis: u32,

  pub visibility: Visibility,

  //pub model_is_mod_approved: bool, // converted
  //pub maybe_mod_user_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

/// Query Builder for listing TTS results.
/// These are very difficult queries, so the builder helps for
/// testability, construction, and correctness.
pub struct ListTtsResultsQueryBuilder {
  scope_creator_username: Option<String>,
  include_user_hidden: bool,
  include_mod_disabled_results: bool,
  sort_ascending: bool,
  offset: Option<u64>,
  limit: u16,
  cursor_is_reversed: bool,
}

impl ListTtsResultsQueryBuilder {
  pub fn new() -> Self {
    Self {
      scope_creator_username: None,
      include_user_hidden: false,
      include_mod_disabled_results: false,
      sort_ascending: false,
      offset: None,
      limit: DEFAULT_MYSQL_QUERY_RESULT_PAGE_SIZE,
      cursor_is_reversed: false,
    }
  }

  pub fn scope_creator_username(mut self, scope_creator_username: Option<&str>) -> Self {
    self.scope_creator_username = scope_creator_username.map(|u| u.to_string());
    self
  }

  pub fn include_user_hidden(mut self, include_user_hidden: bool) -> Self {
    self.include_user_hidden = include_user_hidden;
    self
  }

  pub fn include_mod_disabled_results(mut self, include_mod_disabled_results: bool) -> Self {
    self.include_mod_disabled_results = include_mod_disabled_results;
    self
  }

  pub fn sort_ascending(mut self, sort_ascending: bool) -> Self {
    self.sort_ascending = sort_ascending;
    self
  }

  pub fn offset(mut self, offset: Option<u64>) -> Self {
    self.offset = offset;
    self
  }

  pub fn limit(mut self, limit: u16) -> Self {
    self.limit = limit;
    self
  }

  pub fn cursor_is_reversed(mut self, cursor_is_reversed: bool) -> Self {
    self.cursor_is_reversed = cursor_is_reversed;
    self
  }

  /// Perform the query based on the set predicates.
  /// Wrap the results in a "Page" we can return to the frontend.
  /// This will remove any IDs from the records, but the ids themselves also need scrubbing.
  pub async fn perform_query_for_page(
    &self,
    mysql_pool: &MySqlPool
  ) -> AnyhowResult<TtsInferenceListPage> {

    let internal_results = self.perform_internal_query(mysql_pool).await?;

    let first_id = internal_results.first()
        .map(|raw_result| raw_result.tts_result_id);

    let last_id = internal_results.last()
        .map(|raw_result| raw_result.tts_result_id);

    let inference_results = internal_results
        .into_iter()
        .map(|r| {
          TtsInferenceRecordForList {
            tts_result_token: r.tts_result_token,
            tts_model_token: r.tts_model_token,
            tts_model_title: r.tts_model_title,
            raw_inference_text: r.raw_inference_text,
            public_bucket_wav_audio_path: r.public_bucket_wav_audio_path,
            maybe_creator_user_token: r.maybe_creator_user_token,
            maybe_creator_username: r.maybe_creator_username,
            maybe_creator_display_name: r.maybe_creator_display_name,
            maybe_creator_result_id: r.maybe_creator_result_id.map(|v| v as u64),
            file_size_bytes: if r.file_size_bytes > 0 { r.file_size_bytes as u32 } else { 0 },
            duration_millis: if r.duration_millis > 0 { r.duration_millis as u32 } else { 0 },
            visibility: Visibility::from_str(&r.creator_set_visibility).unwrap_or(Visibility::Public),
            created_at: r.created_at,
            updated_at: r.updated_at,
          }
        })
        .collect::<Vec<TtsInferenceRecordForList>>();

    Ok(TtsInferenceListPage {
      inference_records: inference_results,
      sort_ascending: self.sort_ascending,
      first_id,
      last_id,
    })
  }

  /// Perform the query based on the set predicates.
  /// The records contain IDs, which we should not expose to the frontend.
  pub async fn perform_internal_query(
    &self,
    mysql_pool: &MySqlPool
  ) -> AnyhowResult<Vec<RawInternalTtsRecord>> {

    let query = self.build_query_string();
    let mut query = sqlx::query_as::<_, RawInternalTtsRecord>(sqlx::AssertSqlSafe(&*query));

    // NB: The following bindings must match the order of the query builder !!

    if let Some(offset) = self.offset {
      query = query.bind(offset);
    }

    if let Some(username) = self.scope_creator_username.as_deref() {
      query = query.bind(username);
    }

    query = query.bind(self.limit);

    let mut results = query.fetch_all(mysql_pool)
        .await?;

    if self.cursor_is_reversed {
      results.reverse()
    }

    Ok(results)
  }

  pub fn build_query_string(&self) -> String {
    // TODO: I haven't figured out how to get field name disambiguation and type coercion working here.
    //    (1) tts_results.creator_set_visibility `creator_set_visibility: crate::database::enums::record_visibility::RecordVisibility`,
    //    Query error: no column found for name: creator_set_visibility
    //    (2) creator_set_visibility `creator_set_visibility: crate::database::enums::record_visibility::RecordVisibility`,
    //    Column 'creator_set_visibility' in field list is ambiguous

    // TODO/NB: Unfortunately SQLx can't statically typecheck this query
    let mut query = r#"
SELECT
    tts_results.id as tts_result_id,
    tts_results.token as tts_result_token,

    tts_results.model_token as tts_model_token,
    tts_models.title as tts_model_title,
    tts_results.raw_inference_text as raw_inference_text,

    tts_results.public_bucket_wav_audio_path,

    users.token as maybe_creator_user_token,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,

    tts_results.maybe_creator_synthetic_id as maybe_creator_result_id,

    tts_results.file_size_bytes,
    tts_results.duration_millis,

    tts_results.creator_set_visibility,

    tts_results.created_at,
    tts_results.updated_at

FROM tts_results
LEFT OUTER JOIN tts_models
    ON tts_results.model_token = tts_models.token
LEFT OUTER JOIN users
    ON tts_results.maybe_creator_user_token = users.token
    "#.to_string();

    query.push_str(&self.build_predicates());
    query
  }

  pub fn build_predicates(&self) -> String {
    // NB: Reverse cursors require us to invert the sort direction.
    let mut sort_ascending = self.sort_ascending;

    let mut first_predicate_added = false;

    let mut query = "".to_string();

    if let Some(_offset) = self.offset {
      if !first_predicate_added {
        query.push_str(" WHERE");
        first_predicate_added = true;
      } else {
        query.push_str(" AND");
      }

      if sort_ascending {
        if self.cursor_is_reversed {
          // NB: We're searching backwards.
          query.push_str(" tts_results.id < ?");
          sort_ascending = !sort_ascending;
        } else {
          query.push_str(" tts_results.id > ?");
        }
      } else {
        if self.cursor_is_reversed {
          // NB: We're searching backwards.
          query.push_str(" tts_results.id > ?");
          sort_ascending = !sort_ascending;
        } else {
          query.push_str(" tts_results.id < ?");
        }
      }
    }

    if let Some(_username) = self.scope_creator_username.as_deref() {
      if !first_predicate_added {
        query.push_str(" WHERE users.username = ?");
        first_predicate_added = true;
      } else {
        query.push_str(" AND users.username = ?");
      }
    }

    if !self.include_user_hidden {
      if !first_predicate_added {
        query.push_str(" WHERE tts_results.creator_set_visibility = 'public'");
        first_predicate_added = true;
      } else {
        query.push_str(" AND tts_results.creator_set_visibility = 'public'");
      }
    }

    if !self.include_mod_disabled_results {
      if !first_predicate_added {
        query.push_str(" WHERE tts_results.user_deleted_at IS NULL");
        query.push_str(" AND tts_results.mod_deleted_at IS NULL");
        first_predicate_added = true;
      } else {
        query.push_str(" AND tts_results.user_deleted_at IS NULL");
        query.push_str(" AND tts_results.mod_deleted_at IS NULL");
      }
    }

    if sort_ascending {
      query.push_str(" ORDER BY tts_results.id ASC");
    } else {
      query.push_str(" ORDER BY tts_results.id DESC");
    }

    query.push_str(" LIMIT ?");

    query
  }
}

#[derive(sqlx::FromRow)]
pub struct RawInternalTtsRecord {
  pub tts_result_id: i64,
  pub tts_result_token: String,

  pub tts_model_token: String,
  pub tts_model_title: String,
  pub raw_inference_text: String,

  pub public_bucket_wav_audio_path: String,

  pub maybe_creator_user_token : Option<String>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,

  pub maybe_creator_result_id: Option<i64>,

  pub file_size_bytes : i64,
  pub duration_millis : i64,

  pub creator_set_visibility: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
  use crate::queries::tts::tts_results::list_tts_results_query_builder::ListTtsResultsQueryBuilder;

  #[test]
  fn predicates_without_scoping() {
    let query_builder = ListTtsResultsQueryBuilder::new();

    assert_eq!(&query_builder.build_predicates(),
      " WHERE tts_results.creator_set_visibility = 'public' \
      AND tts_results.user_deleted_at IS NULL \
      AND tts_results.mod_deleted_at IS NULL \
      ORDER BY tts_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_scoped_to_user() {
    let query_builder = ListTtsResultsQueryBuilder::new()
        .scope_creator_username(Some("echelon"));

    assert_eq!(&query_builder.build_predicates(),
      " WHERE users.username = ? \
      AND tts_results.creator_set_visibility = 'public' \
      AND tts_results.user_deleted_at IS NULL \
      AND tts_results.mod_deleted_at IS NULL \
      ORDER BY tts_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_including_user_hidden() {
    let query_builder = ListTtsResultsQueryBuilder::new()
        .include_user_hidden(true);

    assert_eq!(&query_builder.build_predicates(),
      " WHERE tts_results.user_deleted_at IS NULL \
      AND tts_results.mod_deleted_at IS NULL \
      ORDER BY tts_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_including_deleted() {
    let query_builder = ListTtsResultsQueryBuilder::new()
        .include_mod_disabled_results(true);

    assert_eq!(&query_builder.build_predicates(),
      " WHERE tts_results.creator_set_visibility = 'public' \
      ORDER BY tts_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_sort_ascending() {
    let query_builder = ListTtsResultsQueryBuilder::new()
        .sort_ascending(true);

    assert_eq!(&query_builder.build_predicates(),
      " WHERE tts_results.creator_set_visibility = 'public' \
      AND tts_results.user_deleted_at IS NULL \
      AND tts_results.mod_deleted_at IS NULL \
      ORDER BY tts_results.id ASC \
      LIMIT ?");
  }

  #[test]
  fn predicates_offset() {
    let query_builder = ListTtsResultsQueryBuilder::new()
        .offset(Some(100));

    assert_eq!(&query_builder.build_predicates(),
      " WHERE tts_results.id < ? \
      AND tts_results.creator_set_visibility = 'public' \
      AND tts_results.user_deleted_at IS NULL \
      AND tts_results.mod_deleted_at IS NULL \
      ORDER BY tts_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_offset_and_sort_ascending() {
    let query_builder = ListTtsResultsQueryBuilder::new()
        .sort_ascending(true)
        .offset(Some(100));

    assert_eq!(&query_builder.build_predicates(),
      " WHERE tts_results.id > ? \
      AND tts_results.creator_set_visibility = 'public' \
      AND tts_results.user_deleted_at IS NULL \
      AND tts_results.mod_deleted_at IS NULL \
      ORDER BY tts_results.id ASC \
      LIMIT ?");
  }

  #[test]
  fn predicates_limit() {
    let query_builder = ListTtsResultsQueryBuilder::new()
        .limit(15);

    // NB: Does not change the query itself! Just the downstream binding.
    assert_eq!(&query_builder.build_predicates(),
      " WHERE tts_results.creator_set_visibility = 'public' \
      AND tts_results.user_deleted_at IS NULL \
      AND tts_results.mod_deleted_at IS NULL \
      ORDER BY tts_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_cursor_is_reversed_without_cursor() {
    let query_builder = ListTtsResultsQueryBuilder::new()
        .cursor_is_reversed(true);

    // NB: Without a cursor, nothing happens.
    assert_eq!(&query_builder.build_predicates(),
      " WHERE tts_results.creator_set_visibility = 'public' \
      AND tts_results.user_deleted_at IS NULL \
      AND tts_results.mod_deleted_at IS NULL \
      ORDER BY tts_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_offset_cursor_is_reversed() {
    let query_builder = ListTtsResultsQueryBuilder::new()
        .offset(Some(100))
        .cursor_is_reversed(true);

    // NB: This will change the sort order and greater/less than direction!
    assert_eq!(&query_builder.build_predicates(),
      " WHERE tts_results.id > ? \
      AND tts_results.creator_set_visibility = 'public' \
      AND tts_results.user_deleted_at IS NULL \
      AND tts_results.mod_deleted_at IS NULL \
      ORDER BY tts_results.id ASC \
      LIMIT ?");
  }

  #[test]
  fn predicates_offset_cursor_is_reversed_sort_ascending() {
    let query_builder = ListTtsResultsQueryBuilder::new()
        .offset(Some(100))
        .cursor_is_reversed(true)
        .sort_ascending(true);

    // NB: This will change the sort order and greater/less than direction!
    assert_eq!(&query_builder.build_predicates(),
      " WHERE tts_results.id < ? \
      AND tts_results.creator_set_visibility = 'public' \
      AND tts_results.user_deleted_at IS NULL \
      AND tts_results.mod_deleted_at IS NULL \
      ORDER BY tts_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_limit_scope_user_offset_cursor_is_reversed_sort_ascending() {
    let query_builder = ListTtsResultsQueryBuilder::new()
        .limit(1000)
        .scope_creator_username(Some("pikachu"))
        .offset(Some(100))
        .cursor_is_reversed(true)
        .sort_ascending(true);

    // NB: This will change the sort order and greater/less than direction!
    assert_eq!(&query_builder.build_predicates(),
      " WHERE tts_results.id < ? \
      AND users.username = ? \
      AND tts_results.creator_set_visibility = 'public' \
      AND tts_results.user_deleted_at IS NULL \
      AND tts_results.mod_deleted_at IS NULL \
      ORDER BY tts_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_limit_scope_user_show_hidden_offset_cursor_is_reversed_sort_ascending() {
    let query_builder = ListTtsResultsQueryBuilder::new()
        .limit(1000)
        .include_user_hidden(true)
        .scope_creator_username(Some("pikachu"))
        .offset(Some(100))
        .cursor_is_reversed(true)
        .sort_ascending(true);

    // NB: This will change the sort order and greater/less than direction!
    assert_eq!(&query_builder.build_predicates(),
      " WHERE tts_results.id < ? \
      AND users.username = ? \
      AND tts_results.user_deleted_at IS NULL \
      AND tts_results.mod_deleted_at IS NULL \
      ORDER BY tts_results.id DESC \
      LIMIT ?");
  }
}
