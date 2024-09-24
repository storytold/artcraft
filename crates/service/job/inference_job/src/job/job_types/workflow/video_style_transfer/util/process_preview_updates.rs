use std::cmp::PartialEq;
use std::collections::{HashMap, HashSet};
use std::ops::Add;
use std::path::PathBuf;

use chrono::Utc;
use log::{debug, info, warn};
use once_cell::sync::Lazy;
use r2d2_redis::r2d2::PooledConnection;
use r2d2_redis::redis::Commands;
use r2d2_redis::RedisConnectionManager;
use url::Url;

use buckets::public::media_files::bucket_directory::MediaFileBucketDirectory;
use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::bucket_client::BucketClient;
use crockford::crockford_entropy_lower;
use filesys::file_read_bytes::file_read_bytes;
use jobs_common::redis_job_status_logger::RedisPool;
use redis_schema::keys::inference_job::style_transfer_progress_key::StyleTransferProgressKey;
use redis_schema::payloads::inference_job::style_transfer_progress_state::{InferenceProgressDetailsResponse, InferenceStageDetails};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

static ALLOWED_TYPES_FRAMES : Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    "jpg",
    "jpeg",
    "png",
  ])
});

#[derive(Hash,PartialEq, Eq, Copy, Clone, Debug)]
enum PreviewStage {
  FirstPass,
  SecondPass,
  FinalPass,
}
impl PreviewStage {
  fn expected_directory_name(&self) -> &'static str {
    match self {
      PreviewStage::FirstPass => "first_pass",
      PreviewStage::SecondPass => "second_pass",
      PreviewStage::FinalPass => "final_pass",
    }
  }
}

#[derive(PartialEq, Eq, Copy, Clone, Debug)]
enum PreviewFrameUploadResult {
  UploadComplete, // This is the final state!
  AttemptFailed,
  InvalidInputName, // We can't upload this file
  InvalidInputExtension,
  // We haven't run into this yet, and we probably never do
  // but the frontend has no defences against poor/missing frames
  // so we'll do our best to announce it.
  UnfathomableError,
}

pub struct PreviewFrameUpdate {
  stage: PreviewStage,
  frame_number: u32,
  state: PreviewFrameUploadResult,
  disk_path: PathBuf,
  object_path: Option<MediaFileBucketPath>
}

impl PreviewFrameUpdate {
  pub fn upload_complete(&self) -> bool {
    self.state == PreviewFrameUploadResult::UploadComplete
  }
}

#[derive(PartialEq, Eq, Copy, Clone, Debug)]
enum PreviewStageState {
  Pending,
  UploadComplete,
  Failed,
}

#[derive(PartialEq, Eq, Copy, Clone, Debug)]
enum PreviewState {
  Pending,
  Ready,
  Published,
  Failed,
}
struct StageDirectoryState {
  stage: PreviewStage,
  state: PreviewStageState,
  base_directory: PathBuf,
  expected_frame_count: u32,
  entropy_prefix: String,

  bucket_directory: MediaFileBucketDirectory,
  frame_extension: Option<String>,
  frame_states: HashMap<u32, PreviewFrameUploadResult>,
}

pub struct PreviewProcessor {
  job_id: InferenceJobToken,
  stages: HashMap<PreviewStage, StageDirectoryState>,
  state: PreviewState,
  base_directory: PathBuf,
  bucket_directory: MediaFileBucketDirectory,
  expected_frame_count: u32,
  redis: PooledConnection<RedisConnectionManager>
}

impl StageDirectoryState {
  fn new(stage: PreviewStage, base_directory: PathBuf, expected_frame_count: u32, media_file_bucket_directory: MediaFileBucketDirectory, entropy_prefix: String, frame_extension: Option<String>) -> Self {
    Self { stage, state: PreviewStageState::Pending, base_directory, expected_frame_count, frame_states: HashMap::new(), bucket_directory: media_file_bucket_directory, entropy_prefix, frame_extension}
  }

