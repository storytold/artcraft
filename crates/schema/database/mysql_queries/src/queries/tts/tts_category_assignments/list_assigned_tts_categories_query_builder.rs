use chrono::{DateTime, Utc};
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use errors::AnyhowResult;

use crate::helpers::boolean_converters::{i8_to_bool, nullable_i8_to_optional_bool};

/// List of assigned categories for a TTS model
/// This is *NOT* paginated, as that defeats the purpose of having a category system.
#[derive(Serialize)]
pub struct AssignedCategoryList {
  pub categories: Vec<AssignedCategory>,
}

#[derive(Serialize)]
pub struct AssignedCategory {
  pub category_token: String,

  pub model_type: String, // TODO: ENUM

  pub maybe_super_category_token: Option<String>,

  pub can_directly_have_models: bool,
  pub can_have_subcategories: bool,
  pub can_only_mods_apply: bool,

  pub name: String,
  pub maybe_dropdown_name: Option<String>,

  pub category_creator_user_token: Option<String>,
  pub category_creator_username: Option<String>,
  pub category_creator_display_name: Option<String>,
  pub category_creator_gravatar_hash: Option<String>,

  // Moderator fields
  pub is_mod_approved: Option<bool>,
  pub maybe_mod_comments: Option<String>,
  //pub maybe_mod_user_token: Option<String>,
  //pub maybe_mod_username: Option<String>,
  //pub maybe_mod_display_name: Option<String>,

  pub category_created_at: DateTime<Utc>,
  pub category_updated_at: DateTime<Utc>,
  pub category_deleted_at: Option<DateTime<Utc>>,

  pub category_assignment_created_at: DateTime<Utc>,
  pub category_assignment_updated_at: DateTime<Utc>,
  pub category_assignment_deleted_at: Option<DateTime<Utc>>,
}

/// Query Builder for listing categories
/// These are very difficult queries, so the builder helps for
/// testability, construction, and correctness.
pub struct ListAssignedTtsCategoriesQueryBuilder {
  // REQUIRED.
  scope_tts_model_token: String,

  // Sometimes "can_directly_have_models" categories change state.
  // Mods will want to see invalid uses.
  show_invalid_model_not_allowed_categories: bool,

  // The public lists won't include unapproved, but mod views
  // will want to see them.
  show_unapproved: bool,

  // The public lists won't include deleted models, but mod views
  // will want to see them.
  show_deleted: bool,
}

impl ListAssignedTtsCategoriesQueryBuilder {
  pub fn for_model_token(model_token: &str) -> Self {
    Self {
      scope_tts_model_token: model_token.to_string(),
      show_invalid_model_not_allowed_categories: false,
      show_unapproved: false,
      show_deleted: false,
    }
  }

  pub fn show_invalid_model_not_allowed_categories(mut self, show_invalid_model_not_allowed_categories: bool) -> Self {
    self.show_invalid_model_not_allowed_categories = show_invalid_model_not_allowed_categories;
    self
  }

  pub fn show_unapproved(mut self, show_unapproved: bool) -> Self {
    self.show_unapproved = show_unapproved;
    self
  }

  pub fn show_deleted(mut self, show_deleted: bool) -> Self {
    self.show_deleted = show_deleted;
    self
  }

  /// Perform the query based on the set predicates.
  #[deprecated = "Use the PoolConnection<MySql> method instead of the MySqlPool one."]
  pub async fn perform_query(
    &self,
    mysql_pool: &MySqlPool
  ) -> AnyhowResult<AssignedCategoryList> {
    let mut mysql_connection = mysql_pool.acquire().await?;
    self.perform_query_by_connection(&mut mysql_connection).await
  }

  /// Perform the query based on the set predicates.
  pub async fn perform_query_by_connection(
    &self,
    mysql_connection: &mut PoolConnection<MySql>
  ) -> AnyhowResult<AssignedCategoryList> {

    let internal_results = self.perform_internal_query(mysql_connection).await?;

    let categories = internal_results
        .into_iter()
        .map(|c| {
          AssignedCategory {
            category_token: c.category_token,
            model_type: c.model_type,
            maybe_super_category_token: c.maybe_super_category_token,
            can_directly_have_models: i8_to_bool(c.can_directly_have_models),
            can_have_subcategories: i8_to_bool(c.can_have_subcategories),
            can_only_mods_apply: i8_to_bool(c.can_only_mods_apply),
            name: c.name,
            maybe_dropdown_name: c.maybe_dropdown_name,
            category_creator_user_token: c.category_creator_user_token,
            category_creator_username: c.category_creator_username,
            category_creator_display_name: c.category_creator_display_name,
            category_creator_gravatar_hash: c.category_creator_gravatar_hash,
            is_mod_approved: nullable_i8_to_optional_bool(c.is_mod_approved),
            maybe_mod_comments: c.maybe_mod_comments,
            category_created_at: c.category_created_at,
            category_updated_at: c.category_updated_at,
            category_deleted_at: c.category_deleted_at,
            category_assignment_created_at: c.category_assignment_created_at,
            category_assignment_updated_at: c.category_assignment_updated_at,
            category_assignment_deleted_at: c.category_assignment_deleted_at,
          }
        })
        .collect::<Vec<AssignedCategory>>();

    Ok(AssignedCategoryList {
      categories,
    })
  }

