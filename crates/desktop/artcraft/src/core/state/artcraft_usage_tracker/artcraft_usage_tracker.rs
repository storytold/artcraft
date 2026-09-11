use crate::core::state::artcraft_usage_tracker::artcraft_usage_tracker_data::ArtcraftUsageTrackerData;
use std::sync::{Arc, LockResult, RwLock};
use log::{error, warn};
use crate::core::artcraft_error::ArtcraftError;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_type::{ArtcraftUsagePage, ArtcraftUsageType};

/// Track generation volume so we know which areas to focus efforts on.
/// But also note: https://en.wikipedia.org/wiki/Survivorship_bias
#[derive(Clone)]
pub struct ArtcraftUsageTracker {
  data: Arc<RwLock<ArtcraftUsageTrackerData>>,
}


impl ArtcraftUsageTracker {
  pub fn new() -> Self {
    Self {
      data: Arc::new(RwLock::new(ArtcraftUsageTrackerData::new())),
    }
  }
  
  pub fn record_image_generation(&self, num_images: u16, usage_type: ArtcraftUsageType, page: ArtcraftUsagePage) -> Result<(), ArtcraftError> {
    let mut data = self.get()?;
    data.total_generation_count += num_images;
    data.image_generation_count += num_images;
    match usage_type {
      ArtcraftUsageType::TextToResult => {
        data.text_to_image_count += num_images;
      }
      ArtcraftUsageType::ImageToResult => {
        data.image_to_image_count += num_images;
      }
      ArtcraftUsageType::Other => {}
    }
    match page {
      ArtcraftUsagePage::ImagePage => {
        data.image_page_prompt_count += num_images;
      }
      ArtcraftUsagePage::EditPage => {
        data.edit_page_prompt_count += num_images;
      }
      ArtcraftUsagePage::StagePage => {
        data.stage_page_prompt_count += num_images;
      }
      ArtcraftUsagePage::OtherPage => {
        data.other_page_prompt_count += num_images;
      }
      ArtcraftUsagePage::VideoPage => {} // NB: Does not generate images.
      ArtcraftUsagePage::ObjectPage => {} // NB: Does not generate images.
    }
    self.set(data)?;
    Ok(())
  }
  
  pub fn record_video_generation(&self, num_videos: u16, usage_type: ArtcraftUsageType, page: ArtcraftUsagePage) -> Result<(), ArtcraftError> {
    let mut data = self.get()?;
    data.total_generation_count += num_videos;
    data.video_generation_count += num_videos;
    match usage_type {
      ArtcraftUsageType::TextToResult => {
        data.text_to_video_count += num_videos;
      }
      ArtcraftUsageType::ImageToResult => {
        data.image_to_video_count += num_videos;
      }
      ArtcraftUsageType::Other => {}
    }
    match page {
      ArtcraftUsagePage::VideoPage => {
        data.video_page_prompt_count += num_videos;
      }
      ArtcraftUsagePage::OtherPage => {
        data.other_page_prompt_count += num_videos;
      }
      ArtcraftUsagePage::ImagePage => {} // NB: Does not generate videos.
      ArtcraftUsagePage::EditPage => {} // NB: Does not generate videos.
      ArtcraftUsagePage::StagePage => {} // NB: Does not generate videos.
      ArtcraftUsagePage::ObjectPage => {} // NB: Does not generate videos.
    }
    self.set(data)?;
    Ok(())
  }
  
  pub fn record_object_generation(&self, num_objects: u16, usage_type: ArtcraftUsageType, page: ArtcraftUsagePage) -> Result<(), ArtcraftError> {
    let mut data = self.get()?;
    data.total_generation_count += num_objects;
    data.object_generation_count += num_objects;
    match usage_type {
      ArtcraftUsageType::TextToResult => {
        data.text_to_object_count += num_objects;
      }
      ArtcraftUsageType::ImageToResult => {
        data.image_to_object_count += num_objects;
      }
      ArtcraftUsageType::Other => {}
    }
    match page {
      ArtcraftUsagePage::ObjectPage => {
        data.object_page_prompt_count += num_objects;
      }
      ArtcraftUsagePage::OtherPage => {
        data.other_page_prompt_count += num_objects;
      }
      ArtcraftUsagePage::ImagePage => {} // NB: Does not generate objects.
      ArtcraftUsagePage::VideoPage => {} // NB: Does not generate objects.
      ArtcraftUsagePage::EditPage => {} // NB: Does not generate objects.
      ArtcraftUsagePage::StagePage => {} // NB: Does not generate objects.
    }
    self.set(data)?;
    Ok(())
  }
  
  pub fn get(&self) -> Result<ArtcraftUsageTrackerData, ArtcraftError> {
    match self.data.read() {
      Ok(data) => Ok(data.clone()),
      Err(err) => {
        error!("Lock read error: {:?}", err);
        Err(ArtcraftError::RwLockReadError)
      }
    }
  }
  
  fn set(&self, data: ArtcraftUsageTrackerData) -> Result<(), ArtcraftError> {
    match self.data.write() {
      Ok(mut lock) => {
        *lock = data;
        Ok(())
      },
      Err(err) => {
        error!("Lock write error: {:?}", err);
        Err(ArtcraftError::RwLockWriteError)
      }
    }
  }
}
