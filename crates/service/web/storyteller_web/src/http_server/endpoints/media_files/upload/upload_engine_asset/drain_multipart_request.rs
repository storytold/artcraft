use actix_multipart::Multipart;
use actix_web::web::BytesMut;
use anyhow::anyhow;
use futures::TryStreamExt;
use log::warn;

use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use enums::common::generation_provider::GenerationProvider;
use errors::AnyhowResult;
use crate::http_server::endpoints::media_files::upload::common_utils::try_parse_generation_provider::try_parse_generation_provider;
use crate::http_server::web_utils::read_multipart_field_bytes::{checked_read_multipart_bytes, read_multipart_field_as_text};

pub struct MediaFileUploadData {
  pub uuid_idempotency_token: Option<String>,
  pub file_name: Option<String>,
  pub file_bytes: Option<BytesMut>,

  // Optional: title of the scene (media_files' maybe_title)
  pub maybe_title: Option<String>,

  // Optional: visibility
  pub maybe_visibility: Option<String>,

  // Optional: visibility
  pub maybe_engine_category: Option<MediaFileEngineCategory>,

  // Optional: visibility
  pub maybe_animation_type: Option<MediaFileAnimationType>,

  // Optional: The third-party generation provider (e.g. "fal", "replicate").
  pub maybe_generation_provider: Option<GenerationProvider>,
}

/// Pull common parts out of multipart media HTTP requests, typically for handling file uploads.
pub async fn drain_multipart_request(mut multipart_payload: Multipart) -> AnyhowResult<MediaFileUploadData> {
  let mut uuid_idempotency_token = None;
  let mut file_bytes = None;
  let mut file_name = None;
  let mut title = None;
  let mut visibility = None;
  let mut maybe_engine_category = None;
  let mut maybe_animation_type = None;
  let mut generation_provider = None;

  while let Ok(Some(mut field)) = multipart_payload.try_next().await {
    let mut field_name = None;
    let mut field_filename = None;

    if let content_disposition = field.content_disposition() {
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
              err
            })?;
      },
      Some("file") => {
        file_name = field_filename.clone();
        file_bytes = checked_read_multipart_bytes(&mut field).await
            .map_err(|err| {
              warn!("Error reading multipart upload: {:?}", &err);
              err
            })?;
      },
      Some("engine_category") => {
        maybe_engine_category = read_multipart_field_as_text(&mut field).await
            .map_err(|err| {
              warn!("Error reading source: {:?}", &err);
              err
            })?
            .map(|field| MediaFileEngineCategory::from_str(&field))
            .transpose()
            .map_err(|err| {
              warn!("Wrong MediaFileEngineCategory: {:?}", &err);
              anyhow!("Wrong MediaFileEngineCategory: {:?}", &err)
            })?;
      },
      Some("animation_type") => {
        maybe_animation_type = read_multipart_field_as_text(&mut field).await
            .map_err(|err| {
              warn!("Error reading source: {:?}", &err);
              err
            })?
            .map(|field| MediaFileAnimationType::from_str(&field))
            .transpose()
            .map_err(|err| {
              warn!("Wrong MediaFileAnimationType: {:?}", &err);
              anyhow!("Wrong MediaFileAnimationType: {:?}", &err)
            })?;
      },
      Some("title") => {
        title = read_multipart_field_as_text(&mut field).await
            .map_err(|e| {
              warn!("Error reading title: {:}", &e);
              e
            })?;
      },
      Some("visibility") => {
        visibility = read_multipart_field_as_text(&mut field).await
            .map_err(|e| {
              warn!("Error reading title: {:}", &e);
              e
            })?;
      },
      Some("maybe_generation_provider") => {
        generation_provider = read_multipart_field_as_text(&mut field).await
            .map_err(|e| {
              warn!("Error reading maybe_generation_provider: {:}", &e);
              e
            })?;
      },
      _ => continue,
    }
  }

  let maybe_generation_provider = generation_provider.as_deref()
      .map(|s| try_parse_generation_provider(s))
      .flatten();

  Ok(MediaFileUploadData {
    uuid_idempotency_token,
    file_name,
    file_bytes,
    maybe_title: title,
    maybe_visibility: visibility,
    maybe_engine_category,
    maybe_animation_type,
    maybe_generation_provider,
  })
}