  fn all_frames_uploaded(&self) -> bool {
    self.frame_states.len() == self.expected_frame_count as usize &&
      self.frame_states.values().all(|state| *state == PreviewFrameUploadResult::UploadComplete)
  }

  fn mark_frame_uploaded(&mut self, frame_number: u32) {
    self.frame_states.insert(frame_number, PreviewFrameUploadResult::UploadComplete);
  }

  fn mark_frame_upload_attempt_failed(&mut self, frame_number: u32) {
    self.frame_states.insert(frame_number, PreviewFrameUploadResult::AttemptFailed);
  }

  fn pending_frames(&self) -> Vec<u32> {
    (0..self.expected_frame_count).filter(|frame_number| {
      !self.frame_states.contains_key(frame_number)
    }).collect()
  }

  fn successfully_uploaded_frames(&self) -> Vec<u32> {
    (0..self.expected_frame_count).filter(|frame_number| {
      match self.frame_states.get(frame_number) {
        Some(s) => *s == PreviewFrameUploadResult::UploadComplete,
        None => false,
      }
    }).collect()
  }

  fn is_frame_upload_pending(&self, frame_number: &u32) -> bool {
    let state = self.frame_states.get(&frame_number);
    match state {
      Some(s) => *s != PreviewFrameUploadResult::UploadComplete,
      None => true,
    }
  }

  fn default_frame_extension(&self) -> &str {
    match self.stage {
      PreviewStage::FirstPass => "jpg",
      PreviewStage::SecondPass => "jpg",
      PreviewStage::FinalPass => "jpg",
    }
  }

  fn is_disk_path_valid(&self, disk_path: &PathBuf) -> bool {
    let relative_path = disk_path.strip_prefix(&self.base_directory);
    match relative_path {
      Ok(p) => {
        let path_str = p.to_str().unwrap();
        let parts: Vec<&str> = path_str.split('/').collect();
        if parts.len() != 2 {
          debug!("Invalid path: {:?} - wrong length", disk_path);
          return false;
        }
        let frame_number = parts[1].split('.').next().unwrap();
        match frame_number.parse::<u32>() {
          Ok(_) => true,
          Err(_) => {
            debug!("Invalid path: {:?} - frame number not a number", disk_path);
            false
          }
        }
      }
      Err(_) => {
        debug!("Invalid path: {:?} - not a valid prefix", disk_path);
        false
      }
    }
  }

  fn expected_media_file_object_path(&self, frame_number: u32) -> MediaFileBucketPath {
    let frame_prefix = format!("frame_{}", frame_number);
    let frame_suffix = format!(".{}", self.default_frame_extension());
    let frame_object_name = format!(
      "/{}/{}/{}{}",
      self.entropy_prefix,
      self.stage.expected_directory_name(),
      frame_prefix,
      frame_suffix
    );
    MediaFileBucketPath::from_object_hash(
      self.bucket_directory.get_object_hash(),
      None,
      Some(&frame_object_name),
    )
  }

  fn all_object_paths (&self) -> Vec<MediaFileBucketPath> {
    let frame_numbers = self.successfully_uploaded_frames();
    frame_numbers.into_iter().map(|frame_number| {
      self.expected_media_file_object_path(frame_number)
    }).collect()
  }

