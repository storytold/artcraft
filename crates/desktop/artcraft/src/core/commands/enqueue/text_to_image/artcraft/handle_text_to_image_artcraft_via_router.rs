use crate::core::api_adapters::aspect_ratio::common_aspect_ratio::CommonAspectRatio as CommonAspectRatio2;
use crate::core::api_adapters::resolution::common_resolution::CommonResolution as CommonResolution2;
use crate::core::commands::enqueue::generate_error::{GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{
  EnqueueTextToImageRequest, TextToImageResolution, TextToImageSize,
};
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

pub(super) async fn handle_text_to_image_artcraft_via_router(
  request: &EnqueueTextToImageRequest,
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

  let image_inputs = request.image_media_tokens.as_ref().map(ImageListRef::MediaFileTokens);

  let aspect_ratio = get_aspect_ratio_t2i(request);
  let resolution = get_resolution_t2i(request);

  let router_request = GenerateImageRequest {
    model,
    provider: Provider::Artcraft,
    prompt: request.prompt.as_deref(),
    image_inputs,
    resolution,
    aspect_ratio,
    image_batch_count: request.number_images.map(|n| n as u16),
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
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

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ImageGeneration,
    model: Some(generation_model),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(job_id),
  })
}

fn get_aspect_ratio_t2i(request: &EnqueueTextToImageRequest) -> Option<RouterCommonAspectRatio> {
  if let Some(ar) = request.common_aspect_ratio {
    return Some(convert_desktop_aspect_ratio(ar));
  }
  if let Some(ar) = request.aspect_ratio {
    return Some(match ar {
      TextToImageSize::Auto => RouterCommonAspectRatio::Auto,
      TextToImageSize::Square => RouterCommonAspectRatio::Square,
      TextToImageSize::Wide => RouterCommonAspectRatio::Wide,
      TextToImageSize::Tall => RouterCommonAspectRatio::Tall,
    });
  }
  None
}

fn get_resolution_t2i(request: &EnqueueTextToImageRequest) -> Option<RouterCommonResolution> {
  if let Some(res) = request.common_resolution {
    return Some(convert_desktop_resolution(res));
  }
  if let Some(res) = request.image_resolution {
    return Some(match res {
      TextToImageResolution::OneK => RouterCommonResolution::OneK,
      TextToImageResolution::TwoK => RouterCommonResolution::TwoK,
      TextToImageResolution::FourK => RouterCommonResolution::FourK,
    });
  }
  None
}

fn convert_desktop_aspect_ratio(ar: CommonAspectRatio2) -> RouterCommonAspectRatio {
  match ar {
    CommonAspectRatio2::Auto => RouterCommonAspectRatio::Auto,
    CommonAspectRatio2::Square => RouterCommonAspectRatio::Square,
    CommonAspectRatio2::WideThreeByTwo => RouterCommonAspectRatio::WideThreeByTwo,
    CommonAspectRatio2::WideFourByThree => RouterCommonAspectRatio::WideFourByThree,
    CommonAspectRatio2::WideFiveByFour => RouterCommonAspectRatio::WideFiveByFour,
    CommonAspectRatio2::WideSixteenByNine => RouterCommonAspectRatio::WideSixteenByNine,
    CommonAspectRatio2::WideTwentyOneByNine => RouterCommonAspectRatio::WideTwentyOneByNine,
    CommonAspectRatio2::TallTwoByThree => RouterCommonAspectRatio::TallTwoByThree,
    CommonAspectRatio2::TallThreeByFour => RouterCommonAspectRatio::TallThreeByFour,
    CommonAspectRatio2::TallFourByFive => RouterCommonAspectRatio::TallFourByFive,
    CommonAspectRatio2::TallNineBySixteen => RouterCommonAspectRatio::TallNineBySixteen,
    CommonAspectRatio2::TallNineByTwentyOne => RouterCommonAspectRatio::TallNineByTwentyOne,
    CommonAspectRatio2::Wide => RouterCommonAspectRatio::Wide,
    CommonAspectRatio2::Tall => RouterCommonAspectRatio::Tall,
    CommonAspectRatio2::Auto2k => RouterCommonAspectRatio::Auto2k,
    CommonAspectRatio2::Auto4k => RouterCommonAspectRatio::Auto4k,
    CommonAspectRatio2::SquareHd => RouterCommonAspectRatio::SquareHd,
  }
}

fn convert_desktop_resolution(res: CommonResolution2) -> RouterCommonResolution {
  match res {
    CommonResolution2::OneK => RouterCommonResolution::OneK,
    CommonResolution2::TwoK => RouterCommonResolution::TwoK,
    CommonResolution2::ThreeK => RouterCommonResolution::ThreeK,
    CommonResolution2::FourK => RouterCommonResolution::FourK,
  }
}
