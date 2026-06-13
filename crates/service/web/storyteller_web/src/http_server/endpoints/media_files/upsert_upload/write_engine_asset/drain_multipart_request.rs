use actix_multipart::Multipart;
use actix_web::web::BytesMut;
use futures::TryStreamExt;
use log::warn;

use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::endpoints::media_files::upsert_upload::write_error::MediaFileWriteError;
use crate::http_server::web_utils::read_multipart_field_bytes::{checked_read_multipart_bytes, read_multipart_field_as_text};

pub struct MediaFileUploadData {
  pub uuid_idempotency_token: Option<String>,
  pub file_name: Option<String>,
  pub file_bytes: Option<BytesMut>,

  pub media_file_token: Option<MediaFileToken>,

  // Optional: title of the scene (media_files' maybe_title)
  pub maybe_title: Option<String>,

  // Optional: visibility
  pub maybe_visibility: Option<String>,

  // Optional: visibility
  pub maybe_engine_category: Option<MediaFileEngineCategory>,

  // Optional: visibility
  pub maybe_animation_type: Option<MediaFileAnimationType>,
}

/// Pull common parts out of multipart media HTTP requests, typically for handling file uploads.
pub async fn drain_multipart_request(mut multipart_payload: Multipart) -> Result<MediaFileUploadData, MediaFileWriteError> {
  let mut uuid_idempotency_token = None;
  let mut file_bytes = None;
  let mut file_name = None;
  let mut media_file_token = None;
  let mut title = None;
  let mut visibility = None;
  let mut maybe_engine_category = None;
  let mut maybe_animation_type = None;

  while let Ok(Some(mut field)) = multipart_payload.try_next().await {
    let mut field_name = None;
    let mut field_filename = None;

    if let Some(content_disposition) = field.content_disposition() {
      field_name = content_disposition.get_name()
          .map(|s| s.to_string());
      field_filename = content_disposition.get_filename() // NB: Only used for the file bytes.
          .map(|s| s.to_string());
    }

    match field_name.as_deref() {
      Some("uuid_idempotency_token") => {
        uuid_idempotency_token = read_multipart_field_as_text(&mut field).await
            .map_err(|err| {
              warn!("Error reading idempotency token: {:?}", &err);
              MediaFileWriteError::BadInput("Error reading idempotency token".to_string())
            })?;
      },
      Some("file") => {
        file_name = field_filename.clone();
        file_bytes = checked_read_multipart_bytes(&mut field).await
            .map_err(|err| {
              warn!("Error reading audio upload: {:?}", &err);
              MediaFileWriteError::BadInput("Error reading file bytes".to_string())
            })?;
      },
      Some("media_file_token") => {
        media_file_token = read_multipart_field_as_text(&mut field).await
            .map_err(|err| {
              warn!("Error reading source: {:?}", &err);
              MediaFileWriteError::BadInput("Error reading media_file_token".to_string())
            })?
            .map(|field| MediaFileToken::new_from_str(&field));
      },
      Some("engine_category") => {
        maybe_engine_category = read_multipart_field_as_text(&mut field).await
            .map_err(|err| {
              warn!("Error reading engine_category: {:?}", &err);
              MediaFileWriteError::BadInput(format!("Error reading engine_category: {:?}", &err))
            })?
            .map(|field| MediaFileEngineCategory::from_str(&field))
            .transpose()
            .map_err(|err| {
              warn!("Wrong MediaFileEngineCategory: {:?}", &err);
              MediaFileWriteError::BadInput(format!("Wrong MediaFileEngineCategory: {:?}", &err))
            })?;
      },
      Some("animation_type") => {
        maybe_animation_type = read_multipart_field_as_text(&mut field).await
            .map_err(|err| {
              warn!("Error reading animation_type: {:?}", &err);
              MediaFileWriteError::BadInput(format!("Error reading animation_type: {:?}", &err))
            })?
            .map(|field| MediaFileAnimationType::from_str(&field))
            .transpose()
            .map_err(|err| {
              warn!("Wrong MediaFileAnimationType: {:?}", &err);
              MediaFileWriteError::BadInput(format!("Wrong MediaFileAnimationType: {:?}", &err))
            })?;
      },
      Some("title") => {
        title = read_multipart_field_as_text(&mut field).await
            .map_err(|err| {
              warn!("Error reading title: {:}", &err);
              MediaFileWriteError::BadInput(format!("Error reading title: {:?}", &err))
            })?;
      },
      Some("visibility") => {
        visibility = read_multipart_field_as_text(&mut field).await
            .map_err(|err| {
              warn!("Error reading visibility: {:}", &err);
              MediaFileWriteError::BadInput(format!("Error reading visibility: {:?}", &err))
            })?;
      },
      _ => continue,
    }
  }

  Ok(MediaFileUploadData {
    uuid_idempotency_token,
    file_name,
    file_bytes,
    media_file_token,
    maybe_title: title,
    maybe_visibility: visibility,
    maybe_engine_category,
    maybe_animation_type,
  })
}
