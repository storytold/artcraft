
/// Track generation volume so we know which areas to focus efforts on.
/// But also note: https://en.wikipedia.org/wiki/Survivorship_bias
#[derive(Clone)]
pub struct ArtcraftUsageTrackerData {
  pub total_generation_count: u16,
  pub image_generation_count: u16,
  pub video_generation_count: u16,
  pub object_generation_count: u16,
  pub text_to_image_count: u16,
  pub image_to_image_count: u16,
  pub text_to_video_count: u16,
  pub image_to_video_count: u16,
  pub text_to_object_count: u16,
  pub image_to_object_count: u16,
  pub image_page_prompt_count: u16,
  pub video_page_prompt_count: u16,
  pub edit_page_prompt_count: u16,
  pub stage_page_prompt_count: u16,
  pub object_page_prompt_count: u16,
  pub other_page_prompt_count: u16,
}

impl ArtcraftUsageTrackerData {
  pub fn new() -> Self {
    Self {
      total_generation_count: 0,
      image_generation_count: 0,
      video_generation_count: 0,
      object_generation_count: 0,
      text_to_image_count: 0,
      image_to_image_count: 0,
      text_to_video_count: 0,
      image_to_video_count: 0,
      text_to_object_count: 0,
      image_to_object_count: 0,
      image_page_prompt_count: 0,
      video_page_prompt_count: 0,
      edit_page_prompt_count: 0,
      stage_page_prompt_count: 0,
      object_page_prompt_count: 0,
      other_page_prompt_count: 0,
    }
  }
}

