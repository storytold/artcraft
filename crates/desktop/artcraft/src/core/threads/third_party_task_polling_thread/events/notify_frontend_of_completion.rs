use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::events::functional_events::canvas_background_removal_complete_event::CanvasBackgroundRemovalCompleteEvent;
use crate::core::events::functional_events::gaussian_generation_complete_event::{GaussianGenerationCompleteEvent, GeneratedGaussian};
use crate::core::events::functional_events::image_edit_complete_event::{EditedImage, ImageEditCompleteEvent};
use crate::core::events::functional_events::object_generation_complete_event::{GeneratedObject, ObjectGenerationCompleteEvent};
use crate::core::events::functional_events::text_to_image_generation_complete_event::{GeneratedImage, TextToImageGenerationCompleteEvent};
use crate::core::events::functional_events::video_generation_complete_event::{GeneratedVideo, VideoGenerationCompleteEvent};
use artcraft_api_defs::utils::media_links_to_thumbnail_template::media_links_to_thumbnail_template;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::endpoints::media_files::list_batch_generated_redux_media_files::list_batch_generated_redux_media_files;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::utils::api_host::ApiHost;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use enums::tauri::tasks::task_model_type::TaskModelType;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info, warn};
use sqlite_tasks::queries::task::Task;
use tauri::AppHandle;
use reqwest::Url;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;

/// Data about a successfully completed third-party generation.
pub struct CompletionData {
  /// The primary media file token (first uploaded file).
  pub primary_media_file_token: MediaFileToken,

  /// The CDN URL for the primary media file, if looked up.
  pub maybe_cdn_url: Option<Url>,

  /// A thumbnail URL template for the primary media file, if available.
  pub maybe_thumbnail_url_template: Option<String>,

  /// The batch token, if multiple files were generated.
  pub maybe_batch_token: Option<BatchGenerationToken>,

  /// The media class of the generated output.
  pub media_class: TaskMediaFileClass,
}

/// Notify the frontend that a third-party job has completed, sending the
/// appropriate typed event based on the task type.
///
/// This is the cross-cutting equivalent of the Storyteller-specific
/// `maybe_handle_frontend_caller_notification` — it works for any provider.
pub async fn notify_frontend_of_completion(
  app: &AppHandle,
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  task: &Task,
  completion: &CompletionData,
) {
  // Fire the generic generation-complete event (for the task queue UI).
  let generation_action = task_type_to_generation_action(task.task_type);
  let generation_model = task.model_type.and_then(task_model_type_to_generation_model);
  let generation_service = provider_to_generation_service(task.provider);

  let complete_event = GenerationCompleteEvent {
    action: Some(generation_action),
    service: generation_service,
    model: generation_model,
  };
  complete_event.send_infallible(app);

  // Fire the typed frontend notification (for the specific page/component that initiated the job).
  let result = match task.task_type {
    TaskType::ImageGeneration => {
      notify_image_generation(app, api_host, maybe_creds, task, completion).await
    }
    TaskType::ImageInpaintEdit => {
      notify_image_edit(app, api_host, maybe_creds, task, completion).await
    }
    TaskType::VideoGeneration => {
      notify_video_generation(app, task, completion)
    }
    TaskType::ObjectGeneration => {
      notify_object_generation(app, task, completion)
    }
    TaskType::GaussianGeneration => {
      notify_gaussian_generation(app, task, completion)
    }
    TaskType::BackgroundRemoval => {
      notify_background_removal(app, task, completion)
    }
  };

  if let Err(err) = result {
    error!("[ThirdPartyEvents] Failed to send frontend notification for task {}: {:?}", task.id.as_str(), err);
  }
}

// ── Per-type handlers ──

