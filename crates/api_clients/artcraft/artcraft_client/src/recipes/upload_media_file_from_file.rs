use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file, UploadImageFromFileArgs};
use crate::endpoints::media_files::upload_new_engine_asset_from_file::upload_new_engine_asset_from_file;
use crate::endpoints::media_files::upload_video_media_file_from_file::{upload_video_media_file_from_file, UploadVideoFromFileArgs};
use crate::error::client_error::ClientError;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use mimetypes::mimetype_info::file_extension::FileExtension;
use mimetypes::mimetype_info::mimetype_info::MimetypeInfo;
use serde_derive::Deserialize;
use std::path::Path;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

#[derive(Deserialize, Debug)]
pub struct UploadMediaFileSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}

/// Upload an image media file from a file.
pub async fn upload_media_file_from_file<P: AsRef<Path>>(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  path: P,
  maybe_prompt_token: Option<&PromptToken>,
) -> Result<UploadMediaFileSuccessResponse, StorytellerError> {
  
  let maybe_type = MimetypeInfo::get_for_path(path.as_ref())
      .map_err(|err| ClientError::from(err))?
      .map(|mime| mime.file_extension())
      .flatten();
  
  match maybe_type {
    Some(FileExtension::Glb) => {
      match upload_new_engine_asset_from_file(api_host, maybe_creds, path, None).await {
        Ok(result) => Ok(UploadMediaFileSuccessResponse {
          success: result.success,
          media_file_token: result.media_file_token,
        }),
        Err(err) => Err(StorytellerError::Api(err)),
      }
    }
    Some(FileExtension::Mp4) => {
      match upload_video_media_file_from_file(UploadVideoFromFileArgs {
        api_host,
        maybe_creds, 
        path,
        maybe_prompt_token,
        maybe_generation_provider: None,
      }).await {
        Ok(result) => Ok(UploadMediaFileSuccessResponse {
          success: result.success,
          media_file_token: result.media_file_token,
        }),
        Err(err) => Err(StorytellerError::Api(err)),
      }
    }
    Some(FileExtension::Png) | Some(FileExtension::Jpg) | Some(FileExtension::Gif) | Some(FileExtension::Webp) => {
      let result = upload_image_media_file_from_file(UploadImageFromFileArgs {
        api_host,
        maybe_creds,
        path,
        is_intermediate_system_file: false,
        maybe_prompt_token,
        maybe_batch_token: None,
        maybe_generation_provider: None,
      }).await;
      match result {
        Ok(result) => Ok(UploadMediaFileSuccessResponse {
          success: result.success,
          media_file_token: result.media_file_token,
        }),
        Err(err) => Err(err),
      }
    }
    Some(_) => Err(StorytellerError::Client(ClientError::FileTypeNotHandled(path.as_ref().to_path_buf()))),
    None => Err(StorytellerError::Client(ClientError::FileTypeNotKnown(path.as_ref().to_path_buf()))),
  }
}
