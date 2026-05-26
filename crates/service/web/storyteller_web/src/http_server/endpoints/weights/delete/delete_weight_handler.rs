use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::model_weights::delete_weights::{
  delete_weights_as_mod,
  delete_weights_as_user,
  undelete_weights_as_user
};
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token;
use tokens::tokens::model_weights::ModelWeightToken;

use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use crate::util::delete_role_disambiguation::{delete_role_disambiguation, DeleteRole};

#[derive(Deserialize,ToSchema)]
pub struct DeleteWeightPathInfo {
  weight_token: String, 
}

#[derive(Deserialize,ToSchema)]
pub struct DeleteWeightRequest {
  set_delete: bool,
  as_mod: bool
}


// =============== Error Response ===============
// NB: Not using derive_more::Display since Clion doesn't understand it.
#[utoipa::path(
  delete,
  tag = "Model Weights",
  path = "/v1/weights/weight/{weight_token}",
  responses(
      (status = 200, description = "Success Delete", body = SimpleGenericJsonSuccess),
      (status = 400, description = "Bad input", body = CommonWebError),
      (status = 401, description = "Not authorized", body = CommonWebError),
      (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
      ("request" = DeleteWeightRequest, description = "Payload for Request"),
      ("path" = DeleteWeightPathInfo, description = "Path for Request")
  )
)]
pub async fn delete_weight_handler(
    http_request: HttpRequest,
    path: Path<DeleteWeightPathInfo>,
    request: web::Json<DeleteWeightRequest>,
    server_state: web::Data<Arc<ServerState>>
  ) -> Result<HttpResponse, CommonWebError>{
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
  
    let weight_token = path.weight_token.clone();
    let is_mod = user_session.can_ban_users;
  
    let weight_lookup_result = get_weight_by_token(
      &ModelWeightToken::new(weight_token.clone()),
      is_mod,
      &server_state.mysql_pool,
    ).await;
  
    let weight = match weight_lookup_result {
      Ok(Some(weight)) => weight,
      Ok(None) => {
        warn!("Weight not found: {:?}", weight_token);
        return Err(CommonWebError::NotFound);
      },
      Err(err) => {
        warn!("Error looking up weight: {:?}", err);
        return Err(CommonWebError::from_anyhow_error(err));
      }
    };
  
    let is_creator =
        weight.creator_user_token.to_string() ==
            user_session.user_token.as_str().to_string();
  
    if !is_creator && !is_mod {
      warn!("user is not allowed to delete this weight: {:?}", user_session.user_token);
      return Err(CommonWebError::NotAuthorized);
    }
  
    let delete_role = delete_role_disambiguation(is_mod, is_creator, Some(request.as_mod));

    let query_result = if request.set_delete {
      match delete_role {
        DeleteRole::ErrorDoNotDelete => {
          warn!("user is not allowed to delete weights: {:?}", user_session.user_token);
          return Err(CommonWebError::NotAuthorized);
        }
        DeleteRole::AsUser => {
          delete_weights_as_user(
            &ModelWeightToken::new_from_str(&path.weight_token),
            &server_state.mysql_pool
          ).await
        }
        DeleteRole::AsMod => {
          delete_weights_as_mod(
            &ModelWeightToken::new_from_str(&path.weight_token),
            &server_state.mysql_pool
          ).await
        }
      }
    } else {
      match delete_role {
        DeleteRole::ErrorDoNotDelete => {
          warn!("user is not allowed to undelete weights: {:?}", user_session.user_token);
          return Err(CommonWebError::NotAuthorized);
        }
        DeleteRole::AsUser => {
          undelete_weights_as_user(
           &ModelWeightToken::new_from_str(&path.weight_token),
            &server_state.mysql_pool
          ).await
        }
        DeleteRole::AsMod => {
          undelete_weights_as_user(
           &ModelWeightToken::new_from_str(&path.weight_token),
            &server_state.mysql_pool
          ).await
        }
      }
    };
  
    match query_result {
      Ok(_) => {},
      Err(err) => {
        warn!("Update weight mod approval status DB error: {:?}", err);
        return Err(CommonWebError::from_anyhow_error(err));
      }
    };
  
    Ok(simple_json_success())
  }