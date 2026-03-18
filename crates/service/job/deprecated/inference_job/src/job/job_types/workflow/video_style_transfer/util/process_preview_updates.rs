use chrono::Utc;
use log::debug;
use once_cell::sync::Lazy;
use r2d2_redis::r2d2::Pool;
use r2d2_redis::redis::Commands;
use r2d2_redis::RedisConnectionManager;
use std::cmp::PartialEq;
use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use url::Url;

use crate::job::job_types::workflow::video_style_transfer::util::preview_processor::bucket_uploader::{BucketUploadActorHandle, BucketUploadRequest, BucketUploadResult};
use crate::job::job_types::workflow::video_style_transfer::util::preview_processor::dir_walker::{DirWalker, PathBatch};
use bucket_paths::legacy::typified_paths::public::media_files::bucket_directory::MediaFileBucketDirectory;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::bucket_client::BucketClient;
use crockford::crockford_entropy_lower;
use redis_schema::keys::inference_job::style_transfer_progress_key::StyleTransferProgressKey;
use redis_schema::payloads::inference_job::style_transfer_progress_state::{InferenceProgressDetailsResponse, InferenceStageDetails};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokio::sync::{mpsc, oneshot};
use tokio::time::MissedTickBehavior;
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
  fn iter() -> Vec<PreviewStage> {
    vec![
      PreviewStage::FirstPass,
      PreviewStage::SecondPass,
      PreviewStage::FinalPass,
    ]
  }
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

#[derive(Clone, Debug)]
struct FrameStatesMap {
  inner: Arc<Mutex<FramesStatesMapInner>>,
}

#[derive(Debug)]
struct FramesStatesMapInner {
  data: HashMap<u32, PreviewFrameUploadResult>,
}

impl FrameStatesMap {
  fn new() -> Self {
    Self {
      inner: Arc::new(Mutex::new(FramesStatesMapInner {
        data: HashMap::new(),
      })),
    }
  }

  fn insert(&self, key: u32, value: PreviewFrameUploadResult) {
    let mut inner = self.inner.lock().unwrap();
    inner.data.insert(key, value);
  }

  fn get(&self, key: &u32) -> Option<PreviewFrameUploadResult> {
    let inner = self.inner.lock().unwrap();
    inner.data.get(key).copied()
  }

  fn len(&self) -> usize {
    let inner = self.inner.lock().unwrap();
    inner.data.len()
  }

  fn values(&self) -> Vec<PreviewFrameUploadResult> {
    let inner = self.inner.lock().unwrap();
    inner.data.values().copied().collect()
  }

  fn values_filtered(&self, filter: &PreviewFrameUploadResult) -> Vec<PreviewFrameUploadResult> {
    let inner = self.inner.lock().unwrap();
    inner.data.values().filter(|v| *v == filter).copied().collect()
  }

  fn keys_filtered(&self, filter: &PreviewFrameUploadResult) -> Vec<u32> {
    let inner = self.inner.lock().unwrap();
    inner.data.iter().filter(|(_, v)| **v == *filter).map(|(k, _)| *k).collect()
  }

  fn contains_key(&self, key: &u32) -> bool {
    let inner = self.inner.lock().unwrap();
    inner.data.contains_key(key)
  }
}

#[derive(Clone, Debug)]
struct StageDirectoryState {
  stage: PreviewStage,
  state: PreviewStageState,
  expected_frame_count: u32,
  entropy_prefix: String,

  bucket_directory: MediaFileBucketDirectory,
  frame_extension: Option<String>,
  frame_states: FrameStatesMap,
  bucket_upload_actor_handle: BucketUploadActorHandle
}


#[derive(Clone, Debug)]
struct StageStateMap {
  inner: Arc<Mutex<StageStateMapInner>>,
}

#[derive(Debug)]
struct StageStateMapInner {
  data: HashMap<PreviewStage, StageDirectoryState>,
}

impl StageStateMap {
  fn new() -> Self {
    Self {
      inner: Arc::new(Mutex::new(StageStateMapInner {
        data: HashMap::new(),
      })),
    }
  }

  fn insert(&self, key: PreviewStage, value: StageDirectoryState) {
    let mut inner = self.inner.lock().unwrap();
    inner.data.insert(key, value);
  }

