use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::generate::generate_video::request::TauriGenerateVideoRequest;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_router::api::audio_list_ref::AudioListRef;
use artcraft_router::api::character_list_ref::CharacterListRef;
use artcraft_router::api::common_video_model::CommonVideoModel;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::api::video_list_ref::VideoListRef;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::client::router_artcraft_client::RouterArtcraftClient;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use artcraft_router::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};

pub(super) async fn handle_artcraft_video_via_router(
  request: &TauriGenerateVideoRequest,
  app_env_configs: &AppEnvConfigs,
  creds: &StorytellerCredentialSet,
  model: CommonVideoModel,
  generation_model: GenerationModel,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let client = RouterClient::Artcraft(RouterArtcraftClient::new(
    app_env_configs.storyteller_host.clone(),
    creds.clone(),
  ));

  let start_frame = request.image_media_token.clone().map(ImageRef::MediaFileToken);
  let end_frame = request.end_frame_image_media_token.clone().map(ImageRef::MediaFileToken);

  let reference_images = request.reference_image_media_tokens.clone().map(ImageListRef::MediaFileTokens);
  let reference_videos = request.reference_video_media_tokens.clone().map(VideoListRef::MediaFileTokens);
  let reference_audio = request.reference_audio_media_tokens.clone().map(AudioListRef::MediaFileTokens);

  let reference_character_tokens = request.reference_character_tokens.clone().map(CharacterListRef::CharacterTokens);

  let router_request = GenerateVideoRequestBuilder {
    model,
    provider: Provider::Artcraft,
    prompt: request.prompt.clone(),
    start_frame,
    end_frame,
    reference_images,
    reference_videos,
    reference_audio,
    reference_character_tokens,
    resolution: request.resolution,
    aspect_ratio: request.aspect_ratio,
    duration_seconds: request.duration_seconds,
    video_batch_count: request.video_batch_count,
    generate_audio: request.generate_audio,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    idempotency_token: None,
    negative_prompt: None,
  };

  let response = if router_request.use_new_builder() {
    info!("Building request for artcraft_router (v2 pipeline)...");
    generate_via_v2(router_request, &client).await?
  } else {
    info!("Building request for artcraft_router (v1 pipeline)...");
    generate_via_v1(router_request, &client).await?
  };

  let job_id = response.get_artcraft_payload()
    .map(|p| p.inference_job_token.to_string())
    .ok_or(GenerateError::ResponseHadNoJobTokens)?;

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::VideoGeneration,
    model: Some(generation_model),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(job_id),
  })
}

/// V1 pipeline: build → plan → generate_video.
async fn generate_via_v1(
  router_request: GenerateVideoRequestBuilder,
  client: &RouterClient,
) -> Result<GenerateVideoResponse, GenerateError> {
  let plan = router_request.build()?;

  let response = plan.generate_video(client).await.map_err(|err| {
    error!("V1 failed to enqueue: {:?}", err);
    GenerateError::from(err)
  })?;

  info!("V1 successfully enqueued.");
  Ok(response)
}

/// V2 pipeline: build2 → send_request (Artcraft skips draft phase).
async fn generate_via_v2(
  router_request: GenerateVideoRequestBuilder,
  client: &RouterClient,
) -> Result<GenerateVideoResponse, GenerateError> {
  let draft_or_request = router_request.build2()?;

  let request = match draft_or_request {
    VideoGenerationDraftOrRequest::Request(r) => r,
    VideoGenerationDraftOrRequest::Draft(_) => {
      error!("Unexpected Draft variant for Artcraft provider");
      return Err(GenerateError::NotYetImplemented("Artcraft provider should not produce a draft request".to_string()));
    }
  };

  let response = request.send_request(client).await.map_err(|err| {
    error!("V2 failed to enqueue: {:?}", err);
    GenerateError::from(err)
  })?;

  info!("V2 successfully enqueued.");
  Ok(response)
}
