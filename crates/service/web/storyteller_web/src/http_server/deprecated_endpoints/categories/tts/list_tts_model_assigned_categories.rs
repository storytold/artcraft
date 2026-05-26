// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;

use mysql_queries::queries::tts::tts_category_assignments::list_assigned_tts_categories_query_builder::ListAssignedTtsCategoriesQueryBuilder;

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

// =============== Request ===============

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct ListTtsModelAssignedCategoriesPathInfo {
  /// TTS model token
  token: String,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct ListTtsModelAssignedCategoriesResponse {
  pub success: bool,
  pub categories: Vec<DisplayCategory>,
}

/// Public-facing and optimized (non-irrelevant fields) category list
/// Used for the main TTS dropdown as well as the TTS edit/tagging UI
#[derive(Serialize)]
pub struct DisplayCategory {
  pub category_token: String,

  pub model_type: String, // TODO: ENUM

  pub maybe_super_category_token: Option<String>,

  pub can_directly_have_models: bool,
  pub can_have_subcategories: bool,
  pub can_only_mods_apply: bool,

  pub name: String,
  pub maybe_dropdown_name: Option<String>,

  // NB: It's okay for non-mods to see this.
  pub is_mod_approved: Option<bool>,

  pub category_created_at: DateTime<Utc>,
  pub category_updated_at: DateTime<Utc>,
  pub category_deleted_at: Option<DateTime<Utc>>,

  //pub creator_user_token: Option<String>,
  //pub creator_username: Option<String>,
  //pub creator_display_name: Option<String>,
}

// =============== Error Response ===============
// NB: Not using derive_more::Display since Clion doesn't understand it.
// =============== Handler ===============

pub async fn list_tts_model_assigned_categories_handler(
  http_request: HttpRequest,
  path: Path<ListTtsModelAssignedCategoriesPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
  let mut mysql_connection = server_state.mysql_pool.acquire()
      .await
      .map_err(|e| {
        warn!("Could not acquire DB pool: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  // TODO: We don't have any permissions for categories. This is a proxy.
  let is_mod = maybe_user_session
      .map(|session| session.can_ban_users)
      .unwrap_or(false);

  let query_builder = ListAssignedTtsCategoriesQueryBuilder::for_model_token(&path.token)
      .show_invalid_model_not_allowed_categories(is_mod)
      .show_deleted(is_mod)
      .show_unapproved(is_mod);

  let query_result =
      query_builder.perform_query_by_connection(&mut mysql_connection).await;

  let results = match query_result {
    Ok(results) => results,
    Err(err) => {
      warn!("DB error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  let mut categories = results.categories.into_iter()
      .map(|c| {
        DisplayCategory {
          category_token: c.category_token,
          model_type: c.model_type,
          maybe_super_category_token: c.maybe_super_category_token,
          can_directly_have_models: c.can_directly_have_models,
          can_have_subcategories: c.can_have_subcategories,
          can_only_mods_apply: c.can_only_mods_apply,
          name: c.name.clone(),
          maybe_dropdown_name:c.maybe_dropdown_name,
          is_mod_approved: c.is_mod_approved,
          category_created_at: c.category_created_at,
          category_updated_at: c.category_updated_at,
          category_deleted_at: c.category_deleted_at,
        }
      })
      .collect::<Vec<DisplayCategory>>();

  // TODO: Sort by dropdown name too.
  categories.sort_by(|c1, c2| c1.name.cmp(&c2.name));

  let response = ListTtsModelAssignedCategoriesResponse {
    success: true,
    categories,
  };

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
