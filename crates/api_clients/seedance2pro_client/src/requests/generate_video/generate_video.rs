use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::error::seedance2pro_specific_api_error::Seedance2ProSpecificApiError;
use crate::requests::generate_video::request_types::*;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

// --- Request args ---

pub struct GenerateVideoArgs<'a> {
  pub session: &'a Seedance2ProSession,

  /// Seedance 2.0 Pro vs Fast
  pub model_type: ModelType,

  pub prompt: String,

  pub resolution: Resolution,

  /// Duration in seconds (4–15).
  pub duration_seconds: u8,

  pub batch_count: BatchCount,

  /// Optional start frame image URL (keyframe mode).
  pub start_frame_url: Option<String>,

  /// Optional end frame image URL (keyframe mode).
  pub end_frame_url: Option<String>,

  /// Optional reference image URLs (reference mode).
  /// When present, takes priority over start/end frames.
  pub reference_image_urls: Option<Vec<String>>,

  /// Optional reference video URLs (reference mode).
  /// Can be combined with reference_image_urls.
  /// Videos are referenced in prompts as @video1, @video2, etc.
  /// When present, takes priority over start/end frames.
  pub reference_video_urls: Option<Vec<String>>,

  /// Optional reference audio URLs (reference mode).
  /// Audio is referenced in prompts as @audio1, @audio2, etc.
  /// Sent in a separate `audioUrls` field (not in `uploadedUrls`).
  pub reference_audio_urls: Option<Vec<String>>,

  /// Controls the `faceBlurMode` field: true sends "on", false sends "off", None omits it.
  pub use_face_blur_hack: Option<bool>,

  /// Override the default host (kinovi.ai).
  pub host_override: Option<KinoviHost>,
}

impl std::fmt::Debug for GenerateVideoArgs<'_> {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("GenerateVideoArgs")
      .field("model_type", &self.model_type)
      .field("prompt", &self.prompt)
      .field("resolution", &self.resolution)
      .field("duration_seconds", &self.duration_seconds)
      .field("batch_count", &self.batch_count)
      .field("start_frame_url", &self.start_frame_url)
      .field("end_frame_url", &self.end_frame_url)
      .field("reference_image_urls", &self.reference_image_urls)
      .field("reference_video_urls", &self.reference_video_urls)
      .field("reference_audio_urls", &self.reference_audio_urls)
      .field("use_face_blur_hack", &self.use_face_blur_hack)
      .field("host_override", &self.host_override)
      .finish()
  }
}

impl GenerateVideoArgs<'_> {
  /// Estimates the credit cost for this generation request.
  ///
  /// Pricing rules:
  /// - Seedance 2 Pro: 40 credits per second of video
  /// - Seedance 2 Fast: 28 credits per second of video
  /// - Resolution has no effect on cost
  /// - Input mode (text, keyframe, reference) has no effect on cost
  /// - Batch 1 = 1×, Batch 2 = 2×, Batch 4 = 4×
  pub fn estimate_credits(&self) -> u32 {
    let credits_per_second = match self.model_type {
      ModelType::Seedance2Pro => 40, // 40 credits per sec
      ModelType::Seedance2Fast => 28, // 28 credits per sec
    };
    let per_video = u32::from(self.duration_seconds) * credits_per_second;
    let batch_multiplier = match self.batch_count {
      BatchCount::One => 1,
      BatchCount::Two => 2,
      BatchCount::Four => 4,
    };
    per_video * batch_multiplier
  }

  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    let credits = self.estimate_credits() as f64;
    let credits_per_dollar = match self.model_type {
      // Legacy pricing from seedance2-pro.com: 25,000 credits for $99.99 (~250 credits/$1)
      ModelType::Seedance2Pro => 250.0,
      // Seedance 2 Fast pricing: 22,000 credits for $99.99 (~220 credits/$1)
      ModelType::Seedance2Fast => 220.0,
    };
    let cost = credits / credits_per_dollar * 100.0;
    cost.round() as u64
  }
}

// --- Public enums ---

/// Video resolution / aspect ratio.
#[derive(Debug, Clone, Copy)]
pub enum Resolution {
  /// 16:9 landscape (1280x720)
  Landscape16x9,
  /// 9:16 portrait (720x1280)
  Portrait9x16,
  /// 1:1 square (720x720)
  Square1x1,
  /// 4:3 standard (960x720)
  Standard4x3,
  /// 3:4 portrait (720x960)
  Portrait3x4,
}

