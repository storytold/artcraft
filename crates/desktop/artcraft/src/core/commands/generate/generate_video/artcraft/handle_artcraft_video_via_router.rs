use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::generate::generate_video::request::TauriGenerateVideoRequest;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_router::api::audio_list_ref::AudioListRef;
use artcraft_router::api::character_list_ref::CharacterListRef;
use artcraft_router::api::router_video_model::RouterVideoModel;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::api::video_list_ref::VideoListRef;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::client::router_artcraft_client::RouterArtcraftClient;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use artcraft_router::generate::generate_video::generate_video_response::{ArtcraftVideoResponsePayload, GenerateVideoResponse};
use artcraft_router::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};

pub(super) async fn handle_artcraft_video_via_router(
  request: &TauriGenerateVideoRequest,
  app_env_configs: &AppEnvConfigs,
  creds: &StorytellerCredentialSet,
  model: RouterVideoModel,
  generation_model: GenerationModel,
) -> Result<Vec<TaskEnqueueSuccess>, GenerateError> {
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
    provider: RouterProvider::Artcraft,
    prompt: request.prompt.clone(),
    start_frame,
    end_frame,
    reference_images,
    reference_videos,
    reference_audio,
    reference_character_tokens,
    resolution: request.resolution,
    aspect_ratio: request.aspect_ratio,
    bitrate: None,
    duration_seconds: request.duration_seconds,
    video_batch_count: request.video_batch_count,
    generate_audio: request.generate_audio,
    total_reference_video_input_seconds: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    idempotency_token: None,
    negative_prompt: None,
  };

  info!("Building request for artcraft_router (v2 pipeline)...");
  let response = generate_via_v2(router_request, &client).await?;

  let payload = response.get_artcraft_payload()
    .ok_or(GenerateError::ResponseHadNoJobTokens)?;

  Ok(artcraft_video_tasks(payload, generation_model))
}

fn artcraft_video_tasks(payload: ArtcraftVideoResponsePayload, generation_model: GenerationModel) -> Vec<TaskEnqueueSuccess> {
  let mut job_tokens = vec![payload.inference_job_token];
  for job_token in payload.all_inference_job_tokens {
    if !job_tokens.contains(&job_token) {
      job_tokens.push(job_token);
    }
  }

  job_tokens.into_iter().map(|job_token| TaskEnqueueSuccess { task_type: TaskType::VideoGeneration, model: Some(generation_model.clone()), provider: GenerationProvider::Artcraft, provider_job_id: Some(job_token.to_string()), maybe_queue_status_url: None, maybe_prompt_token: None, maybe_queue_response_url: None }).collect()
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

#[cfg(test)]
mod tests {
  use super::*;
  use tokens::tokens::generic_inference_jobs::InferenceJobToken;

  const JOBS: [&str; 3] = ["job_primary", "job_second", "job_third"];

  #[test]
  fn video_tasks_keep_primary_first_and_track_each_job_once() {
    for all_jobs in [&JOBS[..], &JOBS[..1], &[JOBS[1], JOBS[0], JOBS[2], JOBS[1]], &[]] {
      let payload = ArtcraftVideoResponsePayload { inference_job_token: InferenceJobToken::new_from_str(JOBS[0]), all_inference_job_tokens: all_jobs.iter().map(|job| InferenceJobToken::new_from_str(job)).collect() };
      let tasks = artcraft_video_tasks(payload, GenerationModel::Seedance1p5Pro);
      let expected = if all_jobs.len() > 1 { &JOBS[..] } else { &JOBS[..1] };
      assert_eq!(tasks.iter().map(|task| task.provider_job_id.as_deref().unwrap()).collect::<Vec<_>>(), expected);
      for task in tasks {
        assert_eq!(task.provider, GenerationProvider::Artcraft);
        assert_eq!(task.task_type, TaskType::VideoGeneration);
        assert!(matches!(task.model, Some(GenerationModel::Seedance1p5Pro)));
      }
    }
  }
}
