use std::error::Error;
use std::fmt::{Display, Formatter};

#[derive(Debug)]
pub enum ImagesError {
  IoError(std::io::Error),
  ImageError(image::ImageError),
  CodecError(craft_image_codecs::CodecError),
}

impl Error for ImagesError {}

impl Display for ImagesError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      ImagesError::IoError(err) => write!(f, "IO Error: {}", err),
      ImagesError::ImageError(err) => write!(f, "Image Error: {}", err),
      ImagesError::CodecError(err) => write!(f, "Codec Error: {}", err),
    }
  }
}

impl From<std::io::Error> for ImagesError {
  fn from(err: std::io::Error) -> Self {
    ImagesError::IoError(err)
  }
}

impl From<image::ImageError> for ImagesError {
  fn from(err: image::ImageError) -> Self {
    ImagesError::ImageError(err)
  }
}

impl From<craft_image_codecs::CodecError> for ImagesError {
  fn from(err: craft_image_codecs::CodecError) -> Self {
    ImagesError::CodecError(err)
  }
}