impl Resolution {
  fn as_str(&self) -> &'static str {
    match self {
      Self::Landscape16x9 => "1280x720",
      Self::Portrait9x16 => "720x1280",
      Self::Square1x1 => "720x720",
      Self::Standard4x3 => "960x720",
      Self::Portrait3x4 => "720x960",
    }
  }
}

/// Number of videos to generate in a single request.
#[derive(Debug, Clone, Copy)]
pub enum BatchCount {
  One,
  Two,
  Four,
}

impl BatchCount {
  fn as_u8(&self) -> u8 {
    match self {
      Self::One => 1,
      Self::Two => 2,
      Self::Four => 4,
    }
  }
}

/// The Seedance model variant to use.
#[derive(Debug, Clone, Copy)]
pub enum ModelType {
  /// Seedance 2.0 Pro (higher quality, slower).
  Seedance2Pro,
  /// Seedance 2.0 Fast (lower quality, faster).
  Seedance2Fast,
}

impl ModelType {
  fn as_api_str(&self) -> &'static str {
    match self {
      Self::Seedance2Pro => "seedance-20",
      Self::Seedance2Fast => "seedance2-fast",
    }
  }
}

// --- Response ---

pub struct GenerateVideoResponse {
  pub task_id: String,

  pub order_id: String,

  /// Present when batch_count > 1.
  pub task_ids: Option<Vec<String>>,

  /// Present when batch_count > 1.
  pub order_ids: Option<Vec<String>>,
}

// --- Implementation ---