async fn notify_image_generation(
  app: &AppHandle,
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  task: &Task,
  completion: &CompletionData,
) -> Result<(), Box<dyn std::error::Error>> {
  let generated_images = collect_generated_images(
    api_host,
    maybe_creds,
    completion,
  ).await;

  let event = TextToImageGenerationCompleteEvent {
    generated_images,
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  event.send_infallible(app);
  Ok(())
}

async fn notify_image_edit(
  app: &AppHandle,
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  task: &Task,
  completion: &CompletionData,
) -> Result<(), Box<dyn std::error::Error>> {
  let images = collect_generated_images(api_host, maybe_creds, completion).await;

  let edited_images: Vec<EditedImage> = images.into_iter()
    .map(|img| EditedImage {
      media_token: img.media_token,
      cdn_url: img.cdn_url,
      maybe_thumbnail_template: img.maybe_thumbnail_template,
    })
    .collect();

  let event = ImageEditCompleteEvent {
    edited_images,
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  event.send_infallible(app);
  Ok(())
}

fn notify_video_generation(
  app: &AppHandle,
  task: &Task,
  completion: &CompletionData,
) -> Result<(), Box<dyn std::error::Error>> {
  let event = VideoGenerationCompleteEvent {
    generated_video: Some(GeneratedVideo {
      media_token: completion.primary_media_file_token.clone(),
      cdn_url: completion.maybe_cdn_url.clone().unwrap_or_else(|| Url::parse("https://cdn.artcraft.ai/placeholder").unwrap()),
      maybe_thumbnail_template: completion.maybe_thumbnail_url_template.clone(),
    }),
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  event.send_infallible(app);
  Ok(())
}

fn notify_object_generation(
  app: &AppHandle,
  task: &Task,
  completion: &CompletionData,
) -> Result<(), Box<dyn std::error::Error>> {
  let event = ObjectGenerationCompleteEvent {
    generated_object: Some(GeneratedObject {
      media_token: completion.primary_media_file_token.clone(),
      cdn_url: completion.maybe_cdn_url.clone().unwrap_or_else(|| Url::parse("https://cdn.artcraft.ai/placeholder").unwrap()),
      maybe_thumbnail_template: completion.maybe_thumbnail_url_template.clone(),
    }),
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  event.send_infallible(app);
  Ok(())
}

fn notify_gaussian_generation(
  app: &AppHandle,
  task: &Task,
  completion: &CompletionData,
) -> Result<(), Box<dyn std::error::Error>> {
  let event = GaussianGenerationCompleteEvent {
    generated_gaussian: Some(GeneratedGaussian {
      media_token: completion.primary_media_file_token.clone(),
      cdn_url: completion.maybe_cdn_url.clone().unwrap_or_else(|| Url::parse("https://cdn.artcraft.ai/placeholder").unwrap()),
      maybe_thumbnail_template: completion.maybe_thumbnail_url_template.clone(),
    }),
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  event.send_infallible(app);
  Ok(())
}

fn notify_background_removal(
  app: &AppHandle,
  task: &Task,
  completion: &CompletionData,
) -> Result<(), Box<dyn std::error::Error>> {
  let event = CanvasBackgroundRemovalCompleteEvent {
    media_token: completion.primary_media_file_token.clone(),
    image_cdn_url: completion.maybe_cdn_url.clone().unwrap_or_else(|| Url::parse("https://cdn.artcraft.ai/placeholder").unwrap()),
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  event.send_infallible(app);
  Ok(())
}

// ── Helpers ──

/// Collect generated images. If there's a batch token, fetch all files in the batch.
/// Otherwise, return a single-element list with the primary file.
async fn collect_generated_images(
  api_host: &ApiHost,
  maybe_creds: Option<&StorytellerCredentialSet>,
  completion: &CompletionData,
) -> Vec<GeneratedImage> {
  // If we have a batch token, try to fetch all files in the batch.
  if let Some(batch_token) = &completion.maybe_batch_token {
    match list_batch_generated_redux_media_files(api_host, maybe_creds, batch_token).await {
      Ok(result) if !result.media_files.is_empty() => {
        return result.media_files.into_iter()
          .map(|file| GeneratedImage {
            media_token: file.token,
            cdn_url: file.media_links.cdn_url,
            maybe_thumbnail_template: file.media_links.maybe_thumbnail_template,
          })
          .collect();
      }
      Ok(_) => {
        warn!("[ThirdPartyEvents] Batch token {} returned no media files, falling back to primary", batch_token);
      }
      Err(err) => {
        error!("[ThirdPartyEvents] Failed to list batch media files: {:?}, falling back to primary", err);
      }
    }
  }

  // Fallback: single image from primary token.
  vec![GeneratedImage {
    media_token: completion.primary_media_file_token.clone(),
    cdn_url: completion.maybe_cdn_url.clone().unwrap_or_else(|| Url::parse("https://cdn.artcraft.ai/placeholder").unwrap()),
    maybe_thumbnail_template: completion.maybe_thumbnail_url_template.clone(),
  }]
}

fn task_type_to_generation_action(task_type: TaskType) -> GenerationAction {
  match task_type {
    TaskType::ImageGeneration => GenerationAction::GenerateImage,
    TaskType::VideoGeneration => GenerationAction::GenerateVideo,
    TaskType::BackgroundRemoval => GenerationAction::RemoveBackground,
    TaskType::ObjectGeneration => GenerationAction::ImageTo3d,
    TaskType::GaussianGeneration => GenerationAction::GenerateGaussian,
    TaskType::ImageInpaintEdit => GenerationAction::ImageInpaintEdit,
  }
}

fn provider_to_generation_service(provider: GenerationProvider) -> GenerationServiceProvider {
  match provider {
    GenerationProvider::Artcraft => GenerationServiceProvider::Artcraft,
    GenerationProvider::Fal => GenerationServiceProvider::Fal,
    GenerationProvider::Grok => GenerationServiceProvider::Grok,
    GenerationProvider::Midjourney => GenerationServiceProvider::Midjourney,
    GenerationProvider::Sora => GenerationServiceProvider::Sora,
    GenerationProvider::WorldLabs => GenerationServiceProvider::WorldLabs,
  }
}

fn task_model_type_to_generation_model(model: TaskModelType) -> Option<GenerationModel> {
  match model {
    TaskModelType::Flux1Dev => Some(GenerationModel::Flux1Dev),
    TaskModelType::Flux1Schnell => Some(GenerationModel::Flux1Schnell),
    TaskModelType::FluxPro1 => Some(GenerationModel::FluxPro1),
    TaskModelType::FluxPro11 => Some(GenerationModel::FluxPro11),
    TaskModelType::FluxPro11Ultra => Some(GenerationModel::FluxPro11Ultra),
    TaskModelType::FluxProKontextMax => Some(GenerationModel::FluxProKontextMax),
    TaskModelType::FluxDevJuggernaut => Some(GenerationModel::FluxDevJuggernaut),
    TaskModelType::Flux2LoraAngles => Some(GenerationModel::Flux2LoraAngles),
    TaskModelType::GptImage1 => Some(GenerationModel::GptImage1),
    TaskModelType::GptImage1p5 => Some(GenerationModel::GptImage1p5),
    TaskModelType::GptImage2 => Some(GenerationModel::GptImage2),
    TaskModelType::NanoBanana => Some(GenerationModel::NanoBanana),
    TaskModelType::NanoBanana2 => Some(GenerationModel::NanoBanana2),
    TaskModelType::NanoBananaPro => Some(GenerationModel::NanoBananaPro),
    TaskModelType::Seedream4 => Some(GenerationModel::Seedream4),
    TaskModelType::Seedream4p5 => Some(GenerationModel::Seedream4p5),
    TaskModelType::Seedream5Lite => Some(GenerationModel::Seedream5Lite),
    TaskModelType::QwenEdit2511Angles => Some(GenerationModel::QwenEdit2511Angles),
    TaskModelType::GrokImage => Some(GenerationModel::GrokImage),
    TaskModelType::Recraft3 => Some(GenerationModel::Recraft3),
    TaskModelType::GrokVideo => Some(GenerationModel::GrokVideo),
    TaskModelType::Kling16Pro => Some(GenerationModel::Kling1_6),
    TaskModelType::Kling21Pro => Some(GenerationModel::Kling21Pro),
    TaskModelType::Kling21Master => Some(GenerationModel::Kling21Master),
    TaskModelType::Kling2p5TurboPro => Some(GenerationModel::Kling2p5TurboPro),
    TaskModelType::Kling2p6Pro => Some(GenerationModel::Kling2p6Pro),
    TaskModelType::Kling3p0Standard => Some(GenerationModel::Kling3p0Standard),
    TaskModelType::Kling3p0Pro => Some(GenerationModel::Kling3p0Pro),
    TaskModelType::HappyHorse1p0 => Some(GenerationModel::HappyHorse1p0),
    TaskModelType::Seedance10Lite => Some(GenerationModel::Seedance10Lite),
    TaskModelType::Seedance1p5Pro => Some(GenerationModel::Seedance1p5Pro),
    TaskModelType::Seedance2p0 => Some(GenerationModel::Seedance2p0),
    TaskModelType::Seedance2p0Fast => Some(GenerationModel::Seedance2p0Fast),
    TaskModelType::Sora2 => Some(GenerationModel::Sora2),
    TaskModelType::Sora2Pro => Some(GenerationModel::Sora2Pro),
    TaskModelType::Veo2 => Some(GenerationModel::Veo2),
    TaskModelType::Veo3 => Some(GenerationModel::Veo3),
    TaskModelType::Veo3Fast => Some(GenerationModel::Veo3Fast),
    TaskModelType::Veo3p1 => Some(GenerationModel::Veo3p1),
    TaskModelType::Veo3p1Fast => Some(GenerationModel::Veo3p1Fast),
    TaskModelType::Hunyuan3d2_0 => Some(GenerationModel::Hunyuan3d2_0),
    TaskModelType::Hunyuan3d2_1 => Some(GenerationModel::Hunyuan3d2_1),
    TaskModelType::Hunyuan3d3 => Some(GenerationModel::Hunyuan3d3),
    TaskModelType::Midjourney => Some(GenerationModel::Midjourney),
    TaskModelType::Gemini25Flash => Some(GenerationModel::Gemini25Flash),
    TaskModelType::WorldlabsMarble => Some(GenerationModel::WorldlabsMarble),
    TaskModelType::WorldlabsMarble0p1Mini => Some(GenerationModel::WorldlabsMarble0p1Mini),
    TaskModelType::WorldlabsMarble0p1Plus => Some(GenerationModel::WorldlabsMarble0p1Plus),
  }
}
