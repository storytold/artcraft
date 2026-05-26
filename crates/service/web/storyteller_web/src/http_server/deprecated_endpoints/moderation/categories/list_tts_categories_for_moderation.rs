use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::model_categories::list_categories_query_builder::ListCategoriesQueryBuilder;

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

// =============== Request ===============

#[derive(Deserialize, Copy, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub enum ViewState {
  /// 'exclude'; keep the objects out
  Exclude,
  /// 'include'; include the objects
  Include,
  /// 'only'; limit to just the objects
  Only,
}

// Only show approved&non-deleted , only show un-approved, only show deleted
#[derive(Deserialize)]
pub struct QueryParams {
  deleted: Option<ViewState>,
  unapproved: Option<ViewState>,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct ListTtsCategoriesForModerationResponse {
  pub success: bool,
  pub categories: Vec<CategoryForModeration>,
}

#[derive(Serialize)]
pub struct CategoryForModeration {
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

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub deleted_at: Option<DateTime<Utc>>,
}

// =============== Error Response ===============
// NB: Not using derive_more::Display since Clion doesn't understand it.
// =============== Handler ===============

pub async fn list_tts_categories_for_moderation_handler(
  http_request: HttpRequest,
  query: web::Query<QueryParams>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  // TODO: We don't have a permission for categories, so we use this as a proxy.
  if !user_session.can_ban_users {
    warn!("no permission to edit categories");
    return Err(CommonWebError::NotAuthorized);
  }

  // The objects we'll show or hide
  let delete_state = query.deleted.unwrap_or(ViewState::Exclude);
  let unapproved_state = query.unapproved.unwrap_or(ViewState::Include);

  let mut query_builder = ListCategoriesQueryBuilder::new()
      .scope_model_type(Some("tts"));

  query_builder = match delete_state {
    ViewState::Exclude => query_builder.show_deleted(false),
    ViewState::Include => query_builder.show_deleted(true),
    ViewState::Only => query_builder.show_deleted(true).hide_non_deleted(true),
  };

  query_builder = match unapproved_state {
    ViewState::Exclude => query_builder.show_unapproved(false),
    ViewState::Include => query_builder.show_unapproved(true),
    ViewState::Only => query_builder.show_unapproved(true).hide_approved(true),
  };

  let query_result =
      query_builder.perform_query(&server_state.mysql_pool).await;

  let results = match query_result {
    Ok(results) => results,
    Err(err) => {
      warn!("DB error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  warn!("Number of categories: {:?}", results.categories.len());

  let mut categories = results.categories.iter()
      .map(|c| {
        CategoryForModeration {
          category_token: c.category_token.clone(),
          model_type: c.model_type.clone(),
          maybe_super_category_token: c.maybe_super_category_token.clone(),
          can_directly_have_models: c.can_directly_have_models,
          can_have_subcategories: c.can_have_subcategories,
          can_only_mods_apply: c.can_only_mods_apply,
          name: c.name.clone(),
          maybe_dropdown_name:c.maybe_dropdown_name.clone(),
          creator_user_token: c.creator_user_token.clone(),
          creator_username: c.creator_username.clone(),
          creator_display_name: c.creator_display_name.clone(),
          creator_gravatar_hash: c.creator_gravatar_hash.clone(),
          is_mod_approved: c.is_mod_approved,
          maybe_mod_comments: c.maybe_mod_comments.clone(),
          created_at: c.created_at,
          updated_at: c.updated_at,
          deleted_at: c.deleted_at,
        }
      })
      .collect::<Vec<CategoryForModeration>>();

  // TODO: Sort by dropdown name too.
  categories.sort_by(|c1, c2| c1.name.cmp(&c2.name));

  let response = ListTtsCategoriesForModerationResponse {
    success: true,
    categories,
  };

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
