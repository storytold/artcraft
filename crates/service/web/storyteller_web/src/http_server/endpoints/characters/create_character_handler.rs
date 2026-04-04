use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, info, warn};
use sqlx::Acquire;

use artcraft_api_defs::characters::create_character::{CreateCharacterRequest, CreateCharacterResponse};
use enums::by_table::characters::character_type::CharacterType;
use enums::common::visibility::Visibility;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::characters::create_pending_character::{create_pending_character, CreatePendingCharacterArgs};
use mysql_queries::queries::generic_inference::seedance2pro::insert_generic_inference_job_for_seedance2pro_character_with_apriori_job_token::{
  insert_generic_inference_job_for_seedance2pro_character_with_apriori_job_token,
  InsertGenericInferenceForSeedance2ProCharacterWithAprioriJobTokenArgs,
};
use mysql_queries::queries::idepotency_tokens::insert_idempotency_token::insert_idempotency_token;
use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro_client::requests::generate_character::generate_character::{generate_character, GenerateCharacterArgs};
use seedance2pro_client::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
use seedance2pro_client::requests::upload_file::upload_file::{upload_file, UploadFileArgs};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use url_utils::extension::extract_extension_from_url::{extract_extension_from_url, ExtractExtensions};

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::validations::validate_idempotency_token_format::validate_idempotency_token_format;
use crate::state::server_state::ServerState;
use crate::util::http_download_url_to_bytes::http_download_url_to_bytes;
use crate::util::lookup::lookup_media_file_urls_as_map::lookup_media_file_urls_as_map;

use super::common::CHARACTER_MAX_DESCRIPTION_LENGTH;

const MAX_NAME_LENGTH: usize = 255;