  /// Perform the query based on the set predicates.
  async fn perform_internal_query(
    &self,
    mysql_connection: &mut PoolConnection<MySql>
  ) -> AnyhowResult<Vec<RawInternalCategoryRecord>> {

    let query = self.build_query_string();
    let mut query = sqlx::query_as::<_, RawInternalCategoryRecord>(sqlx::AssertSqlSafe(&*query));

    // NB: The following bindings must match the order of the query builder !!

    // NB: Model token is always used for scoping.
    query = query.bind(&self.scope_tts_model_token);

    let results = query.fetch_all(&mut **mysql_connection)
        .await?;

    Ok(results)
  }

  fn build_query_string(&self) -> String {
    // TODO: I haven't figured out how to get field name disambiguation and type coercion working here.
    //    (1) tts_results.creator_set_visibility `creator_set_visibility: crate::database::enums::record_visibility::RecordVisibility`,
    //    Query error: no column found for name: creator_set_visibility
    //    (2) creator_set_visibility `creator_set_visibility: crate::database::enums::record_visibility::RecordVisibility`,
    //    Column 'creator_set_visibility' in field list is ambiguous

    // TODO/NB: Unfortunately SQLx can't statically typecheck this query
    let mut query = r#"
SELECT
    model_categories.token as category_token,

    model_categories.model_type,

    model_categories.maybe_super_category_token,

    model_categories.can_directly_have_models,
    model_categories.can_have_subcategories,
    model_categories.can_only_mods_apply,

    model_categories.name,
    model_categories.maybe_dropdown_name,

    users.token as category_creator_user_token,
    users.username as category_creator_username,
    users.display_name as category_creator_display_name,
    users.email_gravatar_hash as category_creator_gravatar_hash,

    model_categories.is_mod_approved,
    model_categories.maybe_mod_comments,

    model_categories.created_at as category_created_at,
    model_categories.updated_at as category_updated_at,
    model_categories.deleted_at as category_deleted_at,

    tts_category_assignments.created_at as category_assignment_created_at,
    tts_category_assignments.updated_at as category_assignment_updated_at,
    tts_category_assignments.deleted_at as category_assignment_deleted_at

FROM model_categories
JOIN tts_category_assignments
    ON tts_category_assignments.category_token = model_categories.token
LEFT OUTER JOIN users
    ON model_categories.creator_user_token = users.token
    "#.to_string();

    query.push_str(&self.build_predicates());
    query
  }

  pub fn build_predicates(&self) -> String {
    let mut query = "".to_string();

    // Scoping to tts model is required.
    query.push_str(" WHERE tts_category_assignments.model_token = ?");
    query.push_str(" AND model_categories.model_type = 'tts'");

    // We also don't care to ever show soft-deleted assignments
    query.push_str(" AND tts_category_assignments.deleted_at IS NULL");

    if !self.show_invalid_model_not_allowed_categories {
      query.push_str(" AND model_categories.can_directly_have_models IS TRUE");
    }

    if !self.show_unapproved {
      query.push_str(" AND model_categories.is_mod_approved IS TRUE");
    }

    if !self.show_deleted {
      query.push_str(" AND model_categories.deleted_at IS NULL");
    }

    query
  }
}

#[derive(sqlx::FromRow)]
pub struct RawInternalCategoryRecord {
  pub category_token: String,

  pub model_type: String, // TODO: ENUM

  pub maybe_super_category_token: Option<String>,

  pub can_directly_have_models: i8,
  pub can_have_subcategories: i8,
  pub can_only_mods_apply: i8,

  pub name: String,
  pub maybe_dropdown_name: Option<String>,

  pub category_creator_user_token: Option<String>,
  pub category_creator_username: Option<String>,
  pub category_creator_display_name: Option<String>,
  pub category_creator_gravatar_hash: Option<String>,

  // Moderator fields
  pub is_mod_approved: Option<i8>,
  pub maybe_mod_comments: Option<String>,

  pub category_created_at: DateTime<Utc>,
  pub category_updated_at: DateTime<Utc>,
  pub category_deleted_at: Option<DateTime<Utc>>,

  pub category_assignment_created_at: DateTime<Utc>,
  pub category_assignment_updated_at: DateTime<Utc>,
  pub category_assignment_deleted_at: Option<DateTime<Utc>>,
}

#[cfg(test)]
mod tests {
}
