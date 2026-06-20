use std::fmt;
use std::sync::Arc;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Data, Json};
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::legacy_bucket_client::LegacyBucketClient;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_origin_category::MediaFileOriginCategory;
use enums::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::job_status_plus::JobStatusPlus;
use errors::AnyhowResult;
use hashing::sha256::sha256_hash_bytes::sha256_hash_bytes;
use images::image_info::image_info::ImageInfo;
use log::{error, info};
use mysql_queries::queries::generic_inference::web::get_inference_job_status::get_inference_job_status;
use mysql_queries::queries::generic_inference::web::job_status::GenericInferenceJobStatus;
use mysql_queries::queries::generic_inference::web::mark_generic_inference_job_successfully_done_by_token::mark_generic_inference_job_successfully_done_by_token;
use mysql_queries::queries::media_files::create::insert_builder::media_file_insert_builder::MediaFileInsertBuilder;
use sqlx::MySqlPool;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

#[derive(Deserialize, ToSchema)]
pub struct UpdateGptImageJobStatusRequest {
  /// The token of the job we're updating.
  pub job_token: InferenceJobToken,

  /// How to mark the job.
  /// A subset of the job states that are relevant to image completion status.
  pub job_status: UpdatedJobStatus,

  /// Base64-encoded image data.
  /// Only present on success.
  /// In the success case, there may be one or more images.
  pub images: Option<Vec<String>>,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum UpdatedJobStatus {
  Started,
  CompleteSuccess,
  CompleteFailure,
  AttemptFailed,
  Dead,
}

#[derive(Serialize, ToSchema)]
pub struct UpdateGptImageJobStatusSuccessResponse {
  pub success: bool,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
/// [INTERNAL ENDPOINT] Update a GPT Image generation job status.
/// This is called by our internal infra, not users. Keep it guarded.
/// We can do secrets-based auth later.
#[utoipa::path(
  post,
  tag = "Jobs",
  path = "/v1/image_studio/update_job_status",
  responses(
    (status = 200, body = UpdateGptImageJobStatusSuccessResponse),
    (status = 500, body = CommonWebError),
  ),
  params(
    ("request" = UpdateGptImageJobStatusRequest, description = "Request"),
  )
)]
pub async fn update_gpt_image_job_status_handler(
  http_request: HttpRequest,
  request: Json<UpdateGptImageJobStatusRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<Json<UpdateGptImageJobStatusSuccessResponse>, CommonWebError>
{
  //// TODO(bt,2024-06-16): Reuse connection
  //let mut mysql_connection = server_state.mysql_pool.acquire()
  //    .await
  //    .map_err(|e| {
  //      warn!("Could not acquire DB pool: {:?}", e);
  //      CommonWebError::from_error(e)
  //    })?;

  let inference_job = get_inference_job_status(
    &request.job_token,
    &server_state.mysql_pool
  ).await;

  let inference_job = match inference_job {
    Ok(Some(record)) => record,
    Ok(None) => return Err(CommonWebError::NotFound),
    Err(err) => {
      error!("tts job query error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };


  match inference_job.status {
    JobStatusPlus::CompleteSuccess => {
      // Job has already been completed. Don't replay the request.
      return Ok(Json(UpdateGptImageJobStatusSuccessResponse { success: true }))
    },
    // TODO: Handle other states as terminal states?
    //JobStatusPlus::CompleteFailure => return Err(CommonWebError::from_error(err)),
    //JobStatusPlus::AttemptFailed => {}
    //JobStatusPlus::Dead => {}
    //JobStatusPlus::CancelledByUser => return Err(CommonWebError::from_error(err)),
    //JobStatusPlus::CancelledBySystem => {}
    _ => {} // Intentional fall through.
  }

  let target_status = match request.job_status {
    UpdatedJobStatus::Started => JobStatusPlus::Started,
    UpdatedJobStatus::CompleteSuccess => JobStatusPlus::CompleteSuccess,
    UpdatedJobStatus::CompleteFailure => JobStatusPlus::CompleteFailure,
    UpdatedJobStatus::AttemptFailed => JobStatusPlus::AttemptFailed,
    UpdatedJobStatus::Dead => JobStatusPlus::Dead,
  };

  if let Some(images) = &request.images {
    for image in images.iter() {
      let result = upload_and_save_image(
        image,
        &inference_job,
        &server_state.mysql_pool,
        &server_state.public_bucket_client,
      ).await;
      let media_token = match result {
        Ok(media_token) => media_token,
        Err(err) => {
          error!("Error uploading image: {:?}", err);
          return Err(CommonWebError::from_anyhow_error(err));
        }
      };
    }
  }

  info!("Updating job record for job: {:?}", request.job_token);

  update_job_record(&request, &server_state, inference_job, target_status)
      .await
      .map_err(|err| {
        error!("Error updating job: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  info!("Job record updated for job: {:?}", request.job_token);

  Ok(Json(UpdateGptImageJobStatusSuccessResponse {
    success: true,
  }))
}

async fn upload_and_save_image(
  base64_image: &str,
  inference_job: &GenericInferenceJobStatus,
  mysql_pool: &MySqlPool,
  public_bucket_client: &LegacyBucketClient,
) -> AnyhowResult<MediaFileToken> {

  let image_bytes = BASE64_STANDARD.decode(base64_image)?;

  // Read file metadata
  let file_size_bytes = image_bytes.len();
  let file_hash = sha256_hash_bytes(&image_bytes)?;
  let image_info = ImageInfo::decode_image_from_bytes(&image_bytes)?;
  let mimetype = image_info.mime_type();

  // Upload file
  const PREFIX : Option<&str> = Some("image_");

  let extension_with_period = image_info.file_extension()
      .map(|ext| ext.extension_with_period())
      .unwrap_or_else(|| ".png");

  let media_file_type = match mimetype {
    "image/png" => MediaFileType::Png,
    "image/jpeg" => MediaFileType::Jpg,
    _ => MediaFileType::Png,
  };

  let bucket_upload_path = MediaFileBucketPath::generate_new(
    PREFIX, Some(extension_with_period));

  info!("Uploading media to bucket path: {}", bucket_upload_path.get_full_object_path_str());

  public_bucket_client.upload_file_with_content_type(
    bucket_upload_path.get_full_object_path_str(),
    image_bytes.as_ref(),
    mimetype
  ).await?;

  let media_token = MediaFileInsertBuilder::new()
      .maybe_creator_user(inference_job.user_details.maybe_creator_user_token.as_ref())
      .maybe_creator_anonymous_visitor(inference_job.user_details.maybe_creator_anonymous_visitor_token.as_ref())
      .creator_ip_address(&inference_job.user_details.creator_ip_address)
      .public_bucket_directory_hash(&bucket_upload_path)
      .media_file_class(MediaFileClass::Image)
      .media_file_type(media_file_type)
      .media_file_origin_category(MediaFileOriginCategory::Inference)
      .media_file_origin_product_category(MediaFileOriginProductCategory::ImageStudio)
      .mime_type(mimetype)
      .file_size_bytes(file_size_bytes as u64)
      .frame_width(image_info.width())
      .frame_height(image_info.height())
      .checksum_sha2(&file_hash)
      .insert_pool(mysql_pool)
      .await?;

  Ok(media_token)
}

async fn update_job_record(
  request: &Json<UpdateGptImageJobStatusRequest>,
  server_state: &Data<Arc<ServerState>>,
  inference_job: GenericInferenceJobStatus,
  target_status: JobStatusPlus,
) -> AnyhowResult<()> {

  match target_status {
    JobStatusPlus::Pending => {}
    JobStatusPlus::Started => {}
    JobStatusPlus::CompleteSuccess => {
      info!("Matched job status complete_success");
      mark_generic_inference_job_successfully_done_by_token(
        &server_state.mysql_pool,
        &request.job_token,
        None,
        None,
        None,
        None,
      ).await?;
    }
    // TODO: Handle terminal states
    JobStatusPlus::CompleteFailure => {}
    JobStatusPlus::AttemptFailed => {}
    JobStatusPlus::Dead => {}
    JobStatusPlus::CancelledByUser => {}
    JobStatusPlus::CancelledBySystem => {}
  }
  Ok(())
}
