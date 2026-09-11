use crate::custom::custom_infer::CUSTOM_INFER;
use crate::mimetype_info::file_extension::FileExtension;
use infer::Type;
use std::io;
use std::path::Path;

#[derive(Clone, Debug)]
pub struct MimetypeInfo {
  /// The mimetype we determined
  mime_type: String,

  /// The extension for the mimetype, if we could determine it.
  file_extension: Option<FileExtension>,
}

impl MimetypeInfo {
  pub fn get_for_bytes(bytes: &[u8]) -> Option<Self> {
    CUSTOM_INFER.get(bytes)
        .map(|t| Self::for_type(t))
  }

  pub fn get_for_path<P: AsRef<Path>>(path: P) -> io::Result<Option<Self>> {
    CUSTOM_INFER.get_from_path(path)
        .map(|maybe_type| maybe_type.map(|t| Self::for_type(t)))
  }

  fn for_type(r#type: Type) -> Self {
    let mime_type = r#type.mime_type().to_string();
    MimetypeInfo {
      file_extension: FileExtension::from_mimetype(&mime_type),
      mime_type,
    }
  }

  pub fn mime_type(&self) -> &str {
    &self.mime_type
  }

  pub fn file_extension(&self) -> Option<FileExtension> {
    self.file_extension
  }
}

#[cfg(test)]
mod tests {
  use crate::mimetype_info::file_extension::FileExtension;
  use crate::mimetype_info::mimetype_info::MimetypeInfo;

  mod for_bytes {
    use super::*;

    #[test]
    fn png() {
      // NB: From "Hanashi Mask.png"
      let bytes: Vec<u8> = vec![137, 80, 78, 71, 13, 10, 26, 10];
      let t = MimetypeInfo::get_for_bytes(&bytes).expect("should detect bytes");
      assert_eq!(t.mime_type(), "image/png");
      let ext = t.file_extension.expect("should have extension");
      assert_eq!(ext, FileExtension::Png);
      assert_eq!(ext.extension_with_period(), ".png");
      assert_eq!(ext.extension_without_period(), "png");
    }
  }

  mod for_files {
    use super::*;
    use test_utils::test_file_path::test_file_path;

    #[test]
    fn mp3() -> anyhow::Result<()> {
      let path = test_file_path("test_data/audio/mp3/super_mario_rpg_beware_the_forests_mushrooms.mp3")?;
      let t = MimetypeInfo::get_for_path(path)?.expect("should detect type");
      assert_eq!(t.mime_type(), "audio/mpeg");
      let ext = t.file_extension.expect("should have extension");
      assert_eq!(ext, FileExtension::Mp3);
      assert_eq!(ext.extension_with_period(), ".mp3");
      assert_eq!(ext.extension_without_period(), "mp3");
      Ok(())
    }

    #[test]
    fn glb() -> anyhow::Result<()> {
      let path = test_file_path("test_data/3d/hanashi.glb")?;
      let t = MimetypeInfo::get_for_path(path)?.expect("should detect type");
      assert_eq!(t.mime_type(), "model/gltf-binary");
      let ext = t.file_extension.expect("should have extension");
      assert_eq!(ext, FileExtension::Glb);
      assert_eq!(ext.extension_with_period(), ".glb");
      assert_eq!(ext.extension_without_period(), "glb");
      Ok(())
    }
  }
}
