use std::sync::Arc;

use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse, ResponseError};
use log::{error, info, warn};
use sqlx::Acquire;
use utoipa::ToSchema;

use enums_db::by_table::user_ratings::entity_type::UserRatingEntityType;
use enums_api::by_table::user_ratings::entity_type::UserRatingEntityType as ApiUserRatingEntityType;
use enums_db::by_table::user_ratings::rating_value::UserRatingValue;
use enums_api::by_table::user_ratings::rating_value::UserRatingValue as ApiUserRatingValue;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::composite_keys::by_table::user_ratings::user_rating_entity::UserRatingEntity;
use mysql_queries::queries::entity_stats::stats_entity_token::StatsEntityToken;
use mysql_queries::queries::entity_stats::upsert_entity_stats_on_ratings_event::{upsert_entity_stats_on_ratings_event, RatingsAction, UpsertEntityStatsArgs};
use mysql_queries::queries::users::user_ratings::get_total_user_rating_count_for_entity::get_total_user_rating_count_for_entity;
use mysql_queries::queries::users::user_ratings::get_user_rating_transactional_locking::get_user_rating_transactional_locking;
use mysql_queries::queries::users::user_ratings::update_tts_model_ratings::update_tts_model_ratings;
use mysql_queries::queries::users::user_ratings::upsert_user_rating::{upsert_user_rating, Args};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tts_models::TtsModelToken;
use tokens::tokens::tts_results::TtsResultToken;
use tokens::tokens::w2l_results::W2lResultToken;
use tokens::tokens::w2l_templates::W2lTemplateToken;

use crate::state::server_state::ServerState;

// =============== Request ===============

#[derive(Deserialize, ToSchema)]
pub struct SetUserRatingRequest {
  /// The type of the entity being rated.
  pub entity_type: ApiUserRatingEntityType,

  /// Entity token is meant to be polymorphic. It can be a TTS model, TTS result, W2L template, ... anything.
  pub entity_token: String,

  pub rating_value: ApiUserRatingValue,
}

// =============== Success Response ===============

#[derive(Serialize, ToSchema)]
pub struct SetUserRatingResponse {
  pub success: bool,

  /// This is the new positive rating count (across all users) for the entity in question.
  /// This does not include negative ratings.
  pub new_positive_rating_count_for_entity: usize,
}

// =============== Error Response ===============

