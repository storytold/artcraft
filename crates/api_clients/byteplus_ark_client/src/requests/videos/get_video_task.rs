use crate::creds::ark_api_key::ArkApiKey;
use crate::error::ark_error::ArkError;
use crate::requests::ark_host::ARK_AP_SOUTHEAST_BASE_URL;
use crate::requests::http::send_json;
use crate::requests::videos::video_task_types::VideoTask;
use reqwest::Method;
use std::time::Duration;

const GET_VIDEO_TASK_TIMEOUT: Duration = Duration::from_secs(30);

/// `GET /contents/generations/tasks/{task_id}`. Poll until `status.is_terminal()`.
pub async fn get_video_task(api_key: &ArkApiKey, task_id: &str) -> Result<VideoTask, ArkError> {
  let url = format!("{}/contents/generations/tasks/{}", ARK_AP_SOUTHEAST_BASE_URL, task_id);
  send_json::<(), _>(api_key, Method::GET, &url, None, GET_VIDEO_TASK_TIMEOUT).await
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::requests::download_generated_file::download_generated_file;
  use crate::requests::videos::create_video_task::create_video_task;
  use crate::requests::videos::video_task_types::{CreateVideoTaskRequest, VideoContentItem, VideoTaskStatus};
  use std::time::Instant;

  const POLL_INTERVAL: Duration = Duration::from_secs(10);
  const MAX_WAIT: Duration = Duration::from_secs(900);
  const DOWNLOAD_ATTEMPTS: u32 = 5;

  // Generates ONE paid 5 second 480p Seedance 2.0 Fast video (no audio). Runs only when explicitly opted in:
  //   BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_GENERATION=1 [BYTEPLUS_LIVE_OUTPUT_DIR=/tmp/x] \
  //     cargo test -p byteplus_ark_client generates_one_seedance_video -- --ignored --nocapture
  #[tokio::test]
  #[ignore]
  async fn generates_one_seedance_video() {
    if std::env::var("BYTEPLUS_LIVE_GENERATION").as_deref() != Ok("1") {
      return;
    }
    let key = ArkApiKey::new(&std::env::var("BYTEPLUS_API_KEY").expect("set BYTEPLUS_API_KEY for live tests"));

    let request = CreateVideoTaskRequest {
      model: "dreamina-seedance-2-0-fast-260128".to_string(),
      content: vec![VideoContentItem::Text {
        text: "Steam slowly rises from a ceramic coffee mug on a wooden desk, soft morning light".to_string(),
      }],
      resolution: Some("480p".to_string()),
      ratio: Some("16:9".to_string()),
      duration: Some(5),
      generate_audio: Some(false),
      seed: None,
      camera_fixed: None,
      draft: None,
      watermark: false,
    };

    let started = Instant::now();
    let created = create_video_task(&key, &request).await.unwrap();
    println!("live seedance: task={} created", created.id);

    let task = loop {
      let task = get_video_task(&key, &created.id).await.unwrap();
      if task.status.is_terminal() {
        break task;
      }
      assert!(started.elapsed() < MAX_WAIT, "task {} still {:?} after {:?}", created.id, task.status, started.elapsed());
      tokio::time::sleep(POLL_INTERVAL).await;
    };

    assert_eq!(task.status, VideoTaskStatus::Succeeded, "task error: {:?}", task.error);
    let url = task.content.and_then(|content| content.video_url).expect("video url");
    let bytes = download_with_retries(&url).await;
    assert_eq!(bytes.get(4..8), Some(&b"ftyp"[..]), "expected an MP4 file");

    println!("live seedance: model={:?} bytes={} elapsed={:?}", task.model, bytes.len(), started.elapsed());

    if let Ok(dir) = std::env::var("BYTEPLUS_LIVE_OUTPUT_DIR") {
      let path = std::path::Path::new(&dir).join("live_seedance.mp4");
      std::fs::write(&path, &bytes).unwrap();
      println!("live seedance saved to {}", path.display());
    }
  }

  /// Result downloads can be reset by flaky networks; the app retries on its next poll, so do the same.
  async fn download_with_retries(url: &str) -> Vec<u8> {
    for attempt in 1..=DOWNLOAD_ATTEMPTS {
      match download_generated_file(url).await {
        Ok(bytes) => return bytes,
        Err(err) if attempt < DOWNLOAD_ATTEMPTS => {
          println!("live seedance: download attempt {} failed: {:?}", attempt, err);
          tokio::time::sleep(POLL_INTERVAL).await;
        }
        Err(err) => panic!("download failed after {} attempts: {:?}", DOWNLOAD_ATTEMPTS, err),
      }
    }
    unreachable!()
  }
}
