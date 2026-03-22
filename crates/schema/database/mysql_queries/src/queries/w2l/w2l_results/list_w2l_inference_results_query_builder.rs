// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use chrono::{DateTime, Utc};
use sqlx::MySqlPool;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;

use crate::config::shared_constants::DEFAULT_MYSQL_QUERY_RESULT_PAGE_SIZE;

#[derive(Serialize)]
pub struct W2lInferenceListPage {
  pub inference_records: Vec<W2lInferenceRecordForList>,
  pub sort_ascending: bool,

  /// ID of the first record in `inference_records`.
  pub first_id: Option<i64>,

  /// ID of the last record in `inference_records`.
  pub last_id: Option<i64>,
}

#[derive(Serialize)]
pub struct W2lInferenceRecordForList {
  pub w2l_result_token: String,
  pub maybe_w2l_template_token: Option<String>,
  pub maybe_tts_inference_result_token: Option<String>,

  pub template_type: Option<String>,
  pub template_title: Option<String>,

  pub maybe_creator_user_token: Option<String>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,
  
  pub maybe_creator_result_id: Option<u64>,

  pub file_size_bytes: u32,
  pub frame_width: u32,
  pub frame_height: u32,
  pub duration_millis: u32,

  pub visibility: Visibility,

  //pub template_is_mod_approved: bool, // converted
  //pub maybe_mod_user_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

/// Query Builder for listing W2L results.
/// These are very difficult queries, so the builder helps for
/// testability, construction, and correctness.
pub struct ListW2lResultsQueryBuilder {
  scope_creator_username: Option<String>,
  include_user_hidden: bool,
  include_mod_deleted_results: bool,
  include_user_deleted_results: bool,
  include_templates_not_approved_for_public_listing: bool,
  sort_ascending: bool,
  offset: Option<u64>,
  limit: u16,
  cursor_is_reversed: bool,
}

impl ListW2lResultsQueryBuilder {
  pub fn new() -> Self {
    Self {
      scope_creator_username: None,
      include_user_hidden: false,
      include_mod_deleted_results: false,
      include_user_deleted_results: false,
      include_templates_not_approved_for_public_listing: false,
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

  pub fn include_mod_deleted_results(mut self, include_mod_deleted_results: bool) -> Self {
    self.include_mod_deleted_results = include_mod_deleted_results;
    self
  }

  pub fn include_user_deleted_results(mut self, include_user_deleted_results: bool) -> Self {
    self.include_user_deleted_results = include_user_deleted_results;
    self
  }

  pub fn include_templates_not_approved_for_public_listing(mut self, include_templates_not_approved_for_public_listing: bool) -> Self {
    self.include_templates_not_approved_for_public_listing = include_templates_not_approved_for_public_listing;
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
  ) -> AnyhowResult<W2lInferenceListPage> {

    let internal_results = self.perform_internal_query(mysql_pool).await?;

    let first_id = internal_results.first()
        .map(|raw_result| raw_result.w2l_result_id);

    let last_id = internal_results.last()
        .map(|raw_result| raw_result.w2l_result_id);

    let inference_results = internal_results
        .iter()
        .map(|r| {
          W2lInferenceRecordForList {
            w2l_result_token: r.w2l_result_token.clone(),
            maybe_w2l_template_token: r.maybe_w2l_template_token.clone(),
            maybe_tts_inference_result_token: r.maybe_tts_inference_result_token.clone(),
            template_type: r.template_type.clone(),
            template_title: r.template_title.clone(),
            maybe_creator_user_token: r.maybe_creator_user_token.clone(),
            maybe_creator_username: r.maybe_creator_username.clone(),
            maybe_creator_display_name: r.maybe_creator_display_name.clone(),
            maybe_creator_result_id: r.maybe_creator_result_id.map(|v| v as u64),
            file_size_bytes: if r.file_size_bytes > 0 { r.file_size_bytes as u32 } else { 0 },
            frame_width: if r.frame_width > 0 { r.frame_width as u32 } else { 0 },
            frame_height: if r.frame_height > 0 { r.frame_height as u32 } else { 0 },
            duration_millis: if r.duration_millis > 0 { r.duration_millis as u32 } else { 0 },
            visibility: Visibility::from_str(&r.creator_set_visibility).unwrap_or(Visibility::Public),
            created_at: r.created_at,
            updated_at: r.updated_at,
          }
        })
        .collect::<Vec<W2lInferenceRecordForList>>();

    Ok(W2lInferenceListPage {
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
    let mut query = sqlx::query_as::<_, RawInternalTtsRecord>(&query);

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
    //    (1) w2l_results.creator_set_visibility `creator_set_visibility: crate::database::enums::record_visibility::RecordVisibility`,
    //    Query error: no column found for name: creator_set_visibility
    //    (2) creator_set_visibility `creator_set_visibility: crate::database::enums::record_visibility::RecordVisibility`,
    //    Column 'creator_set_visibility' in field list is ambiguous

    // TODO/NB: Unfortunately SQLx can't statically typecheck this query
    let mut query = r#"
SELECT
    w2l_results.id as w2l_result_id,
    w2l_results.token as w2l_result_token,
    w2l_results.maybe_tts_inference_result_token,

    w2l_templates.token as maybe_w2l_template_token,
    w2l_templates.template_type,
    w2l_templates.title as template_title,

    users.token as maybe_creator_user_token,
    users.username as maybe_creator_username,
    users.display_name as maybe_creator_display_name,

    w2l_results.maybe_creator_synthetic_id as maybe_creator_result_id,

    w2l_results.file_size_bytes,
    w2l_results.frame_width,
    w2l_results.frame_height,
    w2l_results.duration_millis,

    w2l_results.creator_set_visibility,

    w2l_results.created_at,
    w2l_results.updated_at

FROM w2l_results
LEFT OUTER JOIN w2l_templates
    ON w2l_results.maybe_w2l_template_token = w2l_templates.token
LEFT OUTER JOIN users
    ON w2l_results.maybe_creator_user_token = users.token
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
          query.push_str(" w2l_results.id < ?");
          sort_ascending = !sort_ascending;
        } else {
          query.push_str(" w2l_results.id > ?");
        }
      } else {
        if self.cursor_is_reversed {
          // NB: We're searching backwards.
          query.push_str(" w2l_results.id > ?");
          sort_ascending = !sort_ascending;
        } else {
          query.push_str(" w2l_results.id < ?");
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

    if !self.include_templates_not_approved_for_public_listing {
      if !first_predicate_added {
        query.push_str(" WHERE w2l_templates.is_public_listing_approved IS TRUE");
        first_predicate_added = true;
      } else {
        query.push_str(" AND w2l_templates.is_public_listing_approved IS TRUE");
      }
    }

    if !self.include_user_hidden {
      if !first_predicate_added {
        query.push_str(" WHERE w2l_results.creator_set_visibility = 'public'");
        first_predicate_added = true;
      } else {
        query.push_str(" AND w2l_results.creator_set_visibility = 'public'");
      }
    }

    if !self.include_mod_deleted_results {
      if !first_predicate_added {
        query.push_str(" WHERE w2l_results.mod_deleted_at IS NULL");
        first_predicate_added = true;
      } else {
        query.push_str(" AND w2l_results.mod_deleted_at IS NULL");
      }
    }

    if !self.include_user_deleted_results {
      if !first_predicate_added {
        query.push_str(" WHERE w2l_results.user_deleted_at IS NULL");
        first_predicate_added = true;
      } else {
        query.push_str(" AND w2l_results.user_deleted_at IS NULL");
      }
    }

    if sort_ascending {
      query.push_str(" ORDER BY w2l_results.id ASC");
    } else {
      query.push_str(" ORDER BY w2l_results.id DESC");
    }

    query.push_str(" LIMIT ?");

    query
  }
}

#[derive(sqlx::FromRow)]
pub struct RawInternalTtsRecord {
  pub w2l_result_id: i64,
  pub w2l_result_token: String,

  pub maybe_w2l_template_token: Option<String>,
  pub maybe_tts_inference_result_token: Option<String>,

  pub template_type: Option<String>,
  pub template_title: Option<String>, // from field `w2l_templates.title`

  pub maybe_creator_user_token: Option<String>,
  pub maybe_creator_username: Option<String>,
  pub maybe_creator_display_name: Option<String>,

  pub maybe_creator_result_id: Option<i64>,

  pub file_size_bytes: i32,
  pub frame_width: i32,
  pub frame_height: i32,
  pub duration_millis: i32,

  pub creator_set_visibility: String,

  //pub template_is_mod_approved: i8, // needs convert
  //pub maybe_mod_user_token: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
  use crate::queries::w2l::w2l_results::list_w2l_inference_results_query_builder::ListW2lResultsQueryBuilder;

  #[test]
  fn predicates_without_scoping() {
    let query_builder = ListW2lResultsQueryBuilder::new();

    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.mod_deleted_at IS NULL \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_scoped_to_user() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .scope_creator_username(Some("echelon"));

    assert_eq!(&query_builder.build_predicates(),
      " WHERE users.username = ? \
      AND w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.mod_deleted_at IS NULL \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_including_user_hidden() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .include_user_hidden(true);

    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.mod_deleted_at IS NULL \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_including_mod_deleted() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .include_mod_deleted_results(true);

    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_including_user_deleted() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .include_user_deleted_results(true);

    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.mod_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_including_mod_deleted_and_user_deleted() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .include_mod_deleted_results(true)
        .include_user_deleted_results(true);

    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.creator_set_visibility = 'public' \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_including_unapproved() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .include_templates_not_approved_for_public_listing(true);

    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.mod_deleted_at IS NULL \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_including_unapproved_and_mod_deleted() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .include_templates_not_approved_for_public_listing(true)
        .include_mod_deleted_results(true);

    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_including_unapproved_and_user_deleted() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .include_templates_not_approved_for_public_listing(true)
        .include_user_deleted_results(true);

    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.mod_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_including_mod_deleted_user_deleted_and_unapproved() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .include_mod_deleted_results(true)
        .include_user_deleted_results(true)
        .include_templates_not_approved_for_public_listing(true);

    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_results.creator_set_visibility = 'public' \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_sort_ascending() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .sort_ascending(true);

    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.mod_deleted_at IS NULL \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id ASC \
      LIMIT ?");
  }

  #[test]
  fn predicates_offset() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .offset(Some(100));

    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_results.id < ? \
      AND w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.mod_deleted_at IS NULL \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_offset_and_sort_ascending() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .sort_ascending(true)
        .offset(Some(100));

    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_results.id > ? \
      AND w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.mod_deleted_at IS NULL \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id ASC \
      LIMIT ?");
  }

  #[test]
  fn predicates_limit() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .limit(15);

    // NB: Does not change the query itself! Just the downstream binding.
    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.mod_deleted_at IS NULL \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_cursor_is_reversed_without_cursor() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .cursor_is_reversed(true);

    // NB: Without a cursor, nothing happens.
    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.mod_deleted_at IS NULL \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_offset_cursor_is_reversed() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .offset(Some(100))
        .cursor_is_reversed(true);

    // NB: This will change the sort order and greater/less than direction!
    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_results.id > ? \
      AND w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.mod_deleted_at IS NULL \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id ASC \
      LIMIT ?");
  }

  #[test]
  fn predicates_offset_cursor_is_reversed_sort_ascending() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .offset(Some(100))
        .cursor_is_reversed(true)
        .sort_ascending(true);

    // NB: This will change the sort order and greater/less than direction!
    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_results.id < ? \
      AND w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.mod_deleted_at IS NULL \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_limit_scope_user_offset_cursor_is_reversed_sort_ascending() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .limit(1000)
        .scope_creator_username(Some("pikachu"))
        .offset(Some(100))
        .cursor_is_reversed(true)
        .sort_ascending(true);

    // NB: This will change the sort order and greater/less than direction!
    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_results.id < ? \
      AND users.username = ? \
      AND w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.creator_set_visibility = 'public' \
      AND w2l_results.mod_deleted_at IS NULL \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }

  #[test]
  fn predicates_limit_scope_user_show_hidden_offset_cursor_is_reversed_sort_ascending() {
    let query_builder = ListW2lResultsQueryBuilder::new()
        .limit(1000)
        .include_user_hidden(true)
        .scope_creator_username(Some("pikachu"))
        .offset(Some(100))
        .cursor_is_reversed(true)
        .sort_ascending(true);

    // NB: This will change the sort order and greater/less than direction!
    assert_eq!(&query_builder.build_predicates(),
      " WHERE w2l_results.id < ? \
      AND users.username = ? \
      AND w2l_templates.is_public_listing_approved IS TRUE \
      AND w2l_results.mod_deleted_at IS NULL \
      AND w2l_results.user_deleted_at IS NULL \
      ORDER BY w2l_results.id DESC \
      LIMIT ?");
  }
}
