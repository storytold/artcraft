use std::time::Duration;

use tokens::tokens::media_files::MediaFileToken;
use worldlabs_api_client::api::api_types::world_labs_model::WorldLabsModel;
use worldlabs_api_client::api::requests::generate_world::http_request::{
  ContentReference, SphericallyLocatedContent, WorldPrompt,
};
use worldlabs_api_client::api::requests::prepare_upload::prepare_upload::{
  prepare_upload, MediaAssetKind, PrepareUploadArgs,
};
use worldlabs_api_client::api::requests::upload_to_signed_url::upload_to_signed_url::{
  upload_to_signed_url, UploadToSignedUrlArgs,
};
use worldlabs_api_client::pricing::check_pricing::InputType;

use crate::api::image_ref::ImageRef;
use crate::api::video_ref::VideoRef;
use crate::client::router_worldlabs_client::RouterWorldLabsClient;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::errors::provider_error::ProviderError;
use crate::generate::generate_splat::providers::worldlabs::request_common::WorldLabsSplatRequest;
use crate::generate::generate_splat::providers::worldlabs::resolve::SplatInput;
use crate::generate::generate_splat::splat_generation_draft_context::SplatGenerationDraftContext;
use crate::utils::download_file::download_file;

/// How long to wait for each prepare/upload call during the draft phase.
const UPLOAD_REQUEST_TIMEOUT: Duration = Duration::from_secs(120);

/// A World Labs splat draft, shared by all marble model draft states. Holds
/// unresolved media references that `to_request()` downloads from their
/// source URLs and re-uploads as World Labs media assets.
#[derive(Clone, Debug)]
pub struct WorldLabsSplatDraft {
  pub model: WorldLabsModel,
  pub text_prompt: Option<String>,
  pub disable_recaption: Option<bool>,

  /// Pending media input to resolve and upload. Never `SplatInput::Text` —
  /// text-only prompts skip the draft phase.
  pub(crate) input: SplatInput,
}

impl WorldLabsSplatDraft {

  pub async fn to_request(
    &self,
    draft_context: &SplatGenerationDraftContext<'_>,
  ) -> Result<WorldLabsSplatRequest, ArtcraftRouterError> {
    let client = draft_context.get_worldlabs_client_ref()?;

    let world_prompt = match &self.input {
      // Text-only prompts never enter the draft phase, but assemble the
      // prompt anyway so the state machine has no dead ends.
      SplatInput::Text => WorldPrompt::Text {
        text_prompt: self.text_prompt.clone(),
        disable_recaption: self.disable_recaption,
      },
      SplatInput::Image { image, is_panoramic } => {
        let source_url = resolve_image_source_url(image, draft_context)?;
        let content = upload_media_asset(client, &source_url, MediaAssetKind::Image).await?;
        WorldPrompt::Image {
          image_prompt: content,
          text_prompt: self.text_prompt.clone(),
          is_pano: Some(*is_panoramic),
          disable_recaption: self.disable_recaption,
        }
      }
      SplatInput::MultiImage { images } => {
        let mut multi_image_prompt = Vec::with_capacity(images.len());
        for image in images {
          let source_url = resolve_image_source_url(image, draft_context)?;
          let content = upload_media_asset(client, &source_url, MediaAssetKind::Image).await?;
          // Spherical coordinates aren't exposed through the router yet, so
          // every image is submitted without an azimuth.
          multi_image_prompt.push(SphericallyLocatedContent { content, azimuth: None });
        }
        WorldPrompt::MultiImage {
          multi_image_prompt,
          text_prompt: self.text_prompt.clone(),
          reconstruct_images: None,
          disable_recaption: self.disable_recaption,
        }
      }
      SplatInput::Video { video } => {
        let source_url = resolve_video_source_url(video, draft_context)?;
        let content = upload_media_asset(client, &source_url, MediaAssetKind::Video).await?;
        WorldPrompt::Video {
          video_prompt: content,
          text_prompt: self.text_prompt.clone(),
          disable_recaption: self.disable_recaption,
        }
      }
    };

    Ok(WorldLabsSplatRequest {
      model: self.model,
      world_prompt,
    })
  }

  /// The pricing input type of the pending input.
  pub(crate) fn input_type(&self) -> InputType {
    self.input.to_input_type()
  }
}

// ── Resolve/upload helpers ──

/// Download the media from its source URL and re-upload it as a World Labs
/// media asset, returning the content reference for the generation prompt.
async fn upload_media_asset(
  client: &RouterWorldLabsClient,
  source_url: &str,
  kind: MediaAssetKind,
) -> Result<ContentReference, ArtcraftRouterError> {
  let file_bytes = download_file(source_url).await?;

  let file_name = file_name_for_upload(source_url, kind);
  let content_type = content_type_for_file_name(&file_name, kind);

  let prepared = prepare_upload(PrepareUploadArgs {
    creds: &client.creds,
    file_name: &file_name,
    kind,
    request_timeout: Some(UPLOAD_REQUEST_TIMEOUT),
  })
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::WorldLabs(err)))?;

  upload_to_signed_url(UploadToSignedUrlArgs {
    upload_url: &prepared.upload_url,
    file_bytes,
    required_headers: &prepared.required_headers,
    content_type,
    request_timeout: Some(UPLOAD_REQUEST_TIMEOUT),
  })
    .await
    .map_err(|err| ArtcraftRouterError::Provider(ProviderError::WorldLabs(err)))?;

  Ok(ContentReference::MediaAsset {
    media_asset_id: prepared.media_asset_id.as_str().to_string(),
  })
}

