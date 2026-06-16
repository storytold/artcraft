use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Query;
use actix_web::{web, HttpRequest};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::{IntoParams, ToSchema};

use enums::by_table::beta_keys::beta_key_product::BetaKeyProduct;
use markdown::markdown_with_socials_to_html::markdown_with_socials_to_html;
use mysql_queries::queries::beta_keys::list_beta_keys::{list_beta_keys, FilterToKeys, ListBetaKeysArgs};
use mysql_queries::queries::users::user_profiles::get_user_profile_by_username::get_user_profile_by_username;
use tokens::tokens::beta_keys::BetaKeyToken;

use crate::http_server::common_responses::pagination_page::PaginationPage;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::web_utils::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

#[derive(Copy, Clone, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum ListBetaKeysFilterOption {
  All,
  Redeemed,
  Unredeemed,
}

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListBetaKeysQueryParams {
  pub sort_ascending: Option<bool>,
  pub page_size: Option<usize>,
  pub page_index: Option<usize>,

  /// Scope the beta keys to a referrer user.
  pub maybe_referrer_username: Option<String>,

  /// DEPRECATED: use `list_keys` instead.
  /// Only return un-redeemed, un-expired keys.
  #[deprecated(note = "Use list_keys instead")]
  pub only_list_remaining: Option<bool>,

  /// How to filter the keys.
  /// If not specified, "all" is the default.
  pub filter: Option<ListBetaKeysFilterOption>,
}

#[derive(Serialize, ToSchema)]
pub struct ListBetaKeysSuccessResponse {
  pub success: bool,
  pub beta_keys: Vec<BetaKeyItem>,
  pub pagination: PaginationPage,
}

#[derive(Serialize, ToSchema)]
pub struct BetaKeyItem {
  /// The primary key. Internal use.
  pub token: BetaKeyToken,

  /// The product the key unlocks.
  pub product: BetaKeyProduct,

  /// The key that the user will input to unlock the product.
  pub key_value: String,

  /// The user that created the key.
  pub creator: UserDetailsLight,

  /// The user that will be in charge of distributing the key. (Gamification!)
  pub maybe_referrer: Option<UserDetailsLight>,

  /// The user that redeemed the key on their account.
  pub maybe_redeemer: Option<UserDetailsLight>,

  /// Denotes whether we handed this key out. A reminder not to re-share.
  pub is_distributed: bool,

  /// Optional note about the key. Can be used to describe why it was created or who it was given to.
  pub maybe_note: Option<String>,

  /// The note, with markdown parsed to html.
  pub maybe_note_html: Option<String>,

  /// When the key was created.
  pub created_at: DateTime<Utc>,

  /// When the key was redeemed (the key will no longer be usable once redeemed)
  pub maybe_redeemed_at: Option<DateTime<Utc>>,
}
/// List beta keys.
#[utoipa::path(
  get,
  tag = "Beta Keys",
  path = "/v1/beta_keys/list",
  params(
    ListBetaKeysQueryParams,
  ),
  responses(
    (status = 200, description = "List Featured Media Files", body = ListBetaKeysSuccessResponse),
    (status = 401, description = "Not authorized", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
)]
pub async fn list_beta_keys_handler(
  http_request: HttpRequest,
  query: Query<ListBetaKeysQueryParams>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<web::Json<ListBetaKeysSuccessResponse>, CommonWebError> {
  let user_session = require_user_session(&http_request, &server_state.session_checker, &server_state.mysql_pool)
      .await?;

  let mut is_mod = user_session.can_ban_users;

  let mut maybe_scope_user_token = None;

  if !is_mod {
    // Non-mods are always scoped to themselves.
    maybe_scope_user_token = Some(user_session.user_token.clone());
  } else if let Some(referrer_username) = query.maybe_referrer_username.as_deref() {
    // Mods can optionally scope to a different user by username.
    let referrer_username = referrer_username.to_lowercase();
    let maybe_referrer_user = get_user_profile_by_username(&referrer_username, &server_state.mysql_pool)
        .await
        .map_err(|e| {
          warn!("get user profile error: {:?}", e);
          CommonWebError::from_anyhow_error(e)
        })?;

    match maybe_referrer_user {
      None => return Err(CommonWebError::BadInputWithSimpleMessage("referrer user not found".to_string())),
      Some(user) => {
        maybe_scope_user_token = Some(user.user_token.clone());
      },
    }
  }

  let filter_keys = query.filter
      .or_else(|| match query.only_list_remaining {
        Some(true) => Some(ListBetaKeysFilterOption::Unredeemed),
        _ => Some(ListBetaKeysFilterOption::All),
      })
      .map(|filter| match filter {
        ListBetaKeysFilterOption::All => FilterToKeys::All,
        ListBetaKeysFilterOption::Redeemed => FilterToKeys::Redeemed,
        ListBetaKeysFilterOption::Unredeemed => FilterToKeys::Unredeemed,
      })
      .unwrap_or(FilterToKeys::All);

  // TODO(bt,2023-12-04): Enforce real maximums and defaults
  let sort_ascending = query.sort_ascending.unwrap_or(false);
  let page_size = query.page_size.unwrap_or_else(|| 500);
  let page_index = query.page_index.unwrap_or_else(|| 0);

  let query_results = list_beta_keys(ListBetaKeysArgs {
    filter_to_referrer_user_token: maybe_scope_user_token.as_ref(),
    filter_to_keys: filter_keys,
    page_size,
    page_index,
    sort_ascending,
    mysql_pool: &server_state.mysql_pool,
  }).await;

  let results_page = match query_results {
    Ok(results) => results,
    Err(err) => {
      warn!("Query error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  let results = results_page.records.into_iter()
      .map(|beta_key| {
        BetaKeyItem {
          token: beta_key.token.clone(),
          product: beta_key.product,
          key_value: beta_key.key_value,
          creator: UserDetailsLight::from_db_fields(
            &beta_key.creator_user_token,
            &beta_key.creator_username,
            &beta_key.creator_display_name,
            &beta_key.creator_gravatar_hash),
          maybe_referrer: UserDetailsLight::from_optional_db_fields_owned(
            beta_key.maybe_referrer_user_token,
            beta_key.maybe_referrer_username,
            beta_key.maybe_referrer_display_name,
            beta_key.maybe_referrer_gravatar_hash
          ),
          maybe_redeemer: UserDetailsLight::from_optional_db_fields_owned(
            beta_key.maybe_redeemer_user_token,
            beta_key.maybe_redeemer_username,
            beta_key.maybe_redeemer_display_name,
            beta_key.maybe_redeemer_gravatar_hash
          ),
          is_distributed: beta_key.is_distributed,
          maybe_note_html: beta_key.maybe_notes
              .as_deref()
              .map(|notes| markdown_with_socials_to_html(notes)),
          maybe_note: beta_key.maybe_notes,
          created_at: beta_key.created_at,
          maybe_redeemed_at: beta_key.maybe_redeemed_at,
        }
      }).collect::<Vec<_>>();

  let response = ListBetaKeysSuccessResponse {
    success: true,
    beta_keys: results,
    pagination: PaginationPage{
      current: results_page.current_page,
      total_page_count: results_page.total_page_count,
    }
  };

  Ok(web::Json(response))
}
