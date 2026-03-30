use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use sqlx::MySqlPool;
use utoipa::ToSchema;

use crate::configs::supported_languages_for_models::{get_canonicalized_language_tag_for_model, get_primary_language_subtag};
use crate::http_server::web_utils::user_session::require_user_session::RequireUserSessionError;
use crate::http_server::web_utils::user_session::require_user_session_extended_using_connection::require_user_session_extended_using_connection;
use crate::state::server_state::ServerState;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use http_server_common::response::response_success_helpers::{simple_json_success, SimpleGenericJsonSuccess};
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use markdown::simple_markdown_to_html::simple_markdown_to_html;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use mysql_queries::queries::model_weights::edit::update_weight::{update_weights, CoverImageOption, UpdateWeightArgs};
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token_with_transactor;
use mysql_queries::utils::transactor::Transactor;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use user_input_common::check_for_slurs::contains_slurs;

// TODO will eventually be polymorphic
/// **IMPORTANT**: This endpoint handles sparse (by-field) updates rather than wholesale updates.
/// That is, if a field is absent, we do not update it (as opposed to clearing it).
#[derive(Deserialize, ToSchema)]
pub struct UpdateWeightRequest {
    pub title: Option<String>,
    pub description_markdown: Option<String>,

    /// The media file token of the *image* media file.
    /// Set to *empty string* to clear the cover image.
    pub cover_image_media_file_token: Option<MediaFileToken>,

    /// An IETF BCP47 language tag, e.g.: "en", "en-US",
    /// "es-419", "ja-JP", etc.
    /// This is only applicable to TTS and Voice Conversion models.
    /// If set for other model types, the endpoint will 400.
    pub language_tag: Option<String>,

    pub visibility: Option<Visibility>,
}

#[derive(Serialize, ToSchema)]
pub struct UpdateWeightResponse {
    pub success: bool,
}

/// For the URL PathInfo
#[derive(Deserialize,ToSchema)]
pub struct UpdateWeightPathInfo {
    weight_token: String,
}

// =============== Error Response ===============

#[derive(Debug, Serialize, ToSchema)]
pub enum UpdateWeightError {
    BadInput(String),
    NotFound,
    NotAuthorized,
    ServerError,
}

