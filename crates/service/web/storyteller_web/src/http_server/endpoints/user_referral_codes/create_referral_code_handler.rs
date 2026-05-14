use std::sync::Arc;

use actix_web::web::{self, Json};
use actix_web::HttpRequest;
use log::warn;
use utoipa::ToSchema;

use artcraft_api_defs::user_referral_codes::create_referral_code::{CreateReferralCodeRequest, CreateReferralCodeResponse};
use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::state::server_state::ServerState;
use mysql_queries::errors::database_insert_error::DatabaseInsertError;
use mysql_queries::queries::user_referral_codes::create_referral_code::{create_referral_code, CreateReferralCodeArgs};
use mysql_queries::queries::user_referral_codes::list_referral_codes_for_user::list_referral_codes_for_user;

const MAX_ACTIVE_CODES: usize = 5;

/// Create a new referral code for the logged-in user.
#[utoipa::path(
  post,
  tag = "User Referral Codes",
  path = "/v1/user_referral_codes/create",
  request_body = CreateReferralCodeRequest,
  responses(
    (status = 200, description = "Success", body = CreateReferralCodeResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn create_referral_code_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  request: web::Json<CreateReferralCodeRequest>,
) -> Result<Json<CreateReferralCodeResponse>, AdvancedCommonWebError> {
  let mut mysql_connection = server_state.mysql_pool.acquire().await
    .map_err(|e| AdvancedCommonWebError::from(e))?;

  let maybe_user_session = server_state
    .session_checker
    .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
    .await
    .map_err(|e| {
      warn!("Session checker error: {:?}", e);
      AdvancedCommonWebError::from(e)
    })?;

  let user_session = match maybe_user_session {
    Some(session) if !session.is_banned => session,
    _ => return Err(AdvancedCommonWebError::NotAuthorized),
  };

  let user_token = &user_session.user_token;

  // Validate code: trim, check length, check characters.
  let code = request.code.trim().to_string();

  if code.is_empty() {
    return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(
      "Referral code cannot be empty".to_string(),
    ));
  }

  if code.len() > 32 {
    return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(
      "Referral code must be 32 characters or fewer".to_string(),
    ));
  }

  if !code.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '.' || c == '-') {
    return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(
      "Referral code may only contain letters, numbers, underscores, periods, and dashes".to_string(),
    ));
  }

  let code_lowercase = code.to_lowercase();

  // Check the user doesn't already have too many active codes.
  let existing = list_referral_codes_for_user(user_token, &mut *mysql_connection).await
    .map_err(|e| AdvancedCommonWebError::from(e))?;

  if existing.len() >= MAX_ACTIVE_CODES {
    return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(
      format!("You can have at most {} active referral codes. Delete one first.", MAX_ACTIVE_CODES),
    ));
  }

  // Insert the code. If code_lowercase is already taken, we get a duplicate key error.
  let result = create_referral_code(
    CreateReferralCodeArgs {
      owner_user_token: user_token,
      code: &code,
      code_lowercase: &code_lowercase,
    },
    &mut *mysql_connection,
  ).await;

  let token = match result {
    Ok(token) => token,
    Err(err) => return match err {
      DatabaseInsertError::DuplicateKeyError => {
        return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(
          "This referral code is already in use".to_string(),
        ));
      },
      DatabaseInsertError::SqlxError(e) => Err(AdvancedCommonWebError::from(e)),
      DatabaseInsertError::AnyhowError(e) => Err(AdvancedCommonWebError::from_anyhow_error(e)),
    },
  };

  Ok(Json(CreateReferralCodeResponse {
    success: true,
    token,
    code,
    code_lowercase,
  }))
}
