use crate::mimetype_for_file::read_head;
use crate::mimetype_info::file_extension::FileExtension;
use craft_sniff::Kind;
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
    craft_sniff::identify(bytes)
        .map(Self::for_kind)
  }

  pub fn get_for_path<P: AsRef<Path>>(path: P) -> io::Result<Option<Self>> {
    let head = read_head(path)?;
    Ok(Self::get_for_bytes(&head))
  }

  fn for_kind(kind: Kind) -> Self {
    let mime_type = kind.mime_type().to_string();
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

    #[test]
    fn binary_fbx() {
      let t = MimetypeInfo::get_for_bytes(b"Kaydara FBX Binary  \x00\x1a\x00").expect("should detect bytes");
      assert_eq!(t.mime_type(), "model/fbx");
      assert_eq!(t.file_extension(), Some(FileExtension::Fbx));
    }

    #[test]
    fn ply() {
      let t = MimetypeInfo::get_for_bytes(b"ply\nformat binary_little_endian 1.0\n").expect("should detect bytes");
      assert_eq!(t.mime_type(), "model/ply");
      assert_eq!(t.file_extension(), Some(FileExtension::Ply));
    }

    #[test]
    fn wav_and_flac_have_extensions() {
      let mut wav = b"RIFF\x24\x00\x00\x00WAVEfmt ".to_vec();
      wav.extend_from_slice(&[0; 8]);
      let t = MimetypeInfo::get_for_bytes(&wav).expect("should detect bytes");
      assert_eq!(t.mime_type(), "audio/wav");
      assert_eq!(t.file_extension(), Some(FileExtension::Wav));

      let t = MimetypeInfo::get_for_bytes(b"fLaC\x00\x00\x00\x22").expect("should detect bytes");
      assert_eq!(t.mime_type(), "audio/flac");
      assert_eq!(t.file_extension(), Some(FileExtension::Flac));
    }

    #[test]
    fn signatureless_formats_are_not_detected() {
      // ASCII FBX has no magic bytes, and "ply" must be its own line.
      assert!(MimetypeInfo::get_for_bytes(b"; FBX 7.3.0 project file").is_none());
      assert!(MimetypeInfo::get_for_bytes(b"plywood texture").is_none());
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
