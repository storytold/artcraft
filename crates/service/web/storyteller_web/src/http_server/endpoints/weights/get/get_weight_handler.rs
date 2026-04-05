use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::ToSchema;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::common::visibility::Visibility;
use enums::by_table::model_weights::weights_types::WeightsType;
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token;
use primitives::numerics::u64_to_u32_saturating::u64_to_u32_saturating;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::http_server::common_responses::media::weights_cover_image_details::WeightsCoverImageDetails;
use crate::http_server::common_responses::simple_entity_stats::SimpleEntityStats;
use crate::http_server::common_responses::user_details_lite::UserDetailsLight;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use crate::state::server_state::ServerState;
use crate::util::title_to_url_slug::title_to_url_slug;

#[derive(Serialize, Clone, ToSchema)]
pub struct GetWeightResponse {
    success: bool,

    weight_token: ModelWeightToken,

    title: String,

    weight_type: WeightsType,
    weight_category: WeightsCategory,

    // TODO(bt,2023-12-24): Migrated the column. We should return nullables, but I don't want to break the frontend
    description_markdown: String,

    // TODO(bt,2023-12-24): Migrated the column. We should return nullables, but I don't want to break the frontend
    description_rendered_html: String,

    /// If this is a voice model (voice conversion, TTS, etc.) and a language has been set,
    /// this will report it. Example values: "en", "en-US", "es-419", "ja-JP", etc.
    maybe_ietf_language_tag: Option<String>,

    /// If this is a voice model (voice conversion, TTS, etc.) and a language has been set,
    /// this will return the primary language subtag, e.g. "en", "es", etc. This excludes the
    /// portion after the dash (eg "en-US" would be reported as "en").
    maybe_ietf_primary_language_subtag: Option<String>,

    creator: UserDetailsLight,
    creator_set_visibility: Visibility,

    file_size_bytes: i64,
    file_checksum_sha2: String,

    /// Optional SEO-friendly URL slug for the model weight.
    maybe_url_slug: Option<String>,

    /// Information about the cover image.
    cover_image: WeightsCoverImageDetails,

    /// Cover images are small descriptive images that can be set for any model.
    /// If a cover image is set, this is the path to the asset.
    #[deprecated(note="switch to CoverImageDetails")]
    maybe_cover_image_public_bucket_path: Option<String>,

    /// Whether the weight is featured by staff (the featured_items API) or not.
    is_featured: bool,

    /// Statistics about the weights
    stats: SimpleEntityStats,

    /// Number of times the model has been used.
    /// (This isn't in SimpleEntityStats since that also applies to media files, etc.)
    usage_count: u32,

    version: i32,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Deserialize, ToSchema)]
pub struct GetWeightPathInfo {
    weight_token: ModelWeightToken,
}

#[derive(Debug, ToSchema)]
pub enum GetWeightError {
    NotAuthorized,
    NotFound,
    ServerError,
}

impl fmt::Display for GetWeightError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl ResponseError for GetWeightError {
    fn status_code(&self) -> StatusCode {
        match *self {
            GetWeightError::NotAuthorized => StatusCode::UNAUTHORIZED,
            GetWeightError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
            GetWeightError::NotFound => StatusCode::NOT_FOUND,
        }
    }
}
#[utoipa::path(
    get,
    tag = "Model Weights",
    path = "/v1/weights/weight/{weight_token}",
    responses(
        (status = 200, description = "Success Update", body = GetWeightResponse),
        (status = 400, description = "Bad input", body = GetWeightError),
        (status = 401, description = "Not authorized", body = GetWeightError),
        (status = 500, description = "Server error", body = GetWeightError),
    ),
    params(
        ("path" = GetWeightPathInfo, description = "Path for Request")
    )
  )]