  fn get(&self, key: &PreviewStage) -> Option<StageDirectoryState> {
    let inner = self.inner.lock().unwrap();
    inner.data.get(key).cloned()
  }

  fn with_mut<F>(&self, key: &PreviewStage, f: F)
  where
    F: FnOnce(&mut StageDirectoryState),
  {
    let mut inner = self.inner.lock().unwrap();
    if let Some(value) = inner.data.get_mut(key) {
      f(value);
    }
  }
}

pub struct PreviewProcessor {
  job_id: InferenceJobToken,
  stages: StageStateMap,
  state: PreviewState,
  base_directory: PathBuf,
  bucket_directory: MediaFileBucketDirectory,
  expected_frame_count: u32,
  redis_pool: Pool<RedisConnectionManager>,
  shutdown_receiver: oneshot::Receiver<()>,
}



impl StageDirectoryState {
  fn new(stage: PreviewStage,
         expected_frame_count: u32,
         media_file_bucket_directory: MediaFileBucketDirectory,
         entropy_prefix: String,
         bucket_upload_actor_handle: BucketUploadActorHandle,
         frame_extension: Option<String>) -> Self {
    Self {
      stage,
      state: PreviewStageState::Pending,
      expected_frame_count,
      frame_states: FrameStatesMap::new(),
      bucket_directory: media_file_bucket_directory,
      bucket_upload_actor_handle,
      entropy_prefix,
      frame_extension
    }
  }

  fn all_frames_uploaded(&self) -> bool {
    self.frame_states.len() == self.expected_frame_count as usize &&
      self.frame_states.values().iter().all(|state| *state == PreviewFrameUploadResult::UploadComplete)
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
    self.frame_states.keys_filtered(&PreviewFrameUploadResult::UploadComplete)
  }

  fn is_frame_upload_pending(&self, frame_number: &u32) -> bool {
    match self.frame_states.get(frame_number) {
      Some(s) => s != PreviewFrameUploadResult::UploadComplete,
      None => true,
    }
  }

  fn can_upload_frame(&self, frame_number: u32) -> bool {
    self.state == PreviewStageState::Pending &&
    self.is_frame_upload_pending(&frame_number)
  }

