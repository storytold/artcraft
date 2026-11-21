use std::error::Error;
use std::fmt::{Display, Formatter};
use std::io;

#[derive(Debug)]
pub enum ImageInfoError {
  CouldNotDetermineMimetype,
  ImageError(image::ImageError),
  CodecError(craft_image_codecs::CodecError),
  IoError(io::Error),
}

impl Error for ImageInfoError {}

impl Display for ImageInfoError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      ImageInfoError::CouldNotDetermineMimetype => {
        write!(f, "ImageInfoError::CouldNotDetermineMimetype")
      },
      ImageInfoError::ImageError(err) => {
        write!(f, "ImageInfoError::ImageError: {}", err)
      },
      ImageInfoError::CodecError(err) => {
        write!(f, "ImageInfoError::CodecError: {}", err)
      },
      ImageInfoError::IoError(err) => {
        write!(f, "ImageInfoError::IoError: {}", err)
      },
    }
  }
}

impl From<image::ImageError> for ImageInfoError {
  fn from(err: image::ImageError) -> Self {
    ImageInfoError::ImageError(err)
  }
}

impl From<craft_image_codecs::CodecError> for ImageInfoError {
  fn from(err: craft_image_codecs::CodecError) -> Self {
    ImageInfoError::CodecError(err)
  }
}

impl From<io::Error> for ImageInfoError {
  fn from(err: io::Error) -> Self {
    ImageInfoError::IoError(err)
  }
}
