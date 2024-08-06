use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use url::Url;

use errors::{anyhow, AnyhowResult};
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

use crate::keys::inference_job::style_transfer_progress_key::StyleTransferProgressKey;

#[derive(Serialize, Deserialize)]
pub struct InferenceStageDetails {
  pub stage_progress: u32,
  pub expected_frame_count: u32,
  pub stage_complete: bool,
  pub frames: Vec<Url>,
}


#[derive(Serialize, Deserialize)]
pub struct InferenceProgressDetailsResponse {
  pub expected_stages: u32,
  pub currently_active_stage: u32,
  pub per_stage_frame_count: u32,
  pub stages: Vec<InferenceStageDetails>,
}

pub struct InferenceProgressDetailsPayload {
  pub key: StyleTransferProgressKey,
  pub maybe_payload: Option<InferenceProgressDetailsResponse>,
}

impl InferenceProgressDetailsPayload {

  pub fn for_job_id(token: InferenceJobToken) -> Self {
    let key = StyleTransferProgressKey::new_for_job_id(token);

    Self {
      key,
      maybe_payload: None,
    }
  }

}

impl InferenceStageDetails {
  pub fn new(stage_progress: u32, expected_frame_count: u32, stage_complete: bool, frames: Vec<Url>) -> Self {
    Self {
      stage_progress,
      expected_frame_count,
      stage_complete,
      frames,
    }
  }



  fn to_redis_hkey_map(&self) -> HashMap<String, String> {
    let mut map = HashMap::new();
    map.insert("stage_progress".to_string(), self.stage_progress.to_string());
    map.insert("expected_frame_count".to_string(), self.expected_frame_count.to_string());
    map.insert("stage_complete".to_string(), self.stage_complete.to_string());
    let frames = self.frames.iter().map(|url| url.to_string()).collect::<Vec<String>>();
    map.insert("frames".to_string(), frames.join(","));
    map
  }

  fn from_redis_hkey_map(map: HashMap<String, String>) -> AnyhowResult<Self> {
    let stage_progress = map.get("stage_progress").ok_or_else(|| anyhow!("No stage_progress"))?.parse()?;
    let expected_frame_count = map.get("expected_frame_count").ok_or_else(|| anyhow!("No expected_frame_count"))?.parse()?;
    let stage_complete = map.get("stage_complete").ok_or_else(|| anyhow!("No stage_complete"))?.parse()?;
    let frames = map.get("frames").ok_or_else(|| anyhow!("No frames"))?.split(",").map(|url| Url::parse(url).unwrap()).collect::<Vec<Url>>();
    Ok(Self {
      stage_progress,
      expected_frame_count,
      stage_complete,
      frames,
    })
  }

  fn serialize_payload(&self) -> AnyhowResult<Vec<(String, String)>> {
    let map = self.to_redis_hkey_map();
    Ok(map.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
  }

  fn hydrate_from_vec(values: HashMap<String, String>) -> AnyhowResult<Self> {
    let map = values.iter().map(|(k, v)| (k.clone(), v.clone())).collect::<HashMap<String, String>>();
    Self::from_redis_hkey_map(map)
  }
}