  fn default_frame_extension(&self) -> &str {
    match self.stage {
      PreviewStage::FirstPass => "jpg",
      PreviewStage::SecondPass => "jpg",
      PreviewStage::FinalPass => "jpg",
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


  async fn upload_frame_from_disk(&self, bucket_client: &BucketClient, frame_number: u32, disk_path: PathBuf) -> PreviewFrameUpdate {
    let local_file_extension = match disk_path.extension().and_then(|s| s.to_str()) {
      Some(e) => {
        if ALLOWED_TYPES_FRAMES.contains(e) {
          e
        } else {
          log::error!("Invalid extension in path: {:?}", disk_path);
          return PreviewFrameUpdate {
            stage: self.stage,
            state: PreviewFrameUploadResult::InvalidInputExtension,
            object_path: None,
            disk_path,
          };
        }
      }
      None => {
        log::error!("Invalid extension in path: {:?}", disk_path);
        return PreviewFrameUpdate {
          stage: self.stage,
          state: PreviewFrameUploadResult::InvalidInputExtension,
          object_path: None,
          disk_path,
        };
      }
    };

    let upload_file_extension = self.default_frame_extension();
    if local_file_extension != upload_file_extension {
      log::error!("Invalid extension in path: {:?}", disk_path);
      return PreviewFrameUpdate {
        stage: self.stage,
        state: PreviewFrameUploadResult::InvalidInputExtension,
        object_path: None,
        disk_path,
      };
    }

    let object_path = self.expected_media_file_object_path(frame_number);

    let disk_path2 = disk_path.clone();
    self.bucket_upload_actor_handle.upload_frame(disk_path, object_path.clone(), bucket_client.clone()).await;
    PreviewFrameUpdate {
      stage: self.stage,
      state: PreviewFrameUploadResult::UploadComplete,
      object_path: Some(object_path),
      disk_path: disk_path2,
    }
  }

  async fn upload_frame_from_disk_with_retry(&self, bucket_client: &BucketClient, frame_number: u32, disk_path: PathBuf) -> PreviewFrameUpdate {
    let mut retries = 0;
    loop {
      if retries > 3 {
        log::error!("Failed to upload frame after 3 retries: {:?}", disk_path);
        return PreviewFrameUpdate {
          stage: self.stage,
          state: PreviewFrameUploadResult::AttemptFailed,
          object_path: None,
          disk_path,
        };
      }
      let result = self.upload_frame_from_disk(bucket_client, frame_number, disk_path.clone()).await;
      if result.state == PreviewFrameUploadResult::UploadComplete {
        return result;
      } else {
        retries += 1;
        log::warn!("Retrying frame upload: {:?}", disk_path);
      }
    }
  }

  fn is_local_file_extension_valid(&self, disk_path: &PathBuf) -> bool {
    match disk_path.extension().and_then(|s| s.to_str()) {
      Some(e) => ALLOWED_TYPES_FRAMES.contains(e),
      None => false,
    }
  }


  async fn upload_multiple_frames_from_disk(&self, bucket_client: &BucketClient, frames: Vec<(u32, PathBuf)>) -> Vec<PreviewFrameUpdate> {
    let mut bucket_upload_requests = Vec::with_capacity(frames.len());
    let mut updates = Vec::with_capacity(frames.len());

    for (frame_number, disk_path) in frames.iter() {
      let local_file_extension = match disk_path.extension().and_then(|s| s.to_str()) {
        Some(e) => {
          if self.is_local_file_extension_valid(disk_path) {
            Ok(e)
          } else {
            log::error!("Invalid extension in path: {:?}", disk_path);
            Err(PreviewFrameUploadResult::InvalidInputExtension)
          }
        }
        None => {
          log::error!("Invalid extension in path: {:?}", disk_path);
          Err(PreviewFrameUploadResult::InvalidInputExtension)
        }
      };

      let upload_file_extension = self.default_frame_extension();
      if local_file_extension != Ok(upload_file_extension) {
        log::error!("Invalid extension in path: {:?}", disk_path);
        updates.push(
          PreviewFrameUpdate {
            stage: self.stage,
            state: PreviewFrameUploadResult::InvalidInputExtension,
            object_path: None,
            disk_path: disk_path.clone(),
          });
        continue;
      }
      let object_path = self.expected_media_file_object_path(*frame_number);
      bucket_upload_requests.push(BucketUploadRequest {
        disk_path: disk_path.clone(),
        bucket_path: object_path.clone(),
      });
    }

    let results = self.bucket_upload_actor_handle.upload_multiple_frames(bucket_upload_requests, bucket_client.clone()).await;
    for (disk_path, result) in results {
      match result {
        BucketUploadResult::Success => {
          updates.push(
            PreviewFrameUpdate {
              stage: self.stage,
              state: PreviewFrameUploadResult::UploadComplete,
              object_path: None,
              disk_path: disk_path.clone(),
            });
        }
        BucketUploadResult::Failure => {
          updates.push(
            PreviewFrameUpdate {
              stage: self.stage,
              state: PreviewFrameUploadResult::AttemptFailed,
              object_path: None,
              disk_path: disk_path.clone(),
            });
        }
      }
    }
    updates
  }

}




impl PreviewProcessor {
  pub fn new(
    inference_job_token: InferenceJobToken,
    redis_pool: r2d2_redis::r2d2::Pool<RedisConnectionManager>,
    base_directory: PathBuf,
    bucket_directory: MediaFileBucketDirectory,
    expected_frame_count: u32,
    shutdown_receiver: oneshot::Receiver<()>
  ) ->  Self {

    // This seems excessive _but_ these frames don't have a watermark yet _and_ the frame numbers make these enumerable
    let first_pass_entropy = crockford_entropy_lower(32);
    let second_pass_entropy = crockford_entropy_lower(32);
    let final_pass_entropy = crockford_entropy_lower(32);

    let first_pass_bucket_upload_actor = BucketUploadActorHandle::new();
    let second_pass_bucket_upload_actor = BucketUploadActorHandle::new();
    let final_pass_bucket_upload_actor = BucketUploadActorHandle::new();


    let first_pass_state = StageDirectoryState::new(PreviewStage::FirstPass, expected_frame_count, bucket_directory.clone(), first_pass_entropy, first_pass_bucket_upload_actor, None);
    let second_pass_state = StageDirectoryState::new(PreviewStage::SecondPass, expected_frame_count, bucket_directory.clone(), second_pass_entropy, second_pass_bucket_upload_actor, None);
    let final_pass_state = StageDirectoryState::new(PreviewStage::FinalPass, expected_frame_count, bucket_directory.clone(), final_pass_entropy, final_pass_bucket_upload_actor, None);

    let stages = StageStateMap::new();
    stages.insert(PreviewStage::FirstPass, first_pass_state);
    stages.insert(PreviewStage::SecondPass, second_pass_state);
    stages.insert(PreviewStage::FinalPass, final_pass_state);

    Self {
      job_id: inference_job_token,
      stages,
      state: PreviewState::Pending,
      base_directory,
      bucket_directory,
      expected_frame_count,
      redis_pool,
      shutdown_receiver,
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

  fn infer_frame_stage_and_number(&self, disk_path: &PathBuf) -> Option<(PreviewStage, u32)> {
    let relative_path = disk_path.strip_prefix(&self.base_directory);
    match relative_path {
      Ok(p) => {
        let parts: Vec<&str> = p.to_str().unwrap().split('/').collect();
        if parts.len() != 2 {
          return None;
        }
        let stage_name = parts[0];
        let frame_number = parts[1].split('.').next().unwrap();
        match frame_number.parse::<u32>() {
          Ok(n) => {
            match stage_name {
              "first_pass" => Some((PreviewStage::FirstPass, n)),
              "second_pass" => Some((PreviewStage::SecondPass, n)),
              "final_pass" => Some((PreviewStage::FinalPass, n)),
              _ => None,
            }
          }
          Err(_) => None,
        }
      }
      Err(_) => None,
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

  fn build_redis_update(&self) -> InferenceProgressDetailsResponse {
    let base_url = easyenv::get_env_string_or_default(
      "EPHEMERAL_BUCKET_BASE_URL",
      "https://cdn.storyteller.ai/studio",
    );
    InferenceProgressDetailsResponse {
      expected_stages: 3,
      // currently_active_stage: self.stages.iter().filter(|(_, state)| state.state == PreviewStageState::UploadComplete).count() as u32,
      currently_active_stage: 0,
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
              let url_str = format!("{}{}", base_url, object_path.get_full_object_path_str());
              Url::parse(&url_str).unwrap()
            }).collect()
          }
        }
      ).collect(),
    }
  }

  async fn persist_redis_update(&self) -> () {
    let base_url = easyenv::get_env_string_or_default(
      "EPHEMERAL_BUCKET_BASE_URL",
      "https://cdn.storyteller.ai/studio",
    );
    let mut redis = match self.redis_pool.get() {
      Ok(r) => r,
      Err(e) => {
        log::error!("Failed to get redis connection: {:?}", e);
        return;
      }
    };
    let status = InferenceProgressDetailsResponse {
      expected_stages: 3,
      // currently_active_stage: self.stages.iter().filter(|(_, state)| state.state == PreviewStageState::UploadComplete).count() as u32,
      currently_active_stage: 0,
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
              let url_str = format!("{}{}", base_url, object_path.get_full_object_path_str());
              Url::parse(&url_str).unwrap()
            }).collect()
          }
        }
      ).collect(),
    };

    let key = StyleTransferProgressKey::new_for_job_id(self.job_id.clone());
    let ttl = StyleTransferProgressKey::get_redis_ttl();
    let expire_at = ttl.num_seconds() as usize;

    let _r: String = redis.set_ex(key.to_string(), serde_json::to_string(&status).unwrap(), expire_at).unwrap();
  }

  pub async fn start_processing(&mut self, bucket_client: &BucketClient) -> () {
    let (frames_tx, mut frames_rx) = mpsc::channel(100);
    let walker = DirWalker::new_with_batch_size(self.base_directory.clone(), frames_tx.clone(), 30);
    let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(5));
    interval.set_missed_tick_behavior(MissedTickBehavior::Skip);
    loop {
      let walker = walker.clone();
      log::debug!("Processing preview frames loop ticked at {:?}", Utc::now());
      tokio::select! {
        _ = &mut self.shutdown_receiver => {
          log::info!("Shutting down preview processor");
          walker.walk().await;
          if frames_rx.len() > 0 {
            log::info!("Draining remaining frames");
            let mut frames = Vec::new();
            while let Some(frame_batch) = frames_rx.recv().await {
              match frame_batch {
                Ok(p) => {
                  frames.push(p);
                }
                Err(e) => {
                  log::error!("Error reading frame path: {:?}", e);
                }
              }
            }
            for frame_batch in frames {
              self.process_batch_upload(bucket_client, frame_batch).await;
            }
          }
          return;
        }
        Some(frame_batch) = frames_rx.recv() => {
          match frame_batch {
            Ok(p) => {
              log::debug!("Processing frame: {:?}", p);
              self.process_batch_upload(bucket_client, p).await;
            }
            Err(e) => {
              log::error!("Error reading frame path: {:?}", e);
            }
          }
        }
        _ = interval.tick() => {
          log::debug!("Processing preview frames ticked at {:?}", Utc::now());
          self.persist_redis_update().await;

          tokio::spawn(async move {
            walker.walk().await;
          });
        }

        else => {
          log::info!("No frames to process, returning");
      }
    }
    }
  }

  pub async fn process_upload(&mut self, bucket_client: &BucketClient, disk_path: PathBuf) -> () {
    if !self.is_disk_path_valid(&disk_path) {
      log::warn!("Invalid disk path: {:?}", disk_path);
      return;
    }
    let (stage, frame_number) = match self.infer_frame_stage_and_number(&disk_path) {
      Some((s, n)) => (s, n),
      None => {
        log::warn!("Invalid disk path: {:?}", disk_path);
        return;
      }
    };
  }

  async fn process_batch_upload(&mut self, bucket_client: &BucketClient, disk_paths: PathBatch) -> () {
    let mut paths_by_stage: HashMap<PreviewStage, Vec<(u32, PathBuf)>> = HashMap::new();
    for disk_path in disk_paths.get_paths() {
      if !self.is_disk_path_valid(&disk_path) {
        log::warn!("Invalid disk path: {:?}", disk_path);
        continue;
      }
      let (stage, frame_number) = match self.infer_frame_stage_and_number(&disk_path) {
        Some((s, n)) => (s, n),
        None => {
          log::warn!("Invalid disk path: {:?}", disk_path);
          continue;
        }
      };
      let stage_state = self.stages.get(&stage).unwrap();
      if !stage_state.is_frame_upload_pending(&frame_number) {
        log::debug!("Frame already uploaded: {:?}", disk_path);
        continue;
      }
      if !paths_by_stage.contains_key(&stage) {
        paths_by_stage.insert(stage, Vec::new());
      }
      paths_by_stage.get_mut(&stage).unwrap().push((frame_number, disk_path));
    }

    for (stage, paths) in paths_by_stage.iter() {
      let stage_state = self.stages.get(stage).unwrap();
      let updates = stage_state.upload_multiple_frames_from_disk(bucket_client, paths.clone()).await;
      for update in updates {
        if update.upload_complete() {
          let frame_number = self.infer_frame_number(&update.disk_path).unwrap();
          self.stages.with_mut(&stage, |stage_state| {
            stage_state.mark_frame_uploaded(frame_number);
            if stage_state.all_frames_uploaded() {
              stage_state.state = PreviewStageState::UploadComplete;
            }
          });
        }
      }
    }
  }

 async fn upload_frame_from_disk(&self, stage: PreviewStage, frame_number: u32, bucket_client: &BucketClient, disk_path: PathBuf) -> PreviewFrameUploadResult {
    let stage_state = self.stages.get(&stage).unwrap();
    if stage_state.state == PreviewStageState::UploadComplete {
      log::debug!("Skipped re-uploading frame: {:?}", disk_path);
      return PreviewFrameUploadResult::UploadComplete
    }
    if !stage_state.is_frame_upload_pending(&frame_number) {
      log::debug!("Frame already uploaded: {:?}", disk_path);
      return PreviewFrameUploadResult::UploadComplete
    }

    let result = stage_state.upload_frame_from_disk_with_retry(bucket_client, frame_number.clone(), disk_path).await;
    result.state
  }
}
