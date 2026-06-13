use std::collections::HashSet;
use std::path::Path;
use anyhow::{anyhow, Result};
use log::info;
use serde_json::Value;

use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::utils::api_host::ApiHost;
use artcraft_client::endpoints::omni_gen::generate::image::omni_gen_image::omni_gen_image_generate;
use artcraft_client::endpoints::omni_gen::generate::video::omni_gen_video::omni_gen_video_generate;
use artcraft_client::endpoints::jobs::list_session_jobs::{list_session_jobs, States};
use artcraft_client::recipes::upload_media_file_from_file::upload_media_file_from_file;

// New imports for headless tools
use artcraft_client::endpoints::credits::get_session_credits::get_session_credits;
use artcraft_client::endpoints::subscriptions::get_session_subscription::get_session_subscription;
use artcraft_client::endpoints::stripe_artcraft::create_credits_pack_checkout::create_credits_pack_checkout;
use artcraft_client::endpoints::stripe_artcraft::create_subscription_checkout::create_subscription_checkout;
use artcraft_client::endpoints::stripe_artcraft::customer_portal_manage_plan::customer_portal_manage_plan;
use artcraft_client::endpoints::generate::cost_estimate::image::estimate_image_cost::estimate_image_cost;
use artcraft_client::endpoints::generate::cost_estimate::video::estimate_video_cost::estimate_video_cost;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::endpoints::media_files::delete_media_file::delete_media_file;
use artcraft_client::recipes::download_media_file::{download_media_file, DownloadMediaFileArgs, DownloadPath};
use artcraft_client::endpoints::prompts::create_prompt::create_prompt;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_api_defs::stripe_artcraft::create_credits_pack_checkout::StripeArtcraftCreateCreditsPackCheckoutRequest;
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::StripeArtcraftCreateSubscriptionCheckoutRequest;
use artcraft_api_defs::stripe_artcraft::customer_portal_manage_plan::StripeArtcraftCustomerPortalManagePlanRequest;
use artcraft_api_defs::generate::cost_estimate::estimate_image_cost::{EstimateImageCostRequest, GenerationMode as ImageGenMode};
use artcraft_api_defs::generate::cost_estimate::estimate_video_cost::{EstimateVideoCostRequest, GenerationMode as VideoGenMode};
use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;

use enums::common::generation::common_image_model::CommonImageModel;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_quality::CommonQuality;
use enums::common::generation_provider::GenerationProvider;
use enums::common::payments_namespace::PaymentsNamespace;
use enums::common::artcraft_credits_pack_slug::ArtcraftCreditsPackSlug;
use enums::common::artcraft_subscription_slug::ArtcraftSubscriptionSlug;
use artcraft_api_defs::stripe_artcraft::create_subscription_checkout::PlanBillingCadence;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::mcp_protocol::{McpContent, CallToolResult};

