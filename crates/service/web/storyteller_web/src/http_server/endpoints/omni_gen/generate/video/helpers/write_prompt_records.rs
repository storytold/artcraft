//! Shared prompt bookkeeping for the omni-gen video generate flows.
//!
//! Writes the prompt row and its context items (start/end frames, image and
//! video references) inside the caller's transaction. Best-effort: failures
//! are logged and yield `None` — job enqueue must not fail because prompt
//! bookkeeping did.

use log::warn;
use sqlx::{MySql, Transaction};

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use enums::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation_provider::GenerationProvider;
use mysql_queries::queries::prompt_context_items::insert_batch_prompt_context_items::{
  insert_batch_prompt_context_items, InsertBatchArgs, PromptContextItem,
};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

pub struct WritePromptRecordsArgs<'a, 'tx> {
  pub request: &'a OmniGenVideoCostAndGenerateRequest,
  pub user_token: &'a UserToken,
  pub maybe_prompt_model_type: Option<CommonModelType>,
  pub ip_address: &'a str,
  pub transaction: &'a mut Transaction<'tx, MySql>,
}

pub async fn write_prompt_records(args: WritePromptRecordsArgs<'_, '_>) -> Option<PromptToken> {
  let WritePromptRecordsArgs {
    request,
    user_token,
    maybe_prompt_model_type,
    ip_address,
    transaction,
  } = args;

  let prompt_token = match insert_prompt(InsertPromptArgs {
    maybe_apriori_prompt_token: None,
    prompt_type: PromptType::ArtcraftApp,
    maybe_creator_user_token: Some(user_token),
    maybe_model_type: maybe_prompt_model_type,
    maybe_generation_provider: Some(GenerationProvider::Artcraft),
    maybe_positive_prompt: request.prompt.as_deref(),
    maybe_negative_prompt: request.negative_prompt.as_deref(),
    maybe_other_args: None,
    maybe_generation_mode: Some(determine_generation_mode(request)),
    maybe_aspect_ratio: request.aspect_ratio,
    maybe_resolution: request.resolution,
    maybe_bitrate: request.bitrate,
    maybe_batch_count: request.video_batch_count.map(|c| c as u8),
    maybe_generate_audio: request.generate_audio,
    maybe_duration_seconds: request.duration_seconds.map(|d| d as u32),
    creator_ip_address: ip_address,
    mysql_executor: &mut **transaction,
    phantom: Default::default(),
  }).await {
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
    if let Some(ref_tokens) = &request.reference_audio_media_tokens {
      for media_token in ref_tokens {
        context_items.push(PromptContextItem {
          media_token: media_token.clone(),
          context_semantic_type: PromptContextSemanticType::Audioref,
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

  prompt_token
}

fn determine_generation_mode(request: &OmniGenVideoCostAndGenerateRequest) -> CommonGenerationMode {
  let has_keyframe = request.start_frame_image_media_token.is_some()
    || request.end_frame_image_media_token.is_some();

  if has_keyframe {
    return CommonGenerationMode::Keyframe;
  }

  let has_reference = request.reference_image_media_tokens.as_ref().is_some_and(|t| !t.is_empty())
    || request.reference_video_media_tokens.as_ref().is_some_and(|t| !t.is_empty())
    || request.reference_audio_media_tokens.as_ref().is_some_and(|t| !t.is_empty())
    || request.reference_character_tokens.as_ref().is_some_and(|t| !t.is_empty());

  if has_reference {
    return CommonGenerationMode::Reference;
  }

  CommonGenerationMode::Text
}