pub async fn generate_video(args: GenerateVideoArgs<'_>) -> Result<GenerateVideoResponse, Seedance2ProError> {
  let host = resolve_host(args.host_override.as_ref());
  let base_url = host.api_base_url();
  let run_task_url = format!("{}/api/trpc/workflow.runTask?batch=1", base_url);

  info!("Requesting video from Seedance2Pro: {:?}", args);

  let has_reference_images = args.reference_image_urls.as_ref().is_some_and(|urls| !urls.is_empty());
  let has_reference_videos = args.reference_video_urls.as_ref().is_some_and(|urls| !urls.is_empty());
  let has_reference_audio = args.reference_audio_urls.as_ref().is_some_and(|urls| !urls.is_empty());

  let is_reference_mode = has_reference_images || has_reference_videos || has_reference_audio;

  let video_input_mode = if is_reference_mode { "reference" } else { "keyframe" };

  let uploaded_urls: Option<Vec<String>> = if is_reference_mode {
    let mut urls = Vec::new();
    if let Some(video_urls) = args.reference_video_urls {
      urls.extend(video_urls);
    }
    if let Some(image_urls) = args.reference_image_urls {
      urls.extend(image_urls);
    }
    if urls.is_empty() { None } else { Some(urls) }
  } else {
    let mut urls = Vec::new();
    if let Some(url) = args.start_frame_url {
      urls.push(url);
    }
    if let Some(url) = args.end_frame_url {
      urls.push(url);
    }
    if urls.is_empty() { None } else { Some(urls) }
  };

  let audio_urls: Option<Vec<String>> = if has_reference_audio {
    args.reference_audio_urls
  } else {
    None
  };

  let face_blur_mode = match args.use_face_blur_hack {
    Some(true) => Some("on"),
    Some(false) => Some("off"),
    None => None,
  };

  let batch_count_value = args.batch_count.as_u8();
  let batch_count = if batch_count_value > 1 { Some(batch_count_value) } else { None };

  let duration = format!("{}s", args.duration_seconds);

  info!(
    "Generating video: mode={}, resolution={}, duration={}, batch={}",
    video_input_mode, args.resolution.as_str(), duration, batch_count_value
  );

  let request_body = BatchRequest {
    zero: BatchRequestInner {
      json: BatchRequestJson {
        business_type: "wan22-video-generation",
        api_params: ApiParams {
          prompt: args.prompt,
          resolution: args.resolution.as_str().to_string(),
          content_mode: "normal",
          model: args.model_type.as_api_str(),
          duration,
          mode: video_input_mode,
          face_blur_mode,
          uploaded_urls,
          audio_urls,
          batch_count,
        },
      },
    },
  };

  info!("Seedance2pro request : {:?}", request_body);

  let cookie = args.session.cookies.as_str();

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let referer = format!("{}/", base_url);

  let response = client.post(&run_task_url)
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", &referer)
    .header("Content-Type", "application/json")
    .header("x-trpc-source", "client")
    .header("Origin", base_url)
    .header("Connection", "keep-alive")
    .header("Cookie", cookie)
    .header("Sec-Fetch-Dest", "empty")
    .header("Sec-Fetch-Mode", "cors")
    .header("Sec-Fetch-Site", "same-origin")
    .header("Priority", "u=4")
    .header("TE", "trailers")
    .json(&request_body)
    .send()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  info!("Response status: {}, body: {}", status, response_body);

  if !status.is_success() {
    return Err(Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  let batch_response: Vec<BatchResponseItem> = serde_json::from_str(&response_body)
    .map_err(|err| Seedance2ProGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  let task_data = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| Seedance2ProGenericApiError::UncategorizedBadResponse(
      "Empty batch response array".to_string()
    ))?
    .result
    .data
    .json;

  if task_data.violation_warning {
    return Err(Seedance2ProSpecificApiError::VideoGenerationViolation(response_body).into());
  }

  Ok(GenerateVideoResponse {
    task_id: task_data.task_id,
    order_id: task_data.order_id,
    task_ids: task_data.task_ids,
    order_ids: task_data.order_ids,
  })
}

#[cfg(test)]
mod tests {
  use std::fs;
  use super::*;
  use crate::creds::seedance2pro_session::Seedance2ProSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;
  use crate::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
  use crate::requests::upload_file::upload_file::{upload_file, UploadFileArgs};

  mod pricing_tests {
    use super::*;

    fn dummy_session() -> Seedance2ProSession {
      Seedance2ProSession::from_cookies_string(String::new())
    }

    fn args_with(model_type: ModelType, duration_seconds: u8, batch_count: BatchCount) -> GenerateVideoArgs<'static> {
      // Safety: the dummy session is leaked so the reference is 'static for test purposes.
      let session = Box::leak(Box::new(dummy_session()));
      GenerateVideoArgs {
        session,
        model_type,
        prompt: String::new(),
        resolution: Resolution::Square1x1,
        duration_seconds,
        batch_count,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        use_face_blur_hack: None,
        host_override: None,
      }
    }

    fn pro(duration_seconds: u8, batch_count: BatchCount) -> GenerateVideoArgs<'static> {
      args_with(ModelType::Seedance2Pro, duration_seconds, batch_count)
    }

    fn fast(duration_seconds: u8, batch_count: BatchCount) -> GenerateVideoArgs<'static> {
      args_with(ModelType::Seedance2Fast, duration_seconds, batch_count)
    }

    #[test]
    fn test_estimate_credits_pro() {
      // 40 credits per second, batch 1
      assert_eq!(pro(4, BatchCount::One).estimate_credits(), 160);
      assert_eq!(pro(5, BatchCount::One).estimate_credits(), 200);
      assert_eq!(pro(6, BatchCount::One).estimate_credits(), 240);
      assert_eq!(pro(7, BatchCount::One).estimate_credits(), 280);
      assert_eq!(pro(15, BatchCount::One).estimate_credits(), 600);

      // Batch 2 = 2×
      assert_eq!(pro(4, BatchCount::Two).estimate_credits(), 320);
      assert_eq!(pro(5, BatchCount::Two).estimate_credits(), 400);
      assert_eq!(pro(15, BatchCount::Two).estimate_credits(), 1200);

      // Batch 4 = 4×
      assert_eq!(pro(4, BatchCount::Four).estimate_credits(), 640);
      assert_eq!(pro(5, BatchCount::Four).estimate_credits(), 800);
      assert_eq!(pro(15, BatchCount::Four).estimate_credits(), 2400);
    }

    #[test]
    fn test_estimate_credits_fast() {
      // 28 credits per second, batch 1
      assert_eq!(fast(4, BatchCount::One).estimate_credits(), 112);
      assert_eq!(fast(5, BatchCount::One).estimate_credits(), 140);
      assert_eq!(fast(6, BatchCount::One).estimate_credits(), 168);
      assert_eq!(fast(7, BatchCount::One).estimate_credits(), 196);
      assert_eq!(fast(15, BatchCount::One).estimate_credits(), 420);

      // Batch 2 = 2×
      assert_eq!(fast(4, BatchCount::Two).estimate_credits(), 224);
      assert_eq!(fast(5, BatchCount::Two).estimate_credits(), 280);
      assert_eq!(fast(15, BatchCount::Two).estimate_credits(), 840);

      // Batch 4 = 4×
      assert_eq!(fast(4, BatchCount::Four).estimate_credits(), 448);
      assert_eq!(fast(5, BatchCount::Four).estimate_credits(), 560);
      assert_eq!(fast(15, BatchCount::Four).estimate_credits(), 1680);
    }

    #[test]
    fn test_estimate_cost_usd_cents_pro() {
      // 40 credits per second, batch 1
      assert_eq!(pro(4, BatchCount::One).estimate_cost_in_usd_cents(), 64);
      assert_eq!(pro(5, BatchCount::One).estimate_cost_in_usd_cents(), 80);
      assert_eq!(pro(6, BatchCount::One).estimate_cost_in_usd_cents(), 96);
      assert_eq!(pro(7, BatchCount::One).estimate_cost_in_usd_cents(), 112);
      assert_eq!(pro(15, BatchCount::One).estimate_cost_in_usd_cents(), 240);

      // Batch 2 = 2×
      assert_eq!(pro(4, BatchCount::Two).estimate_cost_in_usd_cents(), 128);
      assert_eq!(pro(5, BatchCount::Two).estimate_cost_in_usd_cents(), 160);
      assert_eq!(pro(15, BatchCount::Two).estimate_cost_in_usd_cents(), 480);

      // Batch 4 = 4×
      assert_eq!(pro(4, BatchCount::Four).estimate_cost_in_usd_cents(), 256);
      assert_eq!(pro(5, BatchCount::Four).estimate_cost_in_usd_cents(), 320);
      assert_eq!(pro(15, BatchCount::Four).estimate_cost_in_usd_cents(), 960);
    }

    #[test]
    fn test_estimate_cost_usd_cents_fast() {
      // 28 credits per second, 220 credits/$1 (22,000 credits for $99.99)
      // 28 * 4 = 112 credits => 112 / 220 * 100 = 50.9 => 51 cents
      assert_eq!(fast(4, BatchCount::One).estimate_cost_in_usd_cents(), 51);
      // 28 * 5 = 140 credits => 140 / 220 * 100 = 63.6 => 64 cents
      assert_eq!(fast(5, BatchCount::One).estimate_cost_in_usd_cents(), 64);
      // 28 * 6 = 168 credits => 168 / 220 * 100 = 76.4 => 76 cents
      assert_eq!(fast(6, BatchCount::One).estimate_cost_in_usd_cents(), 76);
      // 28 * 7 = 196 credits => 196 / 220 * 100 = 89.1 => 89 cents
      assert_eq!(fast(7, BatchCount::One).estimate_cost_in_usd_cents(), 89);
      // 28 * 15 = 420 credits => 420 / 220 * 100 = 190.9 => 191 cents
      assert_eq!(fast(15, BatchCount::One).estimate_cost_in_usd_cents(), 191);

      // Batch 2 = 2×
      assert_eq!(fast(4, BatchCount::Two).estimate_cost_in_usd_cents(), 102);
      assert_eq!(fast(5, BatchCount::Two).estimate_cost_in_usd_cents(), 127);
      assert_eq!(fast(15, BatchCount::Two).estimate_cost_in_usd_cents(), 382);

      // Batch 4 = 4×
      assert_eq!(fast(4, BatchCount::Four).estimate_cost_in_usd_cents(), 204);
      assert_eq!(fast(5, BatchCount::Four).estimate_cost_in_usd_cents(), 255);
      assert_eq!(fast(15, BatchCount::Four).estimate_cost_in_usd_cents(), 764);
    }
  }

  mod real_requests {
    use super::*;

    fn test_session() -> AnyhowResult<Seedance2ProSession> {
      let cookies = get_test_cookies()?;
      Ok(Seedance2ProSession::from_cookies_string(cookies))
    }

    #[tokio::test]
    #[ignore] // manually test — requires real cookies
    async fn test_generate_text_to_video() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = GenerateVideoArgs {
        session: &session,
        model_type: ModelType::Seedance2Pro,
        prompt: "A corgi eating a cake in a fancy kitchen.".to_string(),
        resolution: Resolution::Square1x1,
        duration_seconds: 5,
        batch_count: BatchCount::One,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        use_face_blur_hack: None,
        host_override: None,
      };
      let result = generate_video(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2); // NB: Intentional failure to inspect output.
      Ok(())
    }

    #[tokio::test]
    #[ignore] // manually test — requires real cookies
    async fn test_generate_keyframe_video() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = GenerateVideoArgs {
        session: &session,
        model_type: ModelType::Seedance2Pro,
        prompt: "A dog shakes the glasses off its head. The camera pans out as the shiba shakes. The shiba barks.".to_string(),
        resolution: Resolution::Landscape16x9,
        duration_seconds: 5,
        batch_count: BatchCount::One,
        start_frame_url: Some("https://static.seedance2-pro.com/materials/20260219/1771496300184-fb32e08c.jpg".to_string()),
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        use_face_blur_hack: None,
        host_override: None,
      };
      let result = generate_video(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2); // NB: Intentional failure to inspect output.
      Ok(())
    }

    #[tokio::test]
    #[ignore] // manually test — requires real cookies
    async fn test_generate_reference_image_video() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = GenerateVideoArgs {
        session: &session,
        model_type: ModelType::Seedance2Pro,
        prompt: "The dog in @2 is in the office at @1 without the man. The office is dark and moonlight streams in through the windows. Particles of dust gleam in the moon beams. Suddenly, the dog jumps walks in front of the desk and barks.".to_string(),
        resolution: Resolution::Standard4x3,
        duration_seconds: 10,
        batch_count: BatchCount::One,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: Some(vec![
          "https://static.seedance2-pro.com/materials/20260219/1771463564512-b14bfe90.png".to_string(),
          "https://static.seedance2-pro.com/materials/20260219/1771496300184-fb32e08c.jpg".to_string(),
        ]),
        reference_video_urls: None,
        reference_audio_urls: None,
        use_face_blur_hack: None,
        host_override: None,
      };
      let result = generate_video(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2); // NB: Intentional failure to inspect output.
      Ok(())
    }

    #[tokio::test]
    #[ignore] // manually test — requires real cookies
    async fn test_generate_reference_video_only() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = GenerateVideoArgs {
        session: &session,
        model_type: ModelType::Seedance2Pro,
        prompt: "Change the Video @video1 to night time.".to_string(),
        resolution: Resolution::Landscape16x9,
        duration_seconds: 5,
        batch_count: BatchCount::One,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: Some(vec![
          "https://static.seedance2-pro.com/materials/20260315/1773594284659-3a46d231.mp4".to_string(),
        ]),
        reference_audio_urls: None,
        use_face_blur_hack: None,
        host_override: None,
      };
      let result = generate_video(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2); // NB: Intentional failure to inspect output.
      Ok(())
    }

    #[tokio::test]
    #[ignore] // manually test — requires real cookies
    async fn test_generate_reference_video_and_image() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = GenerateVideoArgs {
        session: &session,
        model_type: ModelType::Seedance2Pro,
        prompt: "Put the robot in @video1 next to the house in @image1".to_string(),
        resolution: Resolution::Landscape16x9,
        duration_seconds: 5,
        batch_count: BatchCount::One,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: Some(vec![
          "https://static.seedance2-pro.com/materials/20260315/1773595053724-07a1d500.png".to_string(),
        ]),
        reference_video_urls: Some(vec![
          "https://static.seedance2-pro.com/materials/20260315/1773594284659-3a46d231.mp4".to_string(),
        ]),
        reference_audio_urls: None,
        use_face_blur_hack: None,
        host_override: None,
      };
      let result = generate_video(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2); // NB: Intentional failure to inspect output.
      Ok(())
    }

    #[tokio::test]
    #[ignore] // manually test — requires real cookies and a test image
    async fn test_video_ref_file_that_is_too_long() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);

      // Step 1: Get a signed upload URL
      let cookies = get_test_cookies()?;
      let session = Seedance2ProSession::from_cookies_string(cookies);
      let prepare_args = PrepareFileUploadArgs {
        session: &session,
        extension: "mp4".to_string(),
        host_override: None,
      };
      let prepare_result = prepare_file_upload(prepare_args).await?;
      println!("Upload URL: {}", prepare_result.upload_url);

      // Step 2: Read a test image
      let file_bytes = fs::read("/Users/bt/Videos/Artcraft/Artcraft Best/ArtCraft Seedance Knight.mp4")?;
      println!("File size: {} bytes", file_bytes.len());

      // Step 3: Upload
      let upload_args = UploadFileArgs {
        upload_url: prepare_result.upload_url,
        file_bytes,
        host_override: None,
      };
      let result = upload_file(upload_args).await?;
      println!("Public URL: {}", result.public_url);

      let args = GenerateVideoArgs {
        session: &session,
        model_type: ModelType::Seedance2Pro,
        prompt: "Change @video1 to night time".to_string(),
        resolution: Resolution::Landscape16x9,
        duration_seconds: 5,
        batch_count: BatchCount::One,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: Some(vec![
          result.public_url,
        ]),
        reference_audio_urls: None,
        use_face_blur_hack: None,
        host_override: None,
      };
      let result = generate_video(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2); // NB: Intentional failure to inspect output.

      Ok(())
    }

    // --- Seedance 2 Fast tests ---

    #[tokio::test]
    #[ignore] // manually test — requires real cookies
    async fn test_fast_keyframe_with_start_frame() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      // Upload a start frame image from our CDN
      let image_bytes = crate::test_utils::http_download::http_download_to_bytes(
        test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL,
      ).await?;

      let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
        session: &session,
        extension: "jpg".to_string(),
        host_override: None,
      }).await?;

      let upload_result = upload_file(UploadFileArgs {
        upload_url: prepare_result.upload_url,
        file_bytes: image_bytes,
        host_override: None,
      }).await?;

      println!("Uploaded start frame: {}", upload_result.public_url);

      let args = GenerateVideoArgs {
        session: &session,
        model_type: ModelType::Seedance2Fast,
        prompt: "A corgi dog runs along the lake shore, splashing water. Camera follows.".to_string(),
        resolution: Resolution::Landscape16x9,
        duration_seconds: 5,
        batch_count: BatchCount::One,
        start_frame_url: Some(upload_result.public_url),
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        use_face_blur_hack: None,
        host_override: None,
      };
      let result = generate_video(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2); // NB: Intentional failure to inspect output.
      Ok(())
    }

    #[tokio::test]
    #[ignore] // manually test — requires real cookies
    async fn test_fast_three_image_references() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      // Upload three reference images from our CDN
      let image_urls_to_upload = [
        test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL,
        test_data::web::image_urls::WHITE_HOUSE_SUNSET_IMAGE_URL,
        test_data::web::image_urls::FOREST_BACKDROP_IMAGE_URL,
      ];

      let mut uploaded_urls = Vec::new();
      for (i, source_url) in image_urls_to_upload.iter().enumerate() {
        let image_bytes = crate::test_utils::http_download::http_download_to_bytes(source_url).await?;
        let ext = if source_url.ends_with(".png") { "png" } else { "jpg" };

        let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
          session: &session,
          extension: ext.to_string(),
          host_override: None,
        }).await?;

        let upload_result = upload_file(UploadFileArgs {
          upload_url: prepare_result.upload_url,
          file_bytes: image_bytes,
          host_override: None,
        }).await?;

        println!("Uploaded ref image {}: {}", i + 1, upload_result.public_url);
        uploaded_urls.push(upload_result.public_url);
      }

      let args = GenerateVideoArgs {
        session: &session,
        model_type: ModelType::Seedance2Fast,
        prompt: "The dog in @1 is running through the scenery in @3 towards the building in @2. Golden hour lighting.".to_string(),
        resolution: Resolution::Landscape16x9,
        duration_seconds: 5,
        batch_count: BatchCount::One,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: Some(uploaded_urls),
        reference_video_urls: None,
        reference_audio_urls: None,
        use_face_blur_hack: None,
        host_override: None,
      };
      let result = generate_video(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2); // NB: Intentional failure to inspect output.
      Ok(())
    }

    #[tokio::test]
    #[ignore] // manually test — requires real cookies
    async fn test_fast_audio_reference_with_text() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      // Upload a test audio file
      let audio_path = test_utils::test_file_path::test_file_path(
        "test_data/audio/mp3/super_mario_rpg_beware_the_forests_mushrooms.mp3",
      )?;
      let audio_bytes = fs::read(&audio_path)?;
      println!("Audio file size: {} bytes", audio_bytes.len());

      let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
        session: &session,
        extension: "mp3".to_string(),
        host_override: None,
      }).await?;

      let upload_result = upload_file(UploadFileArgs {
        upload_url: prepare_result.upload_url,
        file_bytes: audio_bytes,
        host_override: None,
      }).await?;

      println!("Uploaded audio: {}", upload_result.public_url);

      let args = GenerateVideoArgs {
        session: &session,
        model_type: ModelType::Seedance2Fast,
        prompt: "A fantasy forest with mushrooms glowing in the dark. Fireflies dance between the trees. A small character walks along a winding path.".to_string(),
        resolution: Resolution::Landscape16x9,
        duration_seconds: 5,
        batch_count: BatchCount::One,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: Some(vec![upload_result.public_url]),
        use_face_blur_hack: None,
        host_override: None,
      };
      let result = generate_video(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2); // NB: Intentional failure to inspect output.
      Ok(())
    }
  }
}
