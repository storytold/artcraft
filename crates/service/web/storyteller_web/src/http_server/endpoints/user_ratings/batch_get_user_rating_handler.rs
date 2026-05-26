use std::collections::{HashMap, HashSet};
use std::sync::Arc;

use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse, ResponseError};
use actix_web_lab::extract::Query;
use log::error;
use utoipa::{IntoParams, ToSchema};

use enums::by_table::user_ratings::entity_type::UserRatingEntityType;
use enums::by_table::user_ratings::rating_value::UserRatingValue;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::users::user_ratings::batch_get_user_rating::{batch_get_user_ratings, BatchUserRating};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::tts_models::TtsModelToken;

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

const MAX_BATCH_SIZE : usize = 200;

// =============== Request ===============

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct BatchGetUserRatingQueryParams {
  /// A grab bag of tokens of various types.
  /// Technically we should pair with token types, as that's the unique index.
  /// But since each token family generally has its own prefix, this should be fine.
  ///
  /// NB: We're using actix_web_lab's Query<T>, because the default actix_web Query<T> doesn't support URL
  /// decoding sequences yet.
  /// See https://github.com/actix/actix-web/issues/1301
  ///
  pub tokens: HashSet<String>,
}

// =============== Success Response ===============

#[derive(Serialize, ToSchema)]
pub struct BatchGetUserRatingResponse {
  pub success: bool,

  /// Ratings on each item passed to us.
  pub ratings: Vec<RatingRow>,
}

#[derive(Serialize, ToSchema)]
pub struct RatingRow {
  /// The passed token
  pub entity_token: String,
  /// The type of entity
  pub entity_type: UserRatingEntityType,
  /// The rating value. Unrated items will be "neutral".
  pub rating_value: UserRatingValue,
}

// =============== Error Response ===============
// NB: Not using DeriveMore since Clion doesn't understand it.
// =============== Handler ===============


#[utoipa::path(
  get,
  tag = "User Ratings",
  path = "/v1/user_rating/batch",
  params(
    BatchGetUserRatingQueryParams,
  ),
  responses(
    (status = 200, description = "List User Bookmarks", body = BatchGetUserRatingResponse),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 401, description = "Not authorized", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
)]
pub async fn batch_get_user_rating_handler(
  http_request: HttpRequest,
  query: Query<BatchGetUserRatingQueryParams>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
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

  // NB: Force move of tokens from the Query<T>.
  // The auto-magical Query<T> will ordinarily try to force a Copy, which isn't on HashSet.
  let mut tokens = query.0.tokens;

  // Don't allow bad actors to flood our DB.
  tokens.shrink_to(MAX_BATCH_SIZE);

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      let ratings = fill_in_missed_ratings(&tokens, Vec::new());

      // NB: Just return "neutral" for everything.
      return Ok(HttpResponse::Ok()
          .content_type("application/json")
          .json(BatchGetUserRatingResponse {
            success: true,
            ratings,
          }));
    }
  };

  batch_get_user_ratings(
    &user_session.user_token,
    &tokens,
    &mut mysql_connection
  ).await
      .map_err(|e| {
        error!("Batch get user ratings DB error: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })
      .map(|ratings| {
        HttpResponse::Ok()
            .content_type("application/json")
            .json(BatchGetUserRatingResponse {
              success: true,
              ratings: fill_in_missed_ratings(&tokens, ratings),
            })
      })
}

fn fill_in_missed_ratings(request_tokens: &HashSet<String>, db_response: Vec<BatchUserRating>) -> Vec<RatingRow> {
  let mut outputs = HashMap::with_capacity(request_tokens.len());

  for record in db_response.into_iter() {
    outputs.insert(record.entity_token.clone(),RatingRow {
      entity_token: record.entity_token,
      entity_type: record.entity_type,
      rating_value: record.rating_value,
    });
  }

  for request_token in request_tokens.iter() {
    if !outputs.contains_key(request_token) {
      outputs.insert(request_token.clone(), RatingRow {
        entity_token: request_token.clone(),
        entity_type: {
          if request_token.starts_with(MediaFileToken::token_prefix()) {
            UserRatingEntityType::MediaFile
          } else if request_token.starts_with(ModelWeightToken::token_prefix()) {
            UserRatingEntityType::ModelWeight
          } else if request_token.starts_with(TtsModelToken::token_prefix()) {
            UserRatingEntityType::TtsModel
          } else {
            // NB: Fail open; W2lTemplates are dead, so this is a good sentinel value
            UserRatingEntityType::W2lTemplate
          }
        },
        rating_value: UserRatingValue::Neutral,
      });
    }
  }

  outputs.into_iter()
      .map(|(_key, value)| value)
      .collect::<Vec<_>>()
}