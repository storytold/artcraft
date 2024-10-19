use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::bucket_client::BucketClient;
use filesys::file_read_bytes::file_read_bytes;
use log::{debug, warn};
use std::path::PathBuf;
use std::time::Duration;
use tokio::sync::{mpsc, oneshot};
use tokio::task::JoinSet;

pub struct BucketUploadRequest {
  pub disk_path: PathBuf,
  pub bucket_path: MediaFileBucketPath,
}

pub enum BucketUploadResult {
  Success,
  Failure,
}

pub enum BucketUploadMessage {
  UploadFrame {
    disk_path: PathBuf,
    bucket_path: MediaFileBucketPath,
    bucket_client: BucketClient,
    result: oneshot::Sender<BucketUploadResult>
  },
  UploadMultipleFrames {
    requests: Vec<BucketUploadRequest>,
    bucket_client: BucketClient,
    result: oneshot::Sender<Vec<(PathBuf, BucketUploadResult)>>,
  },
}

pub enum BucketUploadMessageResponse {
  UploadSingleFrameResult(BucketUploadResult),
  UploadMultipleFramesResult(Vec<(PathBuf,BucketUploadResult)>),
}

struct BucketUploadActor {
  rx: mpsc::Receiver<BucketUploadMessage>,
}

fn handle_single_frame_upload(disk_path: PathBuf, bucket_path: MediaFileBucketPath, bucket_client: BucketClient) -> (PathBuf,BucketUploadResult) {
  let disk_path2 = disk_path.clone();
  let handle = tokio::runtime::Handle::current();
  let attempt = handle.block_on(
    bucket_client.upload_file(
      bucket_path.get_full_object_path_str(),
      &file_read_bytes(&disk_path2).unwrap(),
    )
  );
  // tokio::time::sleep(Duration::from_secs(1)).await;
  match attempt {
    Ok(_) => {
      debug!("Uploaded frame to bucket: {:?}", disk_path);
      (disk_path, BucketUploadResult::Success)
    }
    Err(e) => {
      warn!("Failed to upload frame to bucket: {:?}", e);
      (disk_path, BucketUploadResult::Failure)
    }
  }
}

impl BucketUploadActor {
  pub fn new(rx: mpsc::Receiver<BucketUploadMessage>) -> Self {
    Self {
      rx,
    }
  }
  

  pub async fn handle_message(&mut self, message: BucketUploadMessage) -> (){
    match message {
      BucketUploadMessage::UploadFrame { disk_path, bucket_path, bucket_client, result } => {
        let attempt = bucket_client.upload_file(
          bucket_path.get_full_object_path_str(),
          &file_read_bytes(&disk_path).unwrap(),
        ).await;
        match attempt {
          Ok(_) => {
            debug!("Uploaded frame to bucket: {:?}", disk_path);
            let _ = result.send(BucketUploadResult::Success);
          }
          Err(e) => {
            warn!("Failed to upload frame to bucket: {:?}", e);
            let _ = result.send(BucketUploadResult::Failure);
          }
        }
      }
      
      BucketUploadMessage::UploadMultipleFrames { requests, bucket_client, result } => {
        let max_concurrent_uploads = 50;
        let mut join_set:JoinSet<(PathBuf,BucketUploadResult)> = JoinSet::new();
        let mut results = vec![];
        for request in requests {
          while join_set.len() >= max_concurrent_uploads {
            let r = join_set.join_next().await.unwrap().unwrap();
            results.push(r);
          }
          let disk_path = request.disk_path;
          let bucket_path = request.bucket_path;
          let bucket_client = bucket_client.clone();

          join_set.spawn_blocking(move || {
            handle_single_frame_upload(disk_path, bucket_path, bucket_client)
          });
        }
        
        while join_set.len() > 0 {
          let r = join_set.join_next().await.unwrap().unwrap();
          results.push(r);
        }
        let _ = result.send(results);
      }
    }
  }
}

async fn run_bucket_upload_actor(mut actor: BucketUploadActor) -> () {
  while let Some(message) = actor.rx.recv().await {
    actor.handle_message(message).await;
  }
}

#[derive(Clone, Debug)]
pub struct BucketUploadActorHandle {
  tx: mpsc::Sender<BucketUploadMessage>,
}

impl BucketUploadActorHandle {
  pub fn new() -> Self {
    let (tx, rx) = mpsc::channel(500);
    let actor = BucketUploadActor::new(rx);
    tokio::spawn(async move {
      run_bucket_upload_actor(actor).await;
    });
    Self {
      tx,
    }
  }

  pub async fn upload_frame(&self, disk_path: PathBuf, bucket_path: MediaFileBucketPath, bucket_client: BucketClient) -> () {
    let (tx, rx) = oneshot::channel();
    let message = BucketUploadMessage::UploadFrame {
      disk_path,
      bucket_path,
      bucket_client,
      result: tx,
    };
    let _ = self.tx.send(message).await;
    let _ = rx.await;
  }
  
  pub async fn upload_multiple_frames(&self, requests: Vec<BucketUploadRequest>, bucket_client: BucketClient) -> Vec<(PathBuf,BucketUploadResult)> {
    let (tx, rx) = oneshot::channel();
    let message = BucketUploadMessage::UploadMultipleFrames {
      requests,
      bucket_client,
      result: tx,
    };
    let _ = self.tx.send(message).await;
    let results = rx.await.unwrap();
    results
  }
}
