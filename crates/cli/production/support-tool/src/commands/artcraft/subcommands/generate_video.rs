use std::fs;
use std::path::Path;

use anyhow::anyhow;
use clap::Args;
use log::info;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_client::endpoints::omni_gen::generate::video::omni_gen_video::omni_gen_video_generate;
use tokens::tokens::media_files::MediaFileToken;

use crate::utils::parse_video_model::parse_video_model;
use super::super::state::ArtcraftState;

// ── Args ──

#[derive(Args)]
#[command(
  override_usage = "support-tool artcraft generate_video [OPTIONS] --prompt <PROMPT>",
  after_help = "\
EXAMPLES:
  support-tool artcraft generate_video --prompt \"A corgi at the lake\" --model seedance2
  support-tool artcraft generate_video --prompt prompt.txt --model veo3
  support-tool artcraft generate_video --prompt \"Dancing\" --start_frame_media_token mf_abc123
  support-tool artcraft generate_video --prompt \"Cat\" --image_reference_tokens \"mf_abc,mf_def\" --model happyhorse
",
)]
pub struct GenerateVideoArgs {
  /// A prompt string or path to a file containing the prompt (.txt or .md).
  #[arg(long)]
  pub prompt: String,

  /// A single media token for the start frame image.
  #[arg(long)]
  pub start_frame_media_token: Option<String>,

  /// A single media token for the end frame image.
  #[arg(long)]
  pub end_frame_media_token: Option<String>,

  /// Comma or space separated media tokens for image references.
  #[arg(long)]
  pub image_reference_tokens: Option<String>,

  /// Comma or space separated media tokens for video references.
  #[arg(long)]
  pub video_reference_tokens: Option<String>,

  /// Comma or space separated media tokens for audio references.
  #[arg(long)]
  pub audio_reference_tokens: Option<String>,

  #[arg(long)]

  /// Video model to use. Accepts canonical names (eg. "seedance_2p0") or aliases
  /// (eg. "seedance2", "happyhorse", "veo3fast"). [default: seedance2p0]
  #[arg(long)]
  pub model: Option<String>,

  /// Duration in seconds. [default: 5]
  #[arg(long)]
  pub duration: Option<u16>,

  /// Idempotency token (auto-generated if not specified).
  #[arg(long)]
  pub idempotency_token: Option<String>,
}

// ── Entry point ──

pub async fn run(state: &ArtcraftState, args: GenerateVideoArgs) -> anyhow::Result<()> {
  let model_str = args.model.as_deref().unwrap_or("seedance2p0");
  let model = parse_video_model(model_str)
    .ok_or_else(|| anyhow!("Unknown model '{}'. Try --help for supported names.", model_str))?;

  let prompt = resolve_prompt(&args.prompt)?;
  let api_host = &state.api_host;
  let duration = args.duration.unwrap_or(5);

  info!("Model: {:?}", model);
  info!("Prompt: {:?}", prompt);
  info!("Duration: {}s", duration);

  // Parse media tokens.
  let start_frame_token = args.start_frame_media_token.as_deref()
    .map(|s| s.trim())
    .filter(|s| !s.is_empty())
    .map(|s| MediaFileToken::new_from_str(s));

  let end_frame_token = args.end_frame_media_token.as_deref()
    .map(|s| s.trim())
    .filter(|s| !s.is_empty())
    .map(|s| MediaFileToken::new_from_str(s));

  let image_ref_tokens = parse_media_tokens(args.image_reference_tokens.as_deref());
  let video_ref_tokens = parse_media_tokens(args.video_reference_tokens.as_deref());
  let audio_ref_tokens = parse_media_tokens(args.audio_reference_tokens.as_deref());

  if let Some(t) = &start_frame_token { info!("Start frame: {}", t.as_str()); }
  if let Some(t) = &end_frame_token { info!("End frame: {}", t.as_str()); }
  if !image_ref_tokens.is_empty() { info!("Image refs: {:?}", image_ref_tokens.iter().map(|t| t.as_str()).collect::<Vec<_>>()); }
  if !video_ref_tokens.is_empty() { info!("Video refs: {:?}", video_ref_tokens.iter().map(|t| t.as_str()).collect::<Vec<_>>()); }
  if !audio_ref_tokens.is_empty() { info!("Audio refs: {:?}", audio_ref_tokens.iter().map(|t| t.as_str()).collect::<Vec<_>>()); }

  // Build the omni request. Media tokens are already uploaded — no download/re-upload needed.
  let idempotency_token = args.idempotency_token
    .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

  let request = OmniGenVideoCostAndGenerateRequest {
    idempotency_token: Some(idempotency_token.clone()),
    model: Some(model),
    prompt: Some(prompt),
    negative_prompt: None,
    start_frame_image_media_token: start_frame_token,
    end_frame_image_media_token: end_frame_token,
    reference_image_media_tokens: if image_ref_tokens.is_empty() { None } else { Some(image_ref_tokens) },
    reference_video_media_tokens: if video_ref_tokens.is_empty() { None } else { Some(video_ref_tokens) },
    reference_audio_media_tokens: if audio_ref_tokens.is_empty() { None } else { Some(audio_ref_tokens) },
    reference_character_tokens: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    duration_seconds: Some(duration),
    video_batch_count: None,
    generate_audio: None,
  };

  info!("Sending request to omni endpoint (idempotency_token={})...", idempotency_token);

  let response = omni_gen_video_generate(
    api_host,
    Some(&state.creds),
    request,
  ).await.map_err(|err| anyhow!("Omni video generation failed: {}", err))?;

  info!("Success!");
  info!("Primary job token: {}", response.inference_job_token.as_str());
  info!("All job tokens: {:?}", response.all_job_tokens.iter().map(|t| t.as_str()).collect::<Vec<_>>());

  Ok(())
}

// ── Helpers ──

fn resolve_prompt(input: &str) -> anyhow::Result<String> {
  let looks_like_file = input.ends_with(".txt") || input.ends_with(".md");

  if looks_like_file {
    let path = Path::new(input);
    if !path.exists() {
      return Err(anyhow!("Prompt file does not exist: {:?}", path));
    }
    let content = fs::read_to_string(path)
      .map_err(|err| anyhow!("Failed to read prompt file {:?}: {}", path, err))?;
    let trimmed = content.trim().to_string();
    info!("Read prompt from file {:?} ({} chars)", path, trimmed.len());
    Ok(trimmed)
  } else {
    info!("Using prompt string directly ({} chars)", input.len());
    Ok(input.to_string())
  }
}

fn parse_media_tokens(input: Option<&str>) -> Vec<MediaFileToken> {
  let input = match input {
    Some(s) if !s.trim().is_empty() => s,
    _ => return Vec::new(),
  };

  input
    .split(|c: char| c == ',' || c.is_whitespace())
    .map(|s| s.trim())
    .filter(|s| !s.is_empty())
    .map(|s| MediaFileToken::new_from_str(s))
    .collect()
}
