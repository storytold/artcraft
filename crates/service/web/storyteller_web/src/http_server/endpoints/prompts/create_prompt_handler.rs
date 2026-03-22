// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use artcraft_api_defs::prompts::create_prompt::{CreatePromptRequest, CreatePromptResponse};
use enums_db::by_table::prompts::prompt_type::PromptType;
use enums_convert::common::generation::generation_provider::generation_provider_to_db;
use enums_convert::common::model_type::model_type_to_db;
use http_server_common::request::get_request_ip::get_request_ip;
use log::{error, warn};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};


/// Create a new prompt record
#[utoipa::path(
  post,
  tag = "Prompts",
  path = "/v1/prompts/create",
  responses(
    (status = 200, description = "Success", body = CreatePromptResponse),
  ),
  params(
    ("request" = CreatePromptRequest, description = "Payload for Request"),
  )
)]
pub async fn create_prompt_handler(
  http_request: HttpRequest,
  request: Json<CreatePromptRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<CreatePromptResponse>, CommonWebError>
{
  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::ServerError
      })?;

  //let maybe_avt_token = server_state
  //    .avt_cookie_manager
  //    .get_avt_token_from_request(&http_request);

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        CommonWebError::BadInputWithSimpleMessage("invalid idempotency token".to_string())
      })?;

  let ip_address = get_request_ip(&http_request);
  
  let maybe_positive_prompt = request.positive_prompt
      .as_deref()
      .map(|prompt| prompt.trim());

  let maybe_negative_prompt = request.positive_prompt
      .as_deref()
      .map(|prompt| prompt.trim());

  let result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: maybe_user_session
        .as_ref()
        .map(|s| &s.user_token),
    maybe_model_type: request.model_type.as_ref().map(|v| model_type_to_db(v)),
    maybe_generation_provider: request.generation_provider.map(|v| generation_provider_to_db(&v)),
    maybe_positive_prompt,
    maybe_negative_prompt,
    maybe_other_args: None,
    creator_ip_address: &ip_address,
    mysql_executor: &mut *mysql_connection,
    phantom: Default::default(),
  }).await;
  
  let token = match result {
    Ok(token) => token,
    Err(err) => {
      error!("error inserting prompt: {:?}", err);
      return Err(CommonWebError::ServerError);
    }
  };

  Ok(Json(CreatePromptResponse {
    success: true,
    prompt_token: token,
  }))
}
