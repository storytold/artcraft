use crate::image_info::image_info_error::ImageInfoError;
use image::{GenericImageView, ImageReader};
use mimetypes::mimetype_info::file_extension::FileExtension;
use mimetypes::mimetype_info::mimetype_info::MimetypeInfo;
use std::io::Cursor;
use std::path::Path;

#[derive(Clone, Debug)]
pub struct ImageInfo {
  /// The mimetype we determined
  mimetype_info: MimetypeInfo,

  /// The width of the image in pixels
  width: u32,

  /// The height  of the image in pixels
  height: u32,
}

impl ImageInfo {
  /// Note: This has to do a full file read, and we throw the parsed image on the floor.
  pub fn decode_image_from_bytes(bytes: &[u8]) -> Result<Self, ImageInfoError> {
    let image = ImageReader::new(Cursor::new(bytes)).with_guessed_format()?.decode()?;
    let (width, height) = image.dimensions();
    Ok(ImageInfo {
      mimetype_info: MimetypeInfo::get_for_bytes(bytes)
          .ok_or_else(|| ImageInfoError::CouldNotDetermineMimetype)?,
      width,
      height,
    })
  }

  /// Note: This has to do a full file read, and we throw the parsed image on the floor.
  pub fn decode_image_from_path<P: AsRef<Path>>(path: P) -> Result<Self, ImageInfoError> {
    let image = ImageReader::open(&path)?.decode()?;
    let (width, height) = image.dimensions();
    Ok(ImageInfo {
      mimetype_info: MimetypeInfo::get_for_path(path)?
          .ok_or_else(|| ImageInfoError::CouldNotDetermineMimetype)?,
      width,
      height,
    })
  }

  pub fn width(&self) -> u32 {
    self.width
  }

  pub fn height(&self) -> u32 {
    self.height
  }

  pub fn dimensions(&self) -> (u32, u32) {
    (self.width, self.height)
  }

  pub fn mime_type(&self) -> &str {
    self.mimetype_info.mime_type()
  }

  pub fn file_extension(&self) -> Option<FileExtension> {
    self.mimetype_info.file_extension()
  }
}

#[cfg(test)]
mod tests {
  use crate::image_info::image_info::ImageInfo;
  use mimetypes::mimetype_info::file_extension::FileExtension;
  use test_utils::test_file_path::test_file_path;

  #[test]
  fn jpg_file() -> anyhow::Result<()> {
    let path = test_file_path("test_data/image/mochi.jpg")?;
    let info = ImageInfo::decode_image_from_path(path)?;
    assert_eq!(info.width(), 753);
    assert_eq!(info.height(), 1000);
    assert_eq!(info.mime_type(), "image/jpeg");
    let ext = info.file_extension().expect("should have extension");
    assert_eq!(ext, FileExtension::Jpg);
    assert_eq!(ext.extension_with_period(), ".jpg");
    assert_eq!(ext.extension_without_period(), "jpg");
    Ok(())
  }

  #[test]
  fn jpg_bytes() -> anyhow::Result<()> {
    let path = test_file_path("test_data/image/juno.jpg")?;
    let bytes = std::fs::read(path)?;
    let info = ImageInfo::decode_image_from_bytes(&bytes)?;
    assert_eq!(info.width(), 1000);
    assert_eq!(info.height(), 750);
    assert_eq!(info.mime_type(), "image/jpeg");
    let ext = info.file_extension().expect("should have extension");
    assert_eq!(ext, FileExtension::Jpg);
    assert_eq!(ext.extension_with_period(), ".jpg");
    assert_eq!(ext.extension_without_period(), "jpg");
    Ok(())
  }
}
