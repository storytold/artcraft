use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;

pub fn get_image_url(job_id: &str, image_index: u8) -> Result<String, MidjourneyError> {
  if image_index > 3 {
    return Err(MidjourneyClientError::InvalidImageIndex.into())
  }
  Ok(format!("https://cdn.midjourney.com/{}/0_{}.png", job_id, image_index))
}