  async fn upload_frame_from_disk(&mut self, bucket_client: &BucketClient, frame_number: u32, disk_path: PathBuf) -> PreviewFrameUpdate {
    let local_file_extension = match disk_path.extension().and_then(|s| s.to_str()) {
      Some(e) => {
        if ALLOWED_TYPES_FRAMES.contains(e) {
          e
        } else {
          log::error!("Invalid extension in path: {:?}", disk_path);
          return PreviewFrameUpdate { stage: self.stage, frame_number, state: PreviewFrameUploadResult::InvalidInputExtension, disk_path, object_path: None };
        }
      }
      None => {
        log::error!("Invalid extension in path: {:?}", disk_path);
        return PreviewFrameUpdate { stage: self.stage, frame_number, state: PreviewFrameUploadResult::InvalidInputExtension, disk_path, object_path: None };
      }
    };

    let upload_file_extension = self.default_frame_extension();
    if local_file_extension != upload_file_extension {
      log::error!("Invalid extension in path: {:?}", disk_path);
      return PreviewFrameUpdate { stage: self.stage, frame_number, state: PreviewFrameUploadResult::InvalidInputExtension, disk_path, object_path: None };
    }

    let file_contents = file_read_bytes(&disk_path);

    match file_contents {
      Ok(contents) => {
        debug!("Preview frames directory has file: {:?}", disk_path.as_os_str());

        let object_path = self.expected_media_file_object_path(frame_number);
        let attempt = bucket_client.upload_file(
          object_path.get_full_object_path_str(),
          &contents,
        ).await;

        match attempt {
          Ok(_) => {
            info!("Uploaded frame {} to bucket", frame_number);
            self.mark_frame_uploaded(frame_number);
            PreviewFrameUpdate { stage: self.stage, frame_number, state: PreviewFrameUploadResult::UploadComplete, disk_path, object_path: Some(object_path) }
          }
          Err(e) => {
            warn!("Failed to upload frame {} to bucket: {:?}", frame_number, e);
            self.mark_frame_upload_attempt_failed(frame_number);
            PreviewFrameUpdate { stage: self.stage, frame_number, state: PreviewFrameUploadResult::AttemptFailed, disk_path, object_path: None }
          }
        }
      },
      Err(e) => {
        warn!("Failed to read frame {} from disk: {:?}", frame_number, e);
        self.mark_frame_upload_attempt_failed(frame_number);
        PreviewFrameUpdate { stage: self.stage, frame_number, state: PreviewFrameUploadResult::AttemptFailed, disk_path, object_path: None }
      }
    }
  }

}

impl PreviewProcessor {
  pub fn new(inference_job_token: InferenceJobToken, redis: PooledConnection<RedisConnectionManager>, base_directory: PathBuf, bucket_directory: MediaFileBucketDirectory, expected_frame_count: u32) -> Self {

    // This seems excessive _but_ these frames don't have a watermark yet _and_ the frame numbers make these enumerable
    let first_pass_entropy = crockford_entropy_lower(32);
    let second_pass_entropy = crockford_entropy_lower(32);
    let final_pass_entropy = crockford_entropy_lower(32);

    let first_pass_state = StageDirectoryState::new(PreviewStage::FirstPass, base_directory.clone(), expected_frame_count, bucket_directory.clone(), first_pass_entropy, None);
    let second_pass_state = StageDirectoryState::new(PreviewStage::SecondPass, base_directory.clone(), expected_frame_count, bucket_directory.clone(), second_pass_entropy, None);
    let final_pass_state = StageDirectoryState::new(PreviewStage::FinalPass, base_directory.clone(), expected_frame_count, bucket_directory.clone(), final_pass_entropy, None);

    let mut stages = HashMap::new();
    stages.insert(PreviewStage::FirstPass, first_pass_state);
    stages.insert(PreviewStage::SecondPass, second_pass_state);
    stages.insert(PreviewStage::FinalPass, final_pass_state);

    Self { job_id: inference_job_token, stages, state: PreviewState::Pending, base_directory, bucket_directory, expected_frame_count, redis}
  }
  fn infer_preview_stage(&self, disk_path: &PathBuf) -> Option<PreviewStage> {
    let relative_path = disk_path.strip_prefix(&self.base_directory);
    match relative_path {
      Ok(p) => {
        let parts: Vec<&str> = p.to_str().unwrap().split('/').collect();
        if parts.len() != 2 {
          return None;
        }
        let stage_name = parts[0];
        match stage_name {
          "first_pass" => Some(PreviewStage::FirstPass),
          "second_pass" => Some(PreviewStage::SecondPass),
          "final_pass" => Some(PreviewStage::FinalPass),
          _ => None,
        }
      }
      Err(_) => None,
    }
  }

