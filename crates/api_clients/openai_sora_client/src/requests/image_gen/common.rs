use crate::requests::common::task_id::TaskId;

#[derive(Debug, Clone)]
pub struct SoraImageGenResponse {
  pub task_id: TaskId,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NumImages {
  One,
  Two,
  Four
}

impl NumImages {
  pub fn as_count(&self) -> usize {
    match self {
      NumImages::One => 1,
      NumImages::Two => 2,
      NumImages::Four => 4,
    }
  }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ImageSize {
  Square,
  Wide,
  Tall,
}

impl ImageSize {
  // TODO: Verify these dimensions. 480x480 is correct.
  pub fn as_dimensions(&self) -> (u16, u16) {
    match self {
      ImageSize::Square => (480, 480),
      ImageSize::Wide => (854, 480),
      ImageSize::Tall => (480, 854),
    }
  }

  pub fn as_width(&self) -> u16 {
    self.as_dimensions().0
  }

  pub fn as_height(&self) -> u16 {
    self.as_dimensions().1
  }
}
