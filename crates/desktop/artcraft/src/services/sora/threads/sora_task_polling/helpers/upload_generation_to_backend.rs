use crate::services::sora::threads::sora_task_polling::helpers::generation_type::GenerationType;
use errors::AnyhowResult;
use log::info;
use std::path::Path;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file, UploadImageFromFileArgs};
use artcraft_client::endpoints::media_files::upload_video_media_file_from_file::{upload_video_media_file_from_file, UploadVideoFromFileArgs};
use artcraft_client::utils::api_host::ApiHost;
use enums::common::generation_provider::GenerationProvider;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

pub(super) struct UploadGenerationToBackendArgs<'a, P: AsRef<Path>> {
  pub storyteller_api_host: &'a ApiHost,
  pub storyteller_creds: &'a StorytellerCredentialSet,

  /// The file we're uploading.
  /// NB: Path needs to be owned for the request.
  pub upload_path: P,

  /// If provided, this is the prompt that this image is associated with.
  /// NOTE: Cannot set `is_intermediate_system_file = true` if this is set.
  pub maybe_prompt_token: Option<&'a PromptToken>,

  // /// If provided, this is the service provider that created the image.
  // /// NOTE: Cannot set `is_intermediate_system_file = true` if this is set.
  // pub maybe_generation_provider: Option<GenerationProvider>,

  /// If provided, this groups the file into a batch
  /// TODO: This shouldn't be set clientside without the backend generating the token 
  ///  and cryptographically securing it. But we need to go fast here.
  pub maybe_batch_token: Option<&'a BatchGenerationToken>,
  
  /// The type of generation (image or video).
  pub generation_type: GenerationType,
}

pub(super) async fn upload_generation_to_backend<P: AsRef<Path>>(args: UploadGenerationToBackendArgs<'_, P>) -> AnyhowResult<MediaFileToken> {
  let media_token;
  
  match args.generation_type {
    GenerationType::Image => {
      let result = upload_image_media_file_from_file(UploadImageFromFileArgs {
        api_host: &args.storyteller_api_host,
        maybe_creds: Some(&args.storyteller_creds),
        path: args.upload_path,
        is_intermediate_system_file: false,
        maybe_prompt_token: args.maybe_prompt_token,
        maybe_batch_token: None, // TODO: This should be added soon.
        maybe_generation_provider: Some(GenerationProvider::Sora),
      }).await?;

      info!("Uploaded image to API backend: {:?}", result.media_file_token);
      media_token = result.media_file_token;
    }
    GenerationType::Video => {
      let result = upload_video_media_file_from_file(UploadVideoFromFileArgs {
        api_host: &args.storyteller_api_host,
        maybe_creds: Some(&args.storyteller_creds),
        path: args.upload_path,
        maybe_prompt_token: args.maybe_prompt_token,
        maybe_generation_provider: Some(GenerationProvider::Sora),
      }).await?;

      info!("Uploaded video to API backend: {:?}", result.media_file_token);
      media_token = result.media_file_token;
    }
  }
  
  Ok(media_token)
}