  fn infer_frame_number(&self, disk_path: &PathBuf) -> Option<u32> {
    let relative_path = disk_path.strip_prefix(&self.base_directory);
    match relative_path {
      Ok(p) => {
        let parts: Vec<&str> = p.to_str().unwrap().split('/').collect();
        if parts.len() != 2 {
          return None;
        }
        let frame_number = parts[1].split('.').next().unwrap();
        match frame_number.parse::<u32>() {
          Ok(n) => Some(n),
          Err(_) => None,
        }
      }
      Err(_) => None,
    }
  }

  async fn persist_redis_update(&mut self) {
    let base_url = easyenv::get_env_string_or_default(
      "EPHEMERAL_BUCKET_BASE_URL",
      "https://cdn.storyteller.ai/studio",
    );
    let status = InferenceProgressDetailsResponse {
      expected_stages: 3,
      currently_active_stage: self.stages.iter().filter(|(_, state)| state.state == PreviewStageState::UploadComplete).count() as u32,
      per_stage_frame_count: self.expected_frame_count,
      stages:
      vec![PreviewStage::FirstPass, PreviewStage::SecondPass, PreviewStage::FinalPass].iter().map(
        |stage| {
          let state = self.stages.get(stage).unwrap();
          InferenceStageDetails {
            stage_progress: state.frame_states.len() as u32,
            expected_frame_count: self.expected_frame_count,
            stage_complete: state.all_frames_uploaded(),
            frames: state.all_object_paths().iter().map(|object_path| {
              let url_str = format!("{}/{}", base_url, object_path.get_full_object_path_str());
              Url::parse(&url_str).unwrap()
            }).collect()
          }
        }
      ).collect(),
    };

    let key = StyleTransferProgressKey::new_for_job_id(self.job_id.clone());
    let ttl = StyleTransferProgressKey::get_redis_ttl();
    let expire_at = ttl.num_seconds() as usize;


    let _r: String = self.redis.set_ex(key.to_string(), serde_json::to_string(&status).unwrap(), expire_at).unwrap();
  }

  pub async fn process_frame_from_disk(&mut self, bucket_client: &BucketClient, disk_path: PathBuf) -> () {
    let stage = match self.infer_preview_stage(&disk_path) {
      Some(s) => s,
      None => {
        log::error!("Invalid stage in path: {:?}", disk_path);
        return;
      }
    };
    let frame_number = match self.infer_frame_number(&disk_path) {
      Some(n) => n.clone(),
      None => {
        log::error!("Invalid frame number in path: {:?}", disk_path);
        return;
      }
    };
    let stage_state = self.stages.get_mut(&stage).unwrap();
    if stage_state.state == PreviewStageState::UploadComplete {
      log::debug!("Skipped re-uploading frame: {:?}", disk_path);
      return;
    }
    if !stage_state.is_frame_upload_pending(&frame_number) {
      log::debug!("Frame already uploaded: {:?}", disk_path);
      return;
    }
    if !stage_state.is_disk_path_valid(&disk_path) {
      log::warn!("Invalid disk path: {:?}", disk_path);
      return;
    }

    let result = stage_state.upload_frame_from_disk(bucket_client, frame_number.clone(), disk_path).await;
    if result.state == PreviewFrameUploadResult::UploadComplete {
      // (KS): We can add frames one at a time but for now Comfy is generating all frames at once
      // so this check helps
      log::info!("Frame upload complete: {:?} for stage {:?}", result.frame_number, stage);
      if stage_state.all_frames_uploaded() {
        stage_state.state = PreviewStageState::UploadComplete;
      }
    }
    log::info!("Pending frames for stage {:?}: {:?}", stage, stage_state.pending_frames());
    self.persist_redis_update().await;
  }
}
