// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use sqlx::MySqlPool;

use artcraft_api_defs::users::session_info::{FakeYouPlan, SessionInfoSuccessResponse, SessionOnboardingState, SessionUserInfo, StorytellerStreamPlan};
use enums::by_table::users::user_feature_flag::UserFeatureFlag;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::common_responses::user_details_lite_builder::UserDetailsLightBuilder;
use actix_artcraft::sessions::anonymous_visitor_tracking::avt_cookie_manager::AvtCookieManager;
use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use crate::http_server::session::session_checker::SessionChecker;

#[utoipa::path(
  get,
  tag = "Users",
  path = "/v1/session",
  responses(
    (status = 200, description = "Get profile", body = SessionInfoSuccessResponse),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn session_info_handler(
  http_request: HttpRequest,
  mysql_pool: web::Data<MySqlPool>,
  session_checker: web::Data<SessionChecker>,
  avt_manager: web::Data<AvtCookieManager>,
) -> Result<HttpResponse, AdvancedCommonWebError>
{
  let mut mysql_connection = mysql_pool.acquire().await?;

  let maybe_user_session = session_checker
    .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
    .await
    .map_err(|err| {
      warn!("Error checking session: {:?}", err);
      err
    })?;

  let mut logged_in = false;
  let mut user_info = None;

  if let Some(session_data) = maybe_user_session {
    let feature_flags =
        UserSessionFeatureFlags::new(session_data.maybe_feature_flags.as_deref());

    if !session_data.is_banned {
      // NB: Banned users can't be logged in
      logged_in = true;
      user_info = Some(SessionUserInfo {
        core_info: UserDetailsLightBuilder::from_db_fields(
          &session_data.user_token,
          &session_data.username,
          &session_data.display_name,
          &session_data.email_gravatar_hash,
        ),
        onboarding: SessionOnboardingState {
          email_not_set: session_data.email_is_synthetic,
          email_not_confirmed: !(session_data.email_confirmed || session_data.email_confirmed_by_google),
          password_not_set: session_data.is_without_password,
          username_not_customized: session_data.username_is_not_customized,
        },
        user_token: session_data.user_token,
        username: session_data.username.to_string(),
        display_name: session_data.display_name.to_string(),
        email_gravatar_hash: session_data.email_gravatar_hash.to_string(),

        // Rollout / feature flags:
        can_access_studio: feature_flags.has_flag(UserFeatureFlag::Studio),
        maybe_feature_flags: feature_flags.clone_flags(),

        // Premium plans:
        fakeyou_plan: FakeYouPlan::Free,
        storyteller_stream_plan: StorytellerStreamPlan::Free,

        // Usage permissions:
        can_use_tts: session_data.can_use_tts,
        can_use_w2l: session_data.can_use_w2l,
        can_delete_own_tts_results: session_data.can_delete_own_tts_results,
        can_delete_own_w2l_results: session_data.can_delete_own_w2l_results,
        can_delete_own_account: session_data.can_delete_own_account,

        // Contribution permissions:
        can_upload_tts_models: session_data.can_upload_tts_models,
        can_upload_w2l_templates: session_data.can_upload_w2l_templates,
        can_delete_own_tts_models: session_data.can_delete_own_tts_models,
        can_delete_own_w2l_templates: session_data.can_delete_own_w2l_templates,

        // Moderation permissions:
        can_approve_w2l_templates: session_data.can_approve_w2l_templates,
        can_edit_other_users_profiles: session_data.can_edit_other_users_profiles,
        can_edit_other_users_tts_models: session_data.can_edit_other_users_tts_models,
        can_edit_other_users_w2l_templates: session_data.can_edit_other_users_w2l_templates,
        can_delete_other_users_tts_models: session_data.can_delete_other_users_tts_models,
        can_delete_other_users_tts_results: session_data.can_delete_other_users_tts_results,
        can_delete_other_users_w2l_templates: session_data.can_delete_other_users_w2l_templates,
        can_delete_other_users_w2l_results: session_data.can_delete_other_users_w2l_results,
        can_ban_users: session_data.can_ban_users,
        can_delete_users: session_data.can_delete_users,
      });
    }
  }

  let maybe_avt_cookie = match avt_manager.decode_cookie_payload_from_request(&http_request) {
    Ok(Some(_avt_cookie)) => None,
    _ => Some(avt_manager.make_new_cookie()?),
  };

  let response = SessionInfoSuccessResponse {
    success: true,
    logged_in,
    user: user_info,
  };

  let body = serde_json::to_string(&response)?;

  let mut response_builder = HttpResponse::Ok();

  if let Some(cookie) = maybe_avt_cookie {
    response_builder.cookie(cookie);
  }

  Ok(response_builder
    .content_type("application/json")
    .body(body))
}
