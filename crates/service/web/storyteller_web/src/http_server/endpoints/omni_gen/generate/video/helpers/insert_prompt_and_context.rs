use log::warn;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation_provider::GenerationProvider;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{
  insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem,
};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};

pub async fn insert_prompt_and_context(
  request: &OmniGenVideoCostAndGenerateRequest,
  transaction: &mut sqlx::Transaction<'_, sqlx::MySql>,
  user_token: &tokens::tokens::users::UserToken,
  maybe_prompt_model_type: Option<CommonModelType>,
  ip_address: &str,
) {
  let prompt_result = insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(user_token),
    maybe_model_type: maybe_prompt_model_type,
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: request.negative_prompt.as_deref(),
    maybe_other_args: None,
    maybe_generation_mode: None,
    maybe_aspect_ratio: None,
    maybe_resolution: None,
    maybe_batch_count: request.video_batch_count.map(|c| c as u8),
    maybe_generate_audio: request.generate_audio,
    maybe_duration_seconds: request.duration_seconds.map(|d| d as u32),
    creator_ip_address: ip_address,
    mysql_executor: &mut **transaction,
    phantom: Default::default(),
  }).await;

  let prompt_token = match prompt_result {
    Ok(token) => Some(token),
    Err(err) => {
      warn!("Error inserting prompt: {:?}", err);
      None
    }
  };

  if let Some(token) = prompt_token.as_ref() {
    let mut context_items = Vec::new();

    if let Some(media_token) = &request.start_frame_image_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::VidStartFrame,
      });
    }
    if let Some(media_token) = &request.end_frame_image_media_token {
      context_items.push(PromptContextItem {
        media_token: media_token.clone(),
        context_semantic_type: PromptContextSemanticType::VidEndFrame,
      });
    }
    if let Some(ref_tokens) = &request.reference_image_media_tokens {
      for media_token in ref_tokens {
        context_items.push(PromptContextItem {
          media_token: media_token.clone(),
          context_semantic_type: PromptContextSemanticType::Imgref,
        });
      }
    }
    if let Some(ref_tokens) = &request.reference_video_media_tokens {
      for media_token in ref_tokens {
        context_items.push(PromptContextItem {
          media_token: media_token.clone(),
          context_semantic_type: PromptContextSemanticType::VidRef,
        });
      }
    }

    if !context_items.is_empty() {
      if let Err(err) = insert_batch_prompt_context_items(InsertBatchArgs {
        prompt_token: token.clone(),
        items: context_items,
        transaction,
      }).await {
        warn!("Error inserting batch prompt context items: {:?}", err);
      }
    }
  }
}
