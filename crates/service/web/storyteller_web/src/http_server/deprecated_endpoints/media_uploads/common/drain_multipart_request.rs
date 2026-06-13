use actix_multipart::Multipart;
use actix_web::web::BytesMut;
use futures::TryStreamExt;
use log::warn;

use errors::AnyhowResult;

use crate::http_server::web_utils::read_multipart_field_bytes::{checked_read_multipart_bytes, read_multipart_field_as_text};

pub struct UploadSampleRequest {
  pub uuid_idempotency_token: Option<String>,
  pub dataset_token: Option<String>,
  pub file_name: Option<String>,
  pub file_bytes: Option<BytesMut>,
  pub media_source: MediaSource,
}

/// Where the frontend tells us the file came from.
#[derive(Eq, PartialEq, Clone, Copy)]
pub enum MediaSource {
  Unknown,
  UserFile,
  /// Eg. the web audio API in Javascript.
  UserDeviceApi,
}

/// Pull common parts out of multipart media HTTP requests, typically for handling file uploads.
pub async fn drain_multipart_request(mut multipart_payload: Multipart) -> AnyhowResult<UploadSampleRequest> {
  let mut uuid_idempotency_token = None;
  let mut dataset_token = None;
  let mut file_bytes = None;
  let mut file_name = None;
  let mut media_source = None;

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
            .map_err(|e| {
              warn!("Error reading idempotency token: {:}", e);
              e
            })?;
      },
      Some("dataset_token") => {
        dataset_token = read_multipart_field_as_text(&mut field).await
            .map_err(|e| {
              warn!("Error reading dataset token: {:}", e);
              e
            })?;
      },
      Some("file") => {
        file_name = field_filename.clone();
        file_bytes = checked_read_multipart_bytes(&mut field).await
            .map_err(|e| {
              warn!("Error reading audio upload: {:}", e);
              e
            })?;
      },
      Some("source") => {
        media_source = read_multipart_field_as_text(&mut field).await
            .map_err(|e| {
              warn!("Error reading source: {:}", e);
              e
            })?;
      },
      _ => continue,
    }
  }

  let media_source = match media_source.as_deref() {
    Some("device") => MediaSource::UserDeviceApi,
    Some("file") => MediaSource::UserFile,
    _ => {
      if file_name.as_deref() == Some("blob") {
        MediaSource::UserDeviceApi
      } else {
        MediaSource::Unknown
      }
    },
  };

  Ok(UploadSampleRequest {
    uuid_idempotency_token,
    dataset_token,
    file_name,
    file_bytes,
    media_source,
  })
}