pub async fn handle_list_jobs(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  arguments: Option<Value>,
) -> Result<CallToolResult> {
  let include_states = arguments.as_ref()
    .and_then(|args| args.get("include_states"))
    .and_then(|v| v.as_str());

  let exclude_states = arguments.as_ref()
    .and_then(|args| args.get("exclude_states"))
    .and_then(|v| v.as_str());

  let states = if let Some(inc) = include_states {
    let mut hs = HashSet::new();
    for s in inc.split(',') {
      if let Ok(state) = serde_json::from_value(Value::String(s.trim().to_string())) {
        hs.insert(state);
      }
    }
    States::Include(hs)
  } else if let Some(exc) = exclude_states {
    let mut hs = HashSet::new();
    for s in exc.split(',') {
      if let Ok(state) = serde_json::from_value(Value::String(s.trim().to_string())) {
        hs.insert(state);
      }
    }
    States::Exclude(hs)
  } else {
    States::All
  };

  info!("Fetching session jobs from API...");
  let response = list_session_jobs(api_host, Some(creds), states).await
    .map_err(|e| anyhow!("Failed to list jobs: {:?}", e))?;

  let mut text = String::new();
  text.push_str(&format!("Found {} jobs:\n\n", response.jobs.len()));

  for job in response.jobs.iter().take(20) {
    text.push_str(&format!("- **Job Token**: `{}`\n", job.job_token.as_str()));
    text.push_str(&format!("  Category: {:?}\n", job.request.inference_category));
    text.push_str(&format!("  Status: {:?}\n", job.status.status));
    text.push_str(&format!("  Progress: {}%\n", job.status.progress_percentage));
    if let Some(desc) = &job.status.maybe_extra_status_description {
      text.push_str(&format!("  Details: {}\n", desc));
    }
    if let Some(res) = &job.maybe_result {
      text.push_str("  Result CDN Links:\n");
      text.push_str(&format!("    CDN URL: {}\n", res.media_links.cdn_url));
      if let Some(previews) = &res.media_links.maybe_video_previews {
        text.push_str(&format!("    Preview (Still): {}\n", previews.still));
        text.push_str(&format!("    Preview (Animated): {}\n", previews.animated));
      }
    }
    if let Some(msg) = &job.status.maybe_failure_message {
      text.push_str(&format!("  Failure: {}\n", msg));
    }
    text.push_str("\n");
  }

  if response.jobs.len() > 20 {
    text.push_str("*(Showing only the 20 most recent jobs)*\n");
  }

  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

pub async fn handle_get_job_status(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  arguments: Option<Value>,
) -> Result<CallToolResult> {
  let job_token_str = arguments.as_ref()
    .and_then(|args| args.get("job_token"))
    .and_then(|v| v.as_str())
    .ok_or_else(|| anyhow!("Missing required parameter: job_token"))?;

  let target_token = InferenceJobToken::new_from_str(job_token_str);

  info!("Fetching session jobs to check status of token: {}", job_token_str);
  let response = list_session_jobs(api_host, Some(creds), States::All).await
    .map_err(|e| anyhow!("Failed to list jobs: {:?}", e))?;

  let matched_job = response.jobs.iter().find(|job| job.job_token == target_token);

  let text = match matched_job {
    Some(job) => {
      let mut res_str = format!("**Job details for `{}`**:\n", job.job_token.as_str());
      res_str.push_str(&format!("- Category: {:?}\n", job.request.inference_category));
      res_str.push_str(&format!("- Status: {:?}\n", job.status.status));
      res_str.push_str(&format!("- Progress: {}%\n", job.status.progress_percentage));
      res_str.push_str(&format!("- Created At: {}\n", job.created_at));
      res_str.push_str(&format!("- Updated At: {}\n", job.updated_at));

      if let Some(desc) = &job.status.maybe_extra_status_description {
        res_str.push_str(&format!("- Extra status: {}\n", desc));
      }

      if let Some(res) = &job.maybe_result {
        res_str.push_str("- Result CDN Links:\n");
        res_str.push_str(&format!("  - CDN URL: {}\n", res.media_links.cdn_url));
        if let Some(previews) = &res.media_links.maybe_video_previews {
          res_str.push_str(&format!("  - Preview (Still): {}\n", previews.still));
          res_str.push_str(&format!("  - Preview (Animated): {}\n", previews.animated));
        }
      }

      if let Some(msg) = &job.status.maybe_failure_message {
        res_str.push_str(&format!("- Failure Message: {}\n", msg));
      }

      res_str
    }
    None => {
      format!("Job `{}` not found in the recent session history.", job_token_str)
    }
  };

  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

pub async fn handle_upload_media(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  arguments: Option<Value>,
) -> Result<CallToolResult> {
  let file_path_str = arguments.as_ref()
    .and_then(|args| args.get("file_path"))
    .and_then(|v| v.as_str())
    .ok_or_else(|| anyhow!("Missing required parameter: file_path"))?;

  let path = Path::new(file_path_str);
  if !path.exists() {
    return Err(anyhow!("File does not exist: {}", file_path_str));
  }

  info!("Uploading media file: {:?}", path);
  let response = upload_media_file_from_file(api_host, Some(creds), path, None).await
    .map_err(|e| anyhow!("Failed to upload media file: {:?}", e))?;

  let text = format!(
    "Media uploaded successfully!\n\n**Media File Token**: `{}`",
    response.media_file_token.as_str()
  );

  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

pub async fn handle_generate_image(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  arguments: Option<Value>,
) -> Result<CallToolResult> {
  let args = arguments.ok_or_else(|| anyhow!("Arguments are required"))?;
  
  let prompt = args.get("prompt")
    .and_then(|v| v.as_str())
    .ok_or_else(|| anyhow!("Missing required parameter: prompt"))?
    .to_string();

  let model = match args.get("model").and_then(|v| v.as_str()) {
    Some(model_str) => {
      let model_val = serde_json::Value::String(model_str.to_string());
      let parsed_model: CommonImageModel = serde_json::from_value(model_val)
        .map_err(|e| anyhow!("Invalid image model name: '{}'. Details: {:?}", model_str, e))?;
      Some(parsed_model)
    }
    None => Some(CommonImageModel::Flux1Dev) // Default to Flux 1 Dev
  };

  let aspect_ratio = match args.get("aspect_ratio").and_then(|v| v.as_str()) {
    Some(ar_str) => {
      let ar_val = serde_json::Value::String(ar_str.to_string());
      let parsed_ar: CommonAspectRatio = serde_json::from_value(ar_val)
        .map_err(|e| anyhow!("Invalid aspect ratio: '{}'. Details: {:?}", ar_str, e))?;
      Some(parsed_ar)
    }
    None => None
  };

  let quality = match args.get("quality").and_then(|v| v.as_str()) {
    Some(q_str) => {
      let q_val = serde_json::Value::String(q_str.to_string());
      let parsed_q: CommonQuality = serde_json::from_value(q_val)
        .map_err(|e| anyhow!("Invalid quality: '{}'", q_str))?;
      Some(parsed_q)
    }
    None => None
  };

  let image_batch_count = args.get("image_batch_count")
    .and_then(|v| v.as_u64())
    .map(|v| v as u16);

  let idempotency_token = uuid::Uuid::new_v4().to_string();

  let request = OmniGenImageCostAndGenerateRequest {
    idempotency_token: Some(idempotency_token),
    model,
    prompt: Some(prompt),
    image_media_tokens: None,
    resolution: None,
    aspect_ratio,
    quality,
    image_batch_count,
    adjust_horizontal_angle: None,
    adjust_vertical_angle: None,
    adjust_zoom: None,
  };

  info!("Sending image generation request to omni endpoint...");
  let response = omni_gen_image_generate(api_host, Some(creds), request).await
    .map_err(|e| anyhow!("Image generation failed: {:?}", e))?;

  let text = format!(
    "Image generation job enqueued successfully!\n\n**Job Token**: `{}`\nUse the `get_job_status` tool to check progress and retrieve output links.",
    response.inference_job_token.as_str()
  );

  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

pub async fn handle_generate_video(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  arguments: Option<Value>,
) -> Result<CallToolResult> {
  let args = arguments.ok_or_else(|| anyhow!("Arguments are required"))?;

  let prompt = args.get("prompt")
    .and_then(|v| v.as_str())
    .ok_or_else(|| anyhow!("Missing required parameter: prompt"))?
    .to_string();

  let model = match args.get("model").and_then(|v| v.as_str()) {
    Some(model_str) => {
      let model_val = serde_json::Value::String(model_str.to_string());
      let parsed_model: CommonVideoModel = serde_json::from_value(model_val)
        .map_err(|e| anyhow!("Invalid video model name: '{}'. Details: {:?}", model_str, e))?;
      Some(parsed_model)
    }
    None => Some(CommonVideoModel::Seedance2p0) // Default to Seedance 2.0
  };

  let duration = args.get("duration")
    .and_then(|v| v.as_u64())
    .map(|v| v as u16);

  let start_frame = args.get("start_frame_media_token")
    .and_then(|v| v.as_str())
    .filter(|s| !s.trim().is_empty())
    .map(|s| MediaFileToken::new_from_str(s));

  let end_frame = args.get("end_frame_media_token")
    .and_then(|v| v.as_str())
    .filter(|s| !s.trim().is_empty())
    .map(|s| MediaFileToken::new_from_str(s));

  let image_refs = args.get("image_reference_tokens")
    .and_then(|v| v.as_str())
    .map(|s| parse_media_tokens(s));

  let video_refs = args.get("video_reference_tokens")
    .and_then(|v| v.as_str())
    .map(|s| parse_media_tokens(s));

  let audio_refs = args.get("audio_reference_tokens")
    .and_then(|v| v.as_str())
    .map(|s| parse_media_tokens(s));

  let idempotency_token = uuid::Uuid::new_v4().to_string();

  let request = OmniGenVideoCostAndGenerateRequest {
    idempotency_token: Some(idempotency_token),
    model,
    prompt: Some(prompt),
    negative_prompt: None,
    start_frame_image_media_token: start_frame,
    end_frame_image_media_token: end_frame,
    reference_image_media_tokens: image_refs,
    reference_video_media_tokens: video_refs,
    reference_audio_media_tokens: audio_refs,
    reference_character_tokens: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    duration_seconds: duration,
    video_batch_count: None,
    generate_audio: None,
  };

  info!("Sending video generation request to omni endpoint...");
  let response = omni_gen_video_generate(api_host, Some(creds), request).await
    .map_err(|e| anyhow!("Video generation failed: {:?}", e))?;

  let text = format!(
    "Video generation job enqueued successfully!\n\n**Job Token**: `{}`\nUse the `get_job_status` tool to check progress and retrieve output links.",
    response.inference_job_token.as_str()
  );

  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

fn parse_media_tokens(input: &str) -> Vec<MediaFileToken> {
  input
    .split(|c: char| c == ',' || c.is_whitespace())
    .map(|s| s.trim())
    .filter(|s| !s.is_empty())
    .map(|s| MediaFileToken::new_from_str(s))
    .collect()
}

pub async fn handle_get_credits(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  _arguments: Option<Value>,
) -> Result<CallToolResult> {
  info!("Fetching credits...");
  let response = get_session_credits(api_host, Some(creds), PaymentsNamespace::Artcraft).await
    .map_err(|e| anyhow!("Failed to get credits: {:?}", e))?;

  let text = format!(
    "**Credit Balance**\n\n- Free Credits: {}\n- Monthly Credits: {}\n- Banked Credits: {}\n- **Total Credits: {}**",
    response.free_credits, response.monthly_credits, response.banked_credits, response.sum_total_credits
  );

  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

pub async fn handle_get_subscription(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  _arguments: Option<Value>,
) -> Result<CallToolResult> {
  info!("Fetching subscription...");
  let response = get_session_subscription(api_host, Some(creds), PaymentsNamespace::Artcraft).await
    .map_err(|e| anyhow!("Failed to get subscription: {:?}", e))?;

  let text = match &response.active_subscription {
    Some(sub) => format!(
      "**Active Subscription**\n\n- Plan: {}\n- Next Bill At: {:?}\n- Ends At: {:?}",
      sub.product_slug, sub.next_bill_at, sub.subscription_end_at
    ),
    None => "No active subscription found.".to_string()
  };

  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

pub async fn handle_create_checkout_session(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  arguments: Option<Value>,
) -> Result<CallToolResult> {
  let args = arguments.ok_or_else(|| anyhow!("Arguments are required"))?;
  
  let checkout_type = args.get("type").and_then(|v| v.as_str()).unwrap_or("");
  
  let text = if checkout_type == "credits" {
    let pack: Option<ArtcraftCreditsPackSlug> = args.get("pack_slug").and_then(|v| serde_json::from_value(v.clone()).ok());
    let request = StripeArtcraftCreateCreditsPackCheckoutRequest { credits_pack: pack };
    let response = create_credits_pack_checkout(api_host, Some(creds), request).await
      .map_err(|e| anyhow!("Failed to create credits checkout: {:?}", e))?;
    format!("Generated Checkout URL for Credits:\n{}", response.stripe_checkout_redirect_url)
  } else if checkout_type == "subscription" {
    let plan: Option<ArtcraftSubscriptionSlug> = args.get("plan_id").and_then(|v| serde_json::from_value(v.clone()).ok());
    let cadence: Option<PlanBillingCadence> = args.get("cadence").and_then(|v| serde_json::from_value(v.clone()).ok());
    let request = StripeArtcraftCreateSubscriptionCheckoutRequest { plan, cadence };
    let response = create_subscription_checkout(api_host, Some(creds), request).await
      .map_err(|e| anyhow!("Failed to create subscription checkout: {:?}", e))?;
    format!("Generated Checkout URL for Subscription:\n{}", response.stripe_checkout_redirect_url)
  } else {
    return Err(anyhow!("Invalid checkout type. Must be 'credits' or 'subscription'."));
  };

  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

pub async fn handle_get_billing_portal_url(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  _arguments: Option<Value>,
) -> Result<CallToolResult> {
  let request = StripeArtcraftCustomerPortalManagePlanRequest { portal_config_id: None };
  let response = customer_portal_manage_plan(api_host, Some(creds), request).await
    .map_err(|e| anyhow!("Failed to create customer portal session: {:?}", e))?;
  
  let text = format!("Generated Stripe Customer Portal URL:\n{}", response.stripe_portal_url);
  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

pub async fn handle_estimate_image_cost(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  arguments: Option<Value>,
) -> Result<CallToolResult> {
  let args = arguments.ok_or_else(|| anyhow!("Arguments are required"))?;
  
  let model: CommonImageModel = serde_json::from_value(args.get("model").unwrap_or(&Value::Null).clone())
    .map_err(|e| anyhow!("Invalid model: {:?}", e))?;
  
  let provider: GenerationProvider = serde_json::from_value(args.get("provider").unwrap_or(&Value::Null).clone())
    .map_err(|e| anyhow!("Invalid provider: {:?}", e))?;
  
  let mode_str = args.get("generation_mode").and_then(|v| v.as_str()).unwrap_or("");
  let generation_mode = if mode_str == "text_to_image" {
    ImageGenMode::TextToImage
  } else if mode_str == "image_edit" {
    ImageGenMode::ImageEdit { count: 1 }
  } else {
    return Err(anyhow!("Invalid generation mode"));
  };

  let aspect_ratio = args.get("aspect_ratio")
    .map(|v| serde_json::from_value(v.clone()).unwrap_or(CommonAspectRatio::Square));

  let request = EstimateImageCostRequest {
    model, provider, generation_mode, aspect_ratio,
    resolution: None, quality: None,
    image_batch_count: args.get("image_batch_count").and_then(|v| v.as_u64()).map(|v| v as u16),
  };

  let response = estimate_image_cost(api_host, Some(creds), request).await
    .map_err(|e| anyhow!("Failed to estimate cost: {:?}", e))?;

  let text = format!(
    "**Image Cost Estimate**\n- Credits: {:?}\n- USD Cents: {:?}\n- Is Free: {}\n- Has Watermark: {}",
    response.cost_in_credits, response.cost_in_usd_cents, response.is_free, response.has_watermark
  );

  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

pub async fn handle_estimate_video_cost(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  arguments: Option<Value>,
) -> Result<CallToolResult> {
  let args = arguments.ok_or_else(|| anyhow!("Arguments are required"))?;
  
  let model: CommonVideoModel = serde_json::from_value(args.get("model").unwrap_or(&Value::Null).clone())
    .map_err(|e| anyhow!("Invalid model: {:?}", e))?;
  
  let provider: GenerationProvider = serde_json::from_value(args.get("provider").unwrap_or(&Value::Null).clone())
    .map_err(|e| anyhow!("Invalid provider: {:?}", e))?;
  
  let mode_str = args.get("generation_mode").and_then(|v| v.as_str()).unwrap_or("");
  let generation_mode = if mode_str == "text_to_video" {
    VideoGenMode::TextToVideo
  } else if mode_str == "reference_image_to_video" {
    VideoGenMode::ReferenceImageToVideo { count: 1 }
  } else {
    VideoGenMode::TextToVideo
  };

  let request = EstimateVideoCostRequest {
    model, provider, generation_mode,
    aspect_ratio: args.get("aspect_ratio").map(|v| serde_json::from_value(v.clone()).unwrap_or(CommonAspectRatio::WideSixteenByNine)),
    resolution: None,
    duration_seconds: args.get("duration_seconds").and_then(|v| v.as_u64()).map(|v| v as u16),
    video_batch_count: None,
    generate_audio: None,
  };

  let response = estimate_video_cost(api_host, Some(creds), request).await
    .map_err(|e| anyhow!("Failed to estimate cost: {:?}", e))?;

  let text = format!(
    "**Video Cost Estimate**\n- Credits: {:?}\n- USD Cents: {:?}\n- Is Free: {}\n- Has Watermark: {}",
    response.cost_in_credits, response.cost_in_usd_cents, response.is_free, response.has_watermark
  );

  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

pub async fn handle_get_media_file(
  api_host: &ApiHost,
  _creds: &StorytellerCredentialSet,
  arguments: Option<Value>,
) -> Result<CallToolResult> {
  let token_str = arguments.and_then(|v| v.get("media_token").and_then(|t| t.as_str()).map(|s| s.to_string()))
    .ok_or_else(|| anyhow!("Missing media_token"))?;
  
  let token = MediaFileToken::new_from_str(&token_str);
  let response = get_media_file(api_host, &token).await
    .map_err(|e| anyhow!("Failed to get media file: {:?}", e))?;

  let text = format!("{:#?}", response.media_file);
  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

pub async fn handle_download_media_file(
  api_host: &ApiHost,
  _creds: &StorytellerCredentialSet,
  arguments: Option<Value>,
) -> Result<CallToolResult> {
  let args = arguments.ok_or_else(|| anyhow!("Arguments are required"))?;
  let token_str = args.get("media_token").and_then(|t| t.as_str()).ok_or_else(|| anyhow!("Missing media_token"))?;
  let dir_str = args.get("download_directory").and_then(|t| t.as_str()).ok_or_else(|| anyhow!("Missing download_directory"))?;
  
  let token = MediaFileToken::new_from_str(token_str);
  let dl_args = DownloadMediaFileArgs {
    media_token: &token,
    api_host,
    download_path: DownloadPath::Directory(dir_str.to_string()),
  };

  let response = download_media_file(dl_args).await
    .map_err(|e| anyhow!("Failed to download media file: {:?}", e))?;

  let text = format!("Downloaded {} bytes to {:?}", response.filesize_bytes, response.downloaded_file_path);
  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

pub async fn handle_delete_media_file(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  arguments: Option<Value>,
) -> Result<CallToolResult> {
  let token_str = arguments.and_then(|v| v.get("media_token").and_then(|t| t.as_str()).map(|s| s.to_string()))
    .ok_or_else(|| anyhow!("Missing media_token"))?;
  
  let token = MediaFileToken::new_from_str(&token_str);
  delete_media_file(api_host, Some(creds), &token).await
    .map_err(|e| anyhow!("Failed to delete media file: {:?}", e))?;

  Ok(CallToolResult {
    content: vec![McpContent::Text { text: "Deleted successfully.".to_string() }],
    is_error: None,
  })
}

pub async fn handle_create_prompt(
  api_host: &ApiHost,
  creds: &StorytellerCredentialSet,
  arguments: Option<Value>,
) -> Result<CallToolResult> {
  let args = arguments.ok_or_else(|| anyhow!("Arguments are required"))?;
  let prompt_text = args.get("prompt").and_then(|v| v.as_str()).unwrap_or("").to_string();
  let is_negative = args.get("is_negative").and_then(|v| v.as_bool()).unwrap_or(false);

  let request = CreatePromptRequest {
    uuid_idempotency_token: uuid::Uuid::new_v4().to_string(),
    positive_prompt: Some(prompt_text),
    negative_prompt: if is_negative { Some("Negative: true".to_string()) } else { None },
    model_type: None,
    generation_provider: None,
    maybe_generation_mode: None,
    maybe_aspect_ratio: None,
    maybe_resolution: None,
    maybe_batch_count: None,
    maybe_generate_audio: None,
    maybe_duration_seconds: None,
  };

  let response = create_prompt(api_host, Some(creds), request).await
    .map_err(|e| anyhow!("Failed to create prompt: {:?}", e))?;

  Ok(CallToolResult {
    content: vec![McpContent::Text { text: format!("Prompt Created. Token: {}", response.prompt_token.as_str()) }],
    is_error: None,
  })
}

pub async fn handle_list_models(
  _api_host: &ApiHost,
  _creds: &StorytellerCredentialSet,
  _arguments: Option<Value>,
) -> Result<CallToolResult> {
  let text = "Static Model List\n\nImage Models:\n- flux_1_dev (Provider: fal, artcraft)\n- nano_banana_pro (Provider: artcraft)\n- midjourney_7 (Provider: midjourney)\n- grok_imagine_image (Provider: grok)\n\nVideo Models:\n- seedance_2p0 (Provider: artcraft)\n- kling_2p1_pro (Provider: artcraft)\n- sora_2 (Provider: sora)\n\n(See frontend VideoModels.ts and ImageModels.ts for full capabilities).".to_string();
  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}

pub async fn handle_check_provider_credentials(
  _api_host: &ApiHost,
  _creds: &StorytellerCredentialSet,
  _arguments: Option<Value>,
) -> Result<CallToolResult> {
  // Safe credential check that reads filenames from ~/Artcraft/credentials/ without returning contents
  let mut home: std::path::PathBuf = match std::env::var("USERPROFILE").or_else(|_| std::env::var("HOME")) {
    Ok(h) => std::path::PathBuf::from(h),
    Err(_) => return Err(anyhow!("Could not find home directory")),
  };
  home.push("Artcraft");
  home.push("credentials");

  let mut text = "Provider Credentials Status:\n\n".to_string();
  
  let providers = vec![
    ("FAL API Key", "fal.api_key.txt"),
    ("Midjourney Login", "midjourney.web_login.toml"),
    ("Grok Login", "grok.web_login.toml"),
    ("Replicate API Key", "replicate.api_key.txt"),
    ("Runway Login", "runway.web_login.toml"),
  ];

  for (name, filename) in providers {
    let mut path = home.clone();
    path.push(filename);
    if path.exists() {
      text.push_str(&format!("- {}: **CONFIGURED**\n", name));
    } else {
      text.push_str(&format!("- {}: Missing\n", name));
    }
  }

  text.push_str("\nNote: If a key is missing, please open the ArtCraft Desktop App -> Settings -> API Keys to configure it securely.");

  Ok(CallToolResult {
    content: vec![McpContent::Text { text }],
    is_error: None,
  })
}