pub async fn get_weight_handler(
    http_request: HttpRequest,
    path: Path<GetWeightPathInfo>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, GetWeightError> {
    let maybe_user_session = server_state
        .session_checker
        .maybe_get_user_session(&http_request, &server_state.mysql_pool)
        .await
        .map_err(|e| {
            warn!("Session checker error: {:?}", e);
            GetWeightError::ServerError
        })?;

    let is_mod = maybe_user_session
        .as_ref()
        .map(|session| session.can_ban_users)
        .unwrap_or(false);

    let weight_lookup_result = get_weight_by_token(
        &path.weight_token,
        is_mod,
        &server_state.mysql_pool,
    ).await;

    let weight = match weight_lookup_result {
        Ok(Some(weight)) => weight,
        Ok(None) => {
            warn!("Weight not found: {:?}", &path.weight_token);
            return Err(GetWeightError::NotFound);
        },
        Err(err) => {
            warn!("Error looking up weight: {:?}", err);
            return Err(GetWeightError::ServerError);
        }
    };

    // if the weight is private, only the creator can view it
    let is_private = weight.creator_set_visibility == Visibility::Private;

    if is_private {
        let user_session = match maybe_user_session {
            Some(session) => session,
            None => {
                warn!("not logged in");
                return Err(GetWeightError::NotAuthorized);
            }
        };

        let session_user_token = user_session.user_token.as_str().to_string();

        if !is_mod && session_user_token.as_str() != user_session.user_token.as_str() {
            warn!("user is not allowed to view this weight: {:?}", user_session.user_token.as_str());
            return Err(GetWeightError::NotAuthorized);
        }
    }

    let media_domain = get_media_domain(&http_request);

    let cover_image_details = WeightsCoverImageDetails::from_optional_db_fields(
        media_domain,
        server_state.server_environment,
        &weight.token,
        weight.maybe_cover_image_public_bucket_hash.as_deref(),
        weight.maybe_cover_image_public_bucket_prefix.as_deref(),
        weight.maybe_cover_image_public_bucket_extension.as_deref(),
    );

    let maybe_cover_image = weight.maybe_cover_image_public_bucket_hash
        .as_deref()
        .map(|hash| {
            MediaFileBucketPath::from_object_hash(
                hash,
                weight.maybe_cover_image_public_bucket_prefix.as_deref(),
                weight.maybe_cover_image_public_bucket_extension.as_deref())
                .get_full_object_path_str()
                .to_string()
        });

    let creator = UserDetailsLight::from_db_fields(
        &weight.creator_user_token,
        &weight.creator_username,
        &weight.creator_display_name,
        &weight.creator_gravatar_hash,
    );

    let response = GetWeightResponse {
        success: true,
        weight_token: weight.token,
        maybe_url_slug: title_to_url_slug(&weight.title),
        title: weight.title,
        weight_type: weight.weights_type,
        weight_category: weight.weights_category,
        // TODO(bt,2023-12-24): Migrated the column. We should return nullable fields, but I don't want to break the frontend
        description_markdown: weight.maybe_description_markdown.unwrap_or_else(|| "".to_string()),
        description_rendered_html: weight.maybe_description_rendered_html.unwrap_or_else(|| "".to_string()),
        maybe_ietf_language_tag: weight.maybe_ietf_language_tag,
        maybe_ietf_primary_language_subtag: weight.maybe_ietf_primary_language_subtag,
        cover_image: cover_image_details,
        maybe_cover_image_public_bucket_path: maybe_cover_image,
        creator,
        creator_set_visibility: weight.creator_set_visibility,
        file_size_bytes: weight.file_size_bytes,
        file_checksum_sha2: weight.file_checksum_sha2,
        is_featured: weight.is_featured,
        stats: SimpleEntityStats {
            positive_rating_count: weight.maybe_ratings_positive_count.unwrap_or(0),
            bookmark_count: weight.maybe_bookmark_count.unwrap_or(0),
        },
        usage_count: u64_to_u32_saturating(weight.cached_usage_count),
        version: weight.version,
        created_at: weight.created_at,
        updated_at: weight.updated_at,
    };

    let body = serde_json::to_string(&response)
        .map_err(|e| GetWeightError::ServerError)?;

    Ok(HttpResponse::Ok()
        .content_type("application/json")
        .body(body))
}
