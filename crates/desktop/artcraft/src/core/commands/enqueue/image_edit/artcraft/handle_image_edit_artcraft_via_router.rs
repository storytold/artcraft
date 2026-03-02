use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio as DesktopCommonAspectRatio;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{
  EditImageResolution, EditImageSize, EnqueueEditImageCommand,
};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_router::api::common_aspect_ratio::CommonAspectRatio as RouterCommonAspectRatio;
use artcraft_router::api::common_image_model::CommonImageModel;
use artcraft_router::api::common_resolution::CommonResolution as RouterCommonResolution;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::client::router_artcraft_client::RouterArtcraftClient;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::generate::generate_image::generate_image_request::GenerateImageRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};

pub(super) const MAX_EDIT_IMAGES: usize = 10;

pub(super) async fn handle_image_edit_artcraft_via_router(
  request: &EnqueueEditImageCommand,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
  model: CommonImageModel,
  generation_model: GenerationModel,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials)),
  };

  let client = RouterClient::Artcraft(RouterArtcraftClient::new(
    app_env_configs.storyteller_host.clone(),
    creds,
  ));

  let mut media_tokens = Vec::with_capacity(MAX_EDIT_IMAGES);

  if let Some(scene_token) = request.scene_image_media_token.clone() {
    media_tokens.push(scene_token);
  }
  if let Some(tokens) = request.image_media_tokens.as_ref() {
    media_tokens.extend_from_slice(tokens);
  }

  if media_tokens.len() > MAX_EDIT_IMAGES {
    return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfInputImages {
      min: 1,
      max: MAX_EDIT_IMAGES as u32,
      provided: media_tokens.len() as u32,
    }));
  }

  let image_inputs = if media_tokens.is_empty() {
    None
  } else {
    Some(ImageListRef::MediaFileTokens(&media_tokens))
  };

  let aspect_ratio = get_aspect_ratio_edit(request);
  let resolution = get_resolution_edit(request);

  let router_request = GenerateImageRequest {
    model,
    provider: Provider::Artcraft,
    prompt: Some(request.prompt.as_str()),
    image_inputs,
    resolution,
    aspect_ratio,
    image_batch_count: request.image_count.map(|n| n as u16),
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    idempotency_token: None,
  };

  let plan = router_request.build()?;

  info!("Image Generation Plan: {:?}", plan);

  let response = match plan.generate_image(&client).await {
    Ok(resp) => {
      info!("Successfully enqueued.");
      resp
    }
    Err(err) => {
      error!("Failed to enqueue: {:?}", err);
      return Err(GenerateError::from(err));
    }
  };

  let job_id = response
    .get_artcraft_payload()
    .map(|p| p.inference_job_token.to_string())
    .ok_or(GenerateError::ResponseHadNoJobTokens)?;

  info!("Job token: {}", job_id);

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ImageGeneration,
    model: Some(generation_model),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(job_id),
  })
}

fn get_aspect_ratio_edit(request: &EnqueueEditImageCommand) -> Option<RouterCommonAspectRatio> {
  if let Some(ar) = request.common_aspect_ratio {
    return Some(convert_desktop_aspect_ratio(ar));
  }
  if let Some(ar) = request.aspect_ratio {
    return Some(match ar {
      EditImageSize::Auto => RouterCommonAspectRatio::Auto,
      EditImageSize::Square => RouterCommonAspectRatio::Square,
      EditImageSize::Wide => RouterCommonAspectRatio::Wide,
      EditImageSize::Tall => RouterCommonAspectRatio::Tall,
    });
  }
  None
}

fn get_resolution_edit(request: &EnqueueEditImageCommand) -> Option<RouterCommonResolution> {
  request.image_resolution.map(|res| match res {
    EditImageResolution::OneK => RouterCommonResolution::OneK,
    EditImageResolution::TwoK => RouterCommonResolution::TwoK,
    EditImageResolution::FourK => RouterCommonResolution::FourK,
  })
}

fn convert_desktop_aspect_ratio(ar: DesktopCommonAspectRatio) -> RouterCommonAspectRatio {
  match ar {
    DesktopCommonAspectRatio::Auto => RouterCommonAspectRatio::Auto,
    DesktopCommonAspectRatio::Square => RouterCommonAspectRatio::Square,
    DesktopCommonAspectRatio::WideThreeByTwo => RouterCommonAspectRatio::WideThreeByTwo,
    DesktopCommonAspectRatio::WideFourByThree => RouterCommonAspectRatio::WideFourByThree,
    DesktopCommonAspectRatio::WideFiveByFour => RouterCommonAspectRatio::WideFiveByFour,
    DesktopCommonAspectRatio::WideSixteenByNine => RouterCommonAspectRatio::WideSixteenByNine,
    DesktopCommonAspectRatio::WideTwentyOneByNine => RouterCommonAspectRatio::WideTwentyOneByNine,
    DesktopCommonAspectRatio::TallTwoByThree => RouterCommonAspectRatio::TallTwoByThree,
    DesktopCommonAspectRatio::TallThreeByFour => RouterCommonAspectRatio::TallThreeByFour,
    DesktopCommonAspectRatio::TallFourByFive => RouterCommonAspectRatio::TallFourByFive,
    DesktopCommonAspectRatio::TallNineBySixteen => RouterCommonAspectRatio::TallNineBySixteen,
    DesktopCommonAspectRatio::TallNineByTwentyOne => RouterCommonAspectRatio::TallNineByTwentyOne,
    DesktopCommonAspectRatio::Wide => RouterCommonAspectRatio::Wide,
    DesktopCommonAspectRatio::Tall => RouterCommonAspectRatio::Tall,
    DesktopCommonAspectRatio::Auto2k => RouterCommonAspectRatio::Auto2k,
    DesktopCommonAspectRatio::Auto4k => RouterCommonAspectRatio::Auto4k,
    DesktopCommonAspectRatio::SquareHd => RouterCommonAspectRatio::SquareHd,
  }
}
