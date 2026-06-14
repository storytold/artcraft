use chrono::{DateTime, Utc};
use sqlx::{MySql, MySqlPool};
use sqlx::pool::PoolConnection;

use errors::AnyhowResult;

use crate::helpers::boolean_converters::{i8_to_bool, nullable_i8_to_optional_bool};

/// List of categories
/// This is *NOT* paginated, as that defeats the purpose of having a category system.
#[derive(Serialize, Clone)]
pub struct CategoryList {
  pub categories: Vec<Category>,
}

#[derive(Serialize, Clone)]
pub struct Category {
  pub category_token: String,

  pub model_type: String, // TODO: ENUM

  pub maybe_super_category_token: Option<String>,

  pub can_directly_have_models: bool,
  pub can_have_subcategories: bool,
  pub can_only_mods_apply: bool,

  pub name: String,
  pub maybe_dropdown_name: Option<String>,

  pub creator_user_token: Option<String>,
  pub creator_username: Option<String>,
  pub creator_display_name: Option<String>,
  pub creator_gravatar_hash: Option<String>,

  // Moderator fields
  pub is_mod_approved: Option<bool>,
  pub maybe_mod_comments: Option<String>,
  //pub maybe_mod_user_token: Option<String>,
  //pub maybe_mod_username: Option<String>,
  //pub maybe_mod_display_name: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub deleted_at: Option<DateTime<Utc>>,
}

/// Query Builder for listing categories
/// These are very difficult queries, so the builder helps for
/// testability, construction, and correctness.
pub struct ListCategoriesQueryBuilder {
  // The public lists won't include unapproved, but mod views
  // will want to see them.
  show_unapproved: bool,

  // The public lists won't include deleted models, but mod views
  // will want to see them.
  show_deleted: bool,

  // Filter out approved records.
  // Useful as a moderation filter.
  // Doesn't make sense to use with `show_unapproved`, but don't want to refactor atm.
  hide_approved: bool,

  // Filter out records with a non-deleted timestamp.
  // Useful as a moderation filter.
  // Doesn't make sense to use with `show_deleted`, but don't want to refactor atm.
  hide_non_deleted: bool,

  // Useful for showing categories a user themselves has suggested
  // We don't want users spamming creation.
  scope_creator_user_token: Option<String>,

  // Typically we won't show both types together.
  // Except in a mod view or user view, perhaps.
  scope_model_type: Option<String>, // todo: enum
}

impl ListCategoriesQueryBuilder {
  pub fn new() -> Self {
    Self {
      show_unapproved: false,
      show_deleted: false,
      hide_approved: false,
      hide_non_deleted: false,
      scope_creator_user_token: None,
      scope_model_type: None,
    }
  }

  pub fn show_unapproved(mut self, show_unapproved: bool) -> Self {
    self.show_unapproved = show_unapproved;
    self
  }

  pub fn show_deleted(mut self, show_deleted: bool) -> Self {
    self.show_deleted = show_deleted;
    self
  }

  pub fn hide_approved(mut self, hide_approved: bool) -> Self {
    self.hide_approved = hide_approved;
    self
  }

  pub fn hide_non_deleted(mut self, hide_non_deleted: bool) -> Self {
    self.hide_non_deleted = hide_non_deleted;
    self
  }

  pub fn scope_creator_user_token(mut self, scope_creator_user_token: Option<&str>) -> Self {
    self.scope_creator_user_token = scope_creator_user_token.map(|u| u.to_string());
    self
  }

  pub fn scope_model_type(mut self, scope_model_type: Option<&str>) -> Self {
    self.scope_model_type = scope_model_type.map(|u| u.to_string());
    self
  }

  /// Perform the query based on the set predicates.
  #[deprecated = "Use the PoolConnection<MySql> method instead of the MySqlPool one."]
  pub async fn perform_query(
    &self,
    mysql_pool: &MySqlPool,
  ) -> AnyhowResult<CategoryList> {
    let mut mysql_connection = mysql_pool.acquire().await?;
    self.perform_query_using_connection(&mut mysql_connection).await
  }

