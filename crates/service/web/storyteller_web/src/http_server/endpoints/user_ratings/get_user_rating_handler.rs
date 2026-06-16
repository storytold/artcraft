use std::sync::Arc;

use actix_web::{web, HttpRequest};
use log::{error, info};
use utoipa::ToSchema;

use enums::by_table::user_ratings::entity_type::UserRatingEntityType;
use enums::by_table::user_ratings::rating_value::UserRatingValue;
use mysql_queries::composite_keys::by_table::user_ratings::user_rating_entity::UserRatingEntity;
use mysql_queries::queries::users::user_ratings::get_user_rating::{get_user_rating, Args};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::w2l_templates::W2lTemplateToken;

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

// =============== Request ===============

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct GetUserRatingPath {
  /// The type of the entity being rated.
  pub entity_type: UserRatingEntityType,

  /// Entity token is meant to be polymorphic. It can be a TTS model, TTS result, W2L template, ... anything.
  pub entity_token: String,
}

// =============== Success Response ===============

#[derive(Serialize, ToSchema)]
pub struct GetUserRatingResponse {
  pub success: bool,

  /// None if not yet rated.
  /// If the user later removes their rating, it will be Some(UserRatingValue::Neutral).
  pub maybe_rating_value: Option<UserRatingValue>,
}

// =============== Error Response ===============
// NB: Not using DeriveMore since Clion doesn't understand it.
// =============== Handler ===============


#[utoipa::path(
  get,
  tag = "User Ratings",
  path = "/v1/user_rating/view/{entity_type}/{entity_token}",
  params(
    ("entity_type", description = "The type of the entity being rated."),
    ("entity_token", description = "Entity token"),
  ),
  responses(
    (status = 200, description = "List User Bookmarks", body = GetUserRatingResponse),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 401, description = "Not authorized", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
)]
pub async fn get_user_rating_handler(
  http_request: HttpRequest,
  path: web::Path<GetUserRatingPath>,
  server_state: web::Data<Arc<ServerState>>) -> Result<web::Json<GetUserRatingResponse>, CommonWebError>
{
  let mut mysql_connection = server_state.mysql_pool.acquire()
      .await
      .map_err(|e| {
        error!("Could not acquire DB pool: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        error!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      info!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  let entity= match path.entity_type {
    UserRatingEntityType::TtsModel => UserRatingEntity::TtsModel(
      TtsModelToken::new_from_str(&path.entity_token)),

    UserRatingEntityType::W2lTemplate => UserRatingEntity::W2lTemplate(
      W2lTemplateToken::new_from_str(&path.entity_token)),

    UserRatingEntityType::MediaFile => UserRatingEntity::MediaFile(MediaFileToken::new_from_str(&path.entity_token)),
    UserRatingEntityType::ModelWeight => UserRatingEntity::ModelWeight(ModelWeightToken::new_from_str(&path.entity_token)),

    // TODO: We'll handle ratings of more types in the future.
    UserRatingEntityType::W2lResult | UserRatingEntityType::TtsResult =>
      return Err(CommonWebError::BadInputWithSimpleMessage("type not yet supported".to_string())),
  };

  let maybe_rating = get_user_rating(Args {
    user_token: &user_session.user_token,
    user_rating_entity: &entity,
    mysql_connection: &mut mysql_connection
  })
      .await
      .map_err(|err| {
        error!("Error fetching rating: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  let response = GetUserRatingResponse {
    success: true,
    maybe_rating_value: maybe_rating.map(|rating| rating.rating_value),
  };

  Ok(web::Json(response))
}