#[derive(Debug, Serialize, ToSchema)]
pub enum SetUserRatingError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for SetUserRatingError {
  fn status_code(&self) -> StatusCode {
    match *self {
      SetUserRatingError::BadInput(_) => StatusCode::BAD_REQUEST,
      SetUserRatingError::NotAuthorized => StatusCode::UNAUTHORIZED,
      SetUserRatingError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl std::fmt::Display for SetUserRatingError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

#[utoipa::path(
  post,
  tag = "User Ratings",
  path = "/v1/user_rating/rate",
  request_body = SetUserRatingRequest,
  responses(
      (status = 200, description = "Set user rating", body = SetUserRatingResponse),
      (status = 400, description = "Bad input", body = SetUserRatingError),
      (status = 401, description = "Not authorized", body = SetUserRatingError),
      (status = 500, description = "Server error", body = SetUserRatingError),
  ),
)]
pub async fn set_user_rating_handler(
  http_request: HttpRequest,
  request: web::Json<SetUserRatingRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, SetUserRatingError>
{
  // NB(bt,2023-12-14): Kasisnu found that we're getting entity type mismatches in production. Apart from
  // querying the database for entity existence, this is the next best way to prevent incorrect comment
  // attachment. This is a bit of a bad process, though, since the token types are supposed to be opaque.
  let token = request.entity_token.as_str();
  let entity_type = enums_convert::by_table::user_ratings::entity_type::user_rating_entity_type_to_db(&request.entity_type);
  let rating_value = enums_convert::by_table::user_ratings::rating_value::rating_value_to_db(&request.rating_value);
  let token_prefix_matches = match entity_type {
    // NB: Users had an older prefix (U:) that got replaced with the new prefix (user_)
    UserRatingEntityType::MediaFile => token.starts_with(MediaFileToken::token_prefix()),
    UserRatingEntityType::ModelWeight => token.starts_with(ModelWeightToken::token_prefix()),
    UserRatingEntityType::TtsModel => token.starts_with(TtsModelToken::token_prefix()),
    UserRatingEntityType::TtsResult => token.starts_with(TtsResultToken::token_prefix()),
    UserRatingEntityType::W2lTemplate => token.starts_with(W2lTemplateToken::token_prefix()),
    UserRatingEntityType::W2lResult => token.starts_with(W2lResultToken::token_prefix()),
    //UserRatingEntityType::VoiceConversionModel => token.starts_with(VoiceConversionModelToken::token_prefix()),
    //UserRatingEntityType::ZsVoice => token.starts_with(ZsVoiceToken::token_prefix()),
  };

  if !token_prefix_matches {
    warn!("invalid token prefix: {:?} for {:?}", request.entity_token, entity_type);
    return Err(SetUserRatingError::BadInput("invalid token prefix".to_string()));
  }

  let mut mysql_connection = server_state.mysql_pool.acquire()
      .await
      .map_err(|e| {
        error!("Could not acquire DB pool: {:?}", e);
        SetUserRatingError::ServerError
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        error!("Session checker error: {:?}", e);
        SetUserRatingError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      info!("not logged in");
      return Err(SetUserRatingError::NotAuthorized);
    }
  };

  let ip_address = get_request_ip(&http_request);

  let entity= match entity_type {
    UserRatingEntityType::MediaFile => UserRatingEntity::MediaFile(MediaFileToken::new_from_str(&request.entity_token)),
    UserRatingEntityType::ModelWeight => UserRatingEntity::ModelWeight(ModelWeightToken::new_from_str(&request.entity_token)),

    UserRatingEntityType::TtsModel => UserRatingEntity::TtsModel(
      TtsModelToken::new_from_str(&request.entity_token)),

    UserRatingEntityType::W2lTemplate => UserRatingEntity::W2lTemplate(
      W2lTemplateToken::new_from_str(&request.entity_token)),

    // TODO: We'll handle ratings of more types in the future.
    UserRatingEntityType::W2lResult | UserRatingEntityType::TtsResult =>
      return Err(SetUserRatingError::BadInput("type not yet supported".to_string())),
  };

  let mut transaction = mysql_connection.begin().await
      .map_err(|err| {
        error!("error creating transaction: {:?}", err);
        SetUserRatingError::ServerError
      })?;

  let maybe_existing_user_rating = get_user_rating_transactional_locking(
    &user_session.user_token,
    &entity,
    &mut *transaction,
  ).await
      .map_err(|err| {
        error!("error getting user rating: {:?}", err);
        SetUserRatingError::ServerError
      })?;

  let _r = upsert_user_rating(Args {
    user_token: &user_session.user_token,
    user_rating_entity: &entity,
    user_rating_value: rating_value,

    ip_address: &ip_address,
    mysql_executor: &mut *transaction,
    phantom: Default::default(),
  })
      .await
      .map_err(|err| {
        error!("Error upserting rating: {:?}", err);
        SetUserRatingError::ServerError
      })?;

  let existing_rating_value = maybe_existing_user_rating
      .map(|rating| rating.rating_value)
      .unwrap_or(UserRatingValue::Neutral);

  let mut maybe_rating_action =
      match (existing_rating_value, rating_value) {
        (UserRatingValue::Neutral, UserRatingValue::Neutral) => None,
        (UserRatingValue::Neutral, UserRatingValue::Positive) => Some(RatingsAction::NeutralToPositive),
        (UserRatingValue::Neutral, UserRatingValue::Negative) => Some(RatingsAction::NeutralToNegative),
        (UserRatingValue::Positive, UserRatingValue::Neutral) => Some(RatingsAction::PositiveToNeutral),
        (UserRatingValue::Positive, UserRatingValue::Positive) => None,
        (UserRatingValue::Positive, UserRatingValue::Negative) => Some(RatingsAction::PositiveToNegative),
        (UserRatingValue::Negative, UserRatingValue::Neutral) => Some(RatingsAction::NegativeToNeutral),
        (UserRatingValue::Negative, UserRatingValue::Positive) => Some(RatingsAction::NeutralToPositive),
        (UserRatingValue::Negative, UserRatingValue::Negative) => None,
      };

  if let Some(rating_action) = maybe_rating_action {

    // NB: Not all rateable things have stats (eg. deprecated record types don't have stats).
    let maybe_stats_entity_token =
        StatsEntityToken::from_rating_entity_type_and_token(entity_type, &request.entity_token);



    if let Some(stats_entity_token) = maybe_stats_entity_token {
      upsert_entity_stats_on_ratings_event(UpsertEntityStatsArgs {
        stats_entity_token: &stats_entity_token,
        action: rating_action,
        mysql_executor: &mut *transaction,
        phantom: Default::default(),
      })
          .await
          .map_err(|err| {
            error!("Error upserting entity stats: {:?}", err);
            SetUserRatingError::ServerError
          })?;
    }
  }

  transaction.commit().await
      .map_err(|err| {
        error!("error committing transaction: {:?}", err);
        SetUserRatingError::ServerError
      })?;

  // NB: Legacy
  match entity_type {
    UserRatingEntityType::TtsModel => {
      let token = TtsModelToken::new_from_str(&request.entity_token);
      update_tts_model_ratings(&token, &mut mysql_connection)
          .await
          .map_err(|err| {
            error!("Error updating TTS rating summary stats: {:?}", err);
            SetUserRatingError::ServerError
          })?;
    }
    _ => {
      // TODO
    }
  }

  // TODO(bt,2024-01-04): The methods of stats collection here differs.
  //  Update this to return directly from the stats table instead of doing a COUNT(*).

  let count = get_total_user_rating_count_for_entity(&entity, &mut mysql_connection)
      .await
      .map_err(|err| {
        error!("Error getting total user rating count for entity: {:?}", err);
        SetUserRatingError::ServerError
      })?;

  let response = SetUserRatingResponse {
    success: true,
    new_positive_rating_count_for_entity: count.positive_count,
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| SetUserRatingError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