/// Create a new character.
#[utoipa::path(
  post,
  tag = "Characters",
  path = "/v1/character/create",
  request_body = CreateCharacterRequest,
  responses(
    (status = 200, description = "Success", body = CreateCharacterResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn create_character_handler(
  http_request: HttpRequest,
  request: Json<CreateCharacterRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<CreateCharacterResponse>, AdvancedCommonWebError> {

  // --- Auth ---

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        AdvancedCommonWebError::from_anyhow_error(e)
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => return Err(AdvancedCommonWebError::NotAuthorized),
  };

  let user_token = &user_session.user_token;
  let ip_address = get_request_ip(&http_request);

  // --- Validate input ---

  if let Err(reason) = validate_idempotency_token_format(&request.uuid_idempotency_token) {
    return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(reason));
  }

  // For now we use the model name as the character name and description.
  let character_name = request.character_name.clone();
  let character_name = truncate_string(&character_name, MAX_NAME_LENGTH);
  let character_description = request.character_description.as_deref()
      .map(|desc| desc.trim());

  if let Some(desc) = character_description {
    if desc.len() > CHARACTER_MAX_DESCRIPTION_LENGTH {
      return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(
        format!("Description exceeds maximum length of {} characters.", CHARACTER_MAX_DESCRIPTION_LENGTH),
      ));
    }
  }

  // --- Look up the image media file ---

  let file_urls_by_token = lookup_media_file_urls_as_map(
    &http_request,
    &mut mysql_connection,
    server_state.server_environment,
    &[request.image_media_token.clone()],
  ).await?;

  let image_cdn_url = file_urls_by_token
      .get(&request.image_media_token)
      .ok_or_else(|| {
        warn!("Image media token not found: {:?}", request.image_media_token);
        AdvancedCommonWebError::BadInputWithSimpleMessage("Image media file not found.".to_string())
      })?;

  // --- Insert idempotency token ---

  insert_idempotency_token(&request.uuid_idempotency_token, &mut *mysql_connection)
      .await
      .map_err(|err| {
        error!("Error inserting idempotency token: {:?}", err);
        AdvancedCommonWebError::BadInputWithSimpleMessage("repeated idempotency token".to_string())
      })?;

  // --- Upload image to Kinovi CDN ---

  let seedance_image_url = upload_to_kinovi(
    &server_state.seedance2pro.cookies,
    image_cdn_url,
  ).await?;

  info!("Uploaded image to Kinovi: {}", seedance_image_url);

  // --- Call Kinovi generate_character ---

  let session = Seedance2ProSession::from_cookies_string(
    server_state.seedance2pro.cookies.clone()
  );

  let gen_result = generate_character(GenerateCharacterArgs {
    session: &session,
    name: character_name.clone(),
    description: character_description
        .map(|d| d.to_string())
        .unwrap_or_else(|| "".to_string()),
    reference_image_url: seedance_image_url,
    is_public: false,
    host_override: None,
  })
      .await
      .map_err(|err| {
        error!("Error calling Kinovi generate_character: {:?}", err);
        AdvancedCommonWebError::from_error(err)
      })?;

  info!(
    "Kinovi character created: id={}, character_id={}, name={}",
    gen_result.id, gen_result.character_id, gen_result.name,
  );

  // --- Generate apriori job token ---

  let apriori_job_token = InferenceJobToken::generate();

  // --- Insert records in a transaction ---

  let mut transaction = mysql_connection
      .begin()
      .await
      .map_err(|err| {
        error!("Error starting MySQL transaction: {:?}", err);
        AdvancedCommonWebError::from_error(err)
      })?;

  let character_token = create_pending_character(CreatePendingCharacterArgs {
    character_type: CharacterType::KinoviSeedance,
    character_name: &character_name,
    maybe_description: character_description,
    maybe_original_upload_media_token: Some(&request.image_media_token),
    maybe_creator_user_token: Some(user_token),
    creator_ip_address: &ip_address,
    kinovi_character_id: &gen_result.character_id,
    kinovi_character_name: &gen_result.name,
    maybe_generic_inference_job_token: Some(&apriori_job_token),
    mysql_executor: &mut *transaction,
    phantom: PhantomData,
  })
      .await?;

  info!("Created pending character: {}", character_token);

  insert_generic_inference_job_for_seedance2pro_character_with_apriori_job_token(
    InsertGenericInferenceForSeedance2ProCharacterWithAprioriJobTokenArgs {
      uuid_idempotency_token: &request.uuid_idempotency_token,
      apriori_job_token: &apriori_job_token,
      kinovi_character_id: &gen_result.character_id,
      maybe_creator_user_token: Some(user_token),
      maybe_avt_token: None,
      creator_ip_address: &ip_address,
      creator_set_visibility: Visibility::Hidden,
      mysql_executor: &mut *transaction,
      phantom: PhantomData,
    }
  )
      .await
      .map_err(|err| {
        error!("Error inserting inference job: {:?}", err);
        AdvancedCommonWebError::from_error(err)
      })?;

  info!("Created inference job: {}", apriori_job_token);

  transaction
      .commit()
      .await
      .map_err(|err| {
        error!("Error committing transaction: {:?}", err);
        AdvancedCommonWebError::from_error(err)
      })?;

  Ok(Json(CreateCharacterResponse {
    success: true,
    inference_job_token: apriori_job_token,
  }))
}

// =============== Private helpers ===============

/// Upload an image from our CDN to Kinovi's CDN via prepare + upload.
async fn upload_to_kinovi(
  cookies: &str,
  our_cdn_url: &url::Url,
) -> Result<String, AdvancedCommonWebError> {
  let extension = extract_extension_from_url(our_cdn_url, &ExtractExtensions::All)
      .map(|ext| ext.without_period().to_string())
      .unwrap_or_else(|| "png".to_string());

  let session = Seedance2ProSession::from_cookies_string(cookies.to_string());

  let file_bytes = http_download_url_to_bytes(our_cdn_url.as_str())
      .await
      .map_err(|err| {
        warn!("Error downloading media file from CDN: {:?}", err);
        AdvancedCommonWebError::from_anyhow_error(err)
      })?
      .to_vec();

  let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
    session: &session,
    extension,
    host_override: None,
  })
      .await
      .map_err(|err| {
        warn!("Error preparing Kinovi file upload: {:?}", err);
        AdvancedCommonWebError::from_error(err)
      })?;

  let upload_result = upload_file(UploadFileArgs {
    upload_url: prepare_result.upload_url,
    file_bytes,
    host_override: None,
  })
      .await
      .map_err(|err| {
        warn!("Error uploading file to Kinovi: {:?}", err);
        AdvancedCommonWebError::from_error(err)
      })?;

  Ok(upload_result.public_url)
}

fn truncate_string(s: &str, max_len: usize) -> String {
  if s.len() <= max_len {
    s.to_string()
  } else {
    s[..max_len].to_string()
  }
}