  /// Perform the query based on the set predicates.
  pub async fn perform_query_using_connection(
    &self,
    mysql_connection: &mut PoolConnection<MySql>,
  ) -> AnyhowResult<CategoryList> {
    let internal_results = self.perform_internal_query(mysql_connection).await?;

    let categories = internal_results
        .into_iter()
        .map(|c| {
          Category {
            category_token: c.category_token,
            model_type: c.model_type,
            maybe_super_category_token: c.maybe_super_category_token,
            can_directly_have_models: i8_to_bool(c.can_directly_have_models),
            can_have_subcategories: i8_to_bool(c.can_have_subcategories),
            can_only_mods_apply: i8_to_bool(c.can_only_mods_apply),
            name: c.name,
            maybe_dropdown_name: c.maybe_dropdown_name,
            creator_user_token: c.creator_user_token,
            creator_username: c.creator_username,
            creator_display_name: c.creator_display_name,
            creator_gravatar_hash: c.creator_gravatar_hash,
            is_mod_approved: nullable_i8_to_optional_bool(c.is_mod_approved),
            maybe_mod_comments: c.maybe_mod_comments,
            created_at: c.created_at,
            updated_at: c.updated_at,
            deleted_at: c.deleted_at,
          }
        })
        .collect::<Vec<Category>>();

    Ok(CategoryList {
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

    if let Some(user_token) = self.scope_creator_user_token.as_deref() {
      query = query.bind(user_token);
    }

    if let Some(model_type) = self.scope_model_type.as_deref() {
      query = query.bind(model_type);
    }

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

    users.token as creator_user_token,
    users.username as creator_username,
    users.display_name as creator_display_name,
    users.email_gravatar_hash AS creator_gravatar_hash,

    model_categories.is_mod_approved,
    model_categories.maybe_mod_comments,

    model_categories.created_at,
    model_categories.updated_at,
    model_categories.deleted_at

FROM model_categories
LEFT OUTER JOIN users
    ON model_categories.creator_user_token = users.token
    "#.to_string();

    query.push_str(&self.build_predicates());
    query
  }

  pub fn build_predicates(&self) -> String {
    let mut first_predicate_added = false;

    let mut query = "".to_string();

    if let Some(_username) = self.scope_creator_user_token.as_deref() {
      if !first_predicate_added {
        query.push_str(" WHERE model_categories.creator_user_token = ?");
        first_predicate_added = true;
      } else {
        query.push_str(" AND model_categories.creator_user_token = ?");
      }
    }

    if let Some(_model_type) = self.scope_model_type.as_deref() {
      if !first_predicate_added {
        query.push_str(" WHERE model_categories.model_type = ?");
        first_predicate_added = true;
      } else {
        query.push_str(" AND model_categories.model_type = ?");
      }
    }

    if !self.show_unapproved {
      if !first_predicate_added {
        query.push_str(" WHERE model_categories.is_mod_approved IS TRUE");
        first_predicate_added = true;
      } else {
        query.push_str(" AND model_categories.is_mod_approved IS TRUE");
      }
    }

    if !self.show_deleted {
      if !first_predicate_added {
        query.push_str(" WHERE model_categories.deleted_at IS NULL");
        first_predicate_added = true;
      } else {
        query.push_str(" AND model_categories.deleted_at IS NULL");
      }
    }

    if self.hide_approved {
      if !first_predicate_added {
        query.push_str(" WHERE (model_categories.is_mod_approved IS NULL OR model_categories.is_mod_approved IS FALSE) ");
        first_predicate_added = true;
      } else {
        query.push_str(" AND (model_categories.is_mod_approved IS NULL OR model_categories.is_mod_approved IS FALSE) ");
      }
    }

    if self.hide_non_deleted {
      if !first_predicate_added {
        query.push_str(" WHERE model_categories.deleted_at IS NOT NULL");
        first_predicate_added = true;
      } else {
        query.push_str(" AND model_categories.deleted_at IS NOT NULL");
      }
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

  pub creator_user_token: Option<String>,
  pub creator_username: Option<String>,
  pub creator_display_name: Option<String>,
  pub creator_gravatar_hash: Option<String>,

  // Moderator fields
  pub is_mod_approved: Option<i8>,
  pub maybe_mod_comments: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub deleted_at: Option<DateTime<Utc>>,
}

#[cfg(test)]
mod tests {
  use crate::queries::model_categories::list_categories_query_builder::ListCategoriesQueryBuilder;

  #[test]
  fn predicates_default_scoping() {
    let query_builder = ListCategoriesQueryBuilder::new();

    assert_eq!(&query_builder.build_predicates(),
               " WHERE model_categories.is_mod_approved IS TRUE \
                AND model_categories.deleted_at IS NULL");
  }

  #[test]
  fn predicates_scoped_to_user() {
    let query_builder = ListCategoriesQueryBuilder::new()
        .scope_creator_user_token(Some("U:ASDF"));

    assert_eq!(&query_builder.build_predicates(),
               " WHERE model_categories.creator_user_token = ? \
                AND model_categories.is_mod_approved IS TRUE \
                AND model_categories.deleted_at IS NULL");
  }

  #[test]
  fn predicates_scoped_to_model_type() {
    let query_builder = ListCategoriesQueryBuilder::new()
        .scope_model_type(Some("foo"));

    assert_eq!(&query_builder.build_predicates(),
               " WHERE model_categories.model_type = ? \
                AND model_categories.is_mod_approved IS TRUE \
                AND model_categories.deleted_at IS NULL");
  }

  #[test]
  fn predicates_scoped_to_unapproved() {
    let query_builder = ListCategoriesQueryBuilder::new()
        .show_unapproved(false);

    assert_eq!(&query_builder.build_predicates(),
               " WHERE model_categories.is_mod_approved IS TRUE \
                AND model_categories.deleted_at IS NULL");

    let query_builder = ListCategoriesQueryBuilder::new()
        .show_unapproved(true);

    assert_eq!(&query_builder.build_predicates(),
               " WHERE model_categories.deleted_at IS NULL");
  }

  #[test]
  fn predicates_scoped_to_deleted() {
    let query_builder = ListCategoriesQueryBuilder::new()
        .show_deleted(false);

    assert_eq!(&query_builder.build_predicates(),
               " WHERE model_categories.is_mod_approved IS TRUE \
                AND model_categories.deleted_at IS NULL");

    let query_builder = ListCategoriesQueryBuilder::new()
        .show_deleted(true);

    assert_eq!(&query_builder.build_predicates(),
               " WHERE model_categories.is_mod_approved IS TRUE");
  }
}