impl ResponseError for UpdateWeightError {
    fn status_code(&self) -> StatusCode {
        match *self {
            UpdateWeightError::BadInput(_) => StatusCode::BAD_REQUEST,
            UpdateWeightError::NotFound => StatusCode::NOT_FOUND,
            UpdateWeightError::NotAuthorized => StatusCode::UNAUTHORIZED,
            UpdateWeightError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for UpdateWeightError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

// =============== Handler ===============

/// Handle updates to model weight metadata (using sparse field updates!)
#[utoipa::path(
    post,
    tag = "Model Weights",
    path = "/v1/weights/weight/{weight_token}",
    responses(
        (status = 200, description = "Success Update", body = SimpleGenericJsonSuccess),
        (status = 400, description = "Bad input", body = UpdateWeightError),
        (status = 401, description = "Not authorized", body = UpdateWeightError),
        (status = 500, description = "Server error", body = UpdateWeightError),
    ),
    params(
        ("request" = UpdateWeightRequest, description = "Payload for Request"),
        ("path" = UpdateWeightPathInfo, description = "Path for Request")
    )
  )]
pub async fn update_weight_handler(
    http_request: HttpRequest,
    path: Path<UpdateWeightPathInfo>,
    request: web::Json<UpdateWeightRequest>,
    mysql_pool: web::Data<MySqlPool>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, UpdateWeightError> {
    let mut mysql_connection = mysql_pool
        .acquire()
        .await
        .map_err(|err| {
            warn!("could not acquire mysql connection: {:?}", err);
            UpdateWeightError::ServerError
        })?;

    let user_session = require_user_session_extended_using_connection(
        &http_request,
        &server_state.session_checker,
        &mut mysql_connection)
        .await
        .map_err(|err| match err {
            RequireUserSessionError::NotAuthorized => UpdateWeightError::NotAuthorized,
            _ => {
                warn!("get user session error: {:?}", err);
                UpdateWeightError::ServerError
            },
        })?;

    let weight_token = path.weight_token.clone();

    // TODO wouldn't we want to instead use a function that will query the DB for the user and determine if they are a mod?
    let is_mod = user_session.role.can_ban_users;

    let weight_lookup_result = get_weight_by_token_with_transactor(
        &ModelWeightToken::new(weight_token.clone()),
        is_mod,
        Transactor::for_connection(&mut mysql_connection)
    ).await;

    let weight = match weight_lookup_result {
        Ok(Some(weight)) => weight,
        Ok(None) => {
            warn!("Weight not found: {:?}", weight_token);
            return Err(UpdateWeightError::NotFound);
        }
        Err(err) => {
            warn!("Error looking up weight: {:?}", err);
            return Err(UpdateWeightError::ServerError);
        }
    };

    let is_creator =
        weight.creator_user_token.to_string() ==
            user_session.user_token.as_str().to_string();

    if !is_creator && !is_mod {
        warn!("user is not allowed to edit this weight: {:?}", user_session.user_token);
        return Err(UpdateWeightError::NotAuthorized);
    }

    let mut weight_title = None;
    let mut cover_image = None;
    let mut description_markdown = None;
    let mut description_rendered_html = None;
    let mut ietf_language_tag = None;
    let mut ietf_primary_language_subtag = None;

    if let Some(title) = &request.title {
        if contains_slurs(title) {
            return Err(UpdateWeightError::BadInput("Title contains slurs".to_string()));
        }
        weight_title = Some(title.trim().to_string());
    }

    if let Some(media_file_token) = &request.cover_image_media_file_token {
        if media_file_token.as_str().trim().is_empty() {
            cover_image = Some(CoverImageOption::ClearCoverImage);
        } else {
            let maybe_media_file = get_media_file(
                media_file_token,
                false, // NB: Even mods shouldn't set deleted media files.
                &server_state.mysql_pool
            ).await.map_err(|err| {
                warn!("Error looking up media file: {:?}", err);
                UpdateWeightError::ServerError
            })?;

            let maybe_media_file_type = maybe_media_file.map(|media_file| media_file.media_type);

            match maybe_media_file_type {
                Some(MediaFileType::Image) => cover_image = Some(CoverImageOption::SetCoverImage(media_file_token)),
                None => return Err(UpdateWeightError::BadInput("Media file does not exist".to_string())),
                _ => return Err(UpdateWeightError::BadInput("Media file is the wrong type".to_string())),
            }
        }
    }

    if let Some(markdown) = &request.description_markdown {
        if contains_slurs(markdown) {
            return Err(UpdateWeightError::BadInput("Description contains slurs".to_string()));
        }
        let markdown = markdown.trim().to_string();
        let html = simple_markdown_to_html(&markdown);
        description_markdown = Some(markdown);
        description_rendered_html = Some(html);
    }

    if request.language_tag.is_some() {
        // Only voice models have a language.
        match weight.weights_type {
            WeightsType::Tacotron2 => {}
            WeightsType::GptSoVits => {}
            WeightsType::SoVitsSvc => {}
            WeightsType::RvcV2 => {}
            WeightsType::HifiganTacotron2 => {}
            WeightsType::VallE => {}
            _ => {
                return Err(UpdateWeightError::BadInput("Language tag is not applicable to this model type".to_string()));
            }
        }
    }

    if let Some(language_tag) = request.language_tag.as_deref().map(|t| t.trim()) {
        if let Some(canonical_tag) = get_canonicalized_language_tag_for_model(language_tag) {
            if let Some(primary_language_subtag) = get_primary_language_subtag(canonical_tag) {
                ietf_language_tag = Some(canonical_tag.to_string());
                ietf_primary_language_subtag = Some(primary_language_subtag);
            }
        }
    }

    let query_result = update_weights(UpdateWeightArgs {
        weight_token: &ModelWeightToken::new(path.weight_token.clone()),
        title: weight_title.as_deref(),
        cover_image,
        maybe_description_markdown: description_markdown.as_deref(),
        maybe_description_rendered_html: description_rendered_html.as_deref(),
        creator_set_visibility: request.visibility.as_ref(),
        ietf_language_tag: ietf_language_tag.as_deref(),
        ietf_primary_language_subtag: ietf_primary_language_subtag.as_deref(),
        transactor: Transactor::for_connection(&mut mysql_connection),
    }).await;

    match query_result {
        Ok(()) => {}
        Err(err) => {
            warn!("Update Weight DB error: {:?}", err);
            return Err(UpdateWeightError::ServerError);
        }
    }

    Ok(simple_json_success())
}