fn resolve_image_source_url(
  image: &ImageRef,
  draft_context: &SplatGenerationDraftContext<'_>,
) -> Result<String, ArtcraftRouterError> {
  match image {
    ImageRef::Url(url) => Ok(url.clone()),
    ImageRef::MediaFileToken(token) => resolve_token_source_url(token, draft_context),
  }
}

fn resolve_video_source_url(
  video: &VideoRef,
  draft_context: &SplatGenerationDraftContext<'_>,
) -> Result<String, ArtcraftRouterError> {
  match video {
    VideoRef::Url(url) => Ok(url.clone()),
    VideoRef::MediaFileToken(token) => resolve_token_source_url(token, draft_context),
  }
}

fn resolve_token_source_url(
  token: &MediaFileToken,
  draft_context: &SplatGenerationDraftContext<'_>,
) -> Result<String, ArtcraftRouterError> {
  let map = draft_context.media_file_to_artcraft_url_map
    .ok_or(ArtcraftRouterError::Client(ClientError::MediaFileToUrlMapNotProvided))?;
  map.get(token).cloned().ok_or_else(|| {
    ArtcraftRouterError::Client(ClientError::MediaFileTokenNotFoundInMap {
      token: token.clone(),
    })
  })
}

// ── File name / content type helpers ──

fn file_name_for_upload(source_url: &str, kind: MediaAssetKind) -> String {
  let default_extension = match kind {
    MediaAssetKind::Image => "png",
    MediaAssetKind::Video => "mp4",
  };
  let extension = extension_from_url(source_url)
    .unwrap_or_else(|| default_extension.to_string());
  format!("upload.{extension}")
}

fn extension_from_url(url: &str) -> Option<String> {
  let path = url.split(['?', '#']).next().unwrap_or(url);
  let file_name = path.rsplit('/').next()?;
  let (_, extension) = file_name.rsplit_once('.')?;
  if extension.is_empty() || extension.len() > 5 {
    return None;
  }
  Some(extension.to_lowercase())
}

fn content_type_for_file_name(file_name: &str, kind: MediaAssetKind) -> &'static str {
  let extension = file_name.rsplit_once('.').map(|(_, ext)| ext).unwrap_or("");
  match extension {
    "jpg" | "jpeg" => "image/jpeg",
    "png" => "image/png",
    "webp" => "image/webp",
    "gif" => "image/gif",
    "mp4" => "video/mp4",
    "mov" => "video/quicktime",
    "webm" => "video/webm",
    _ => match kind {
      MediaAssetKind::Image => "image/png",
      MediaAssetKind::Video => "video/mp4",
    },
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  mod extension_tests {
    use super::*;

    #[test]
    fn extension_is_parsed_from_url_path() {
      assert_eq!(extension_from_url("https://example.com/a/b/photo.JPG").as_deref(), Some("jpg"));
      assert_eq!(extension_from_url("https://example.com/clip.mp4?query=1").as_deref(), Some("mp4"));
      assert_eq!(extension_from_url("https://example.com/pic.png#frag").as_deref(), Some("png"));
    }

    #[test]
    fn missing_extension_returns_none() {
      assert_eq!(extension_from_url("https://example.com/no-extension"), None);
      assert_eq!(extension_from_url("https://example.com/dir/"), None);
    }

    #[test]
    fn file_name_falls_back_to_kind_default() {
      assert_eq!(file_name_for_upload("https://example.com/x", MediaAssetKind::Image), "upload.png");
      assert_eq!(file_name_for_upload("https://example.com/x", MediaAssetKind::Video), "upload.mp4");
      assert_eq!(file_name_for_upload("https://example.com/a.webp", MediaAssetKind::Image), "upload.webp");
    }
  }

  mod content_type_tests {
    use super::*;

    #[test]
    fn known_extensions_map_to_content_types() {
      assert_eq!(content_type_for_file_name("upload.jpg", MediaAssetKind::Image), "image/jpeg");
      assert_eq!(content_type_for_file_name("upload.png", MediaAssetKind::Image), "image/png");
      assert_eq!(content_type_for_file_name("upload.mp4", MediaAssetKind::Video), "video/mp4");
      assert_eq!(content_type_for_file_name("upload.mov", MediaAssetKind::Video), "video/quicktime");
    }

    #[test]
    fn unknown_extensions_fall_back_to_kind_default() {
      assert_eq!(content_type_for_file_name("upload.xyz", MediaAssetKind::Image), "image/png");
      assert_eq!(content_type_for_file_name("upload.xyz", MediaAssetKind::Video), "video/mp4");
    }
  }
}
