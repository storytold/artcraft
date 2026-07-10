use infer::Infer;
use std::sync::LazyLock;

pub (crate) static CUSTOM_INFER: LazyLock<Infer> = LazyLock::new(|| {
  let mut infer = Infer::new();
  add_custom_types(&mut infer);
  infer
});

fn add_custom_types(infer: &mut Infer) {
  infer.add("model/gltf-binary", "glb", gltf_matcher);
  infer.add("model/fbx", "fbx", fbx_matcher);
  infer.add("model/ply", "ply", ply_matcher);
}

fn gltf_matcher(buf: &[u8]) -> bool {
  // Magic is 'glTF' (103 108 84 70)
  // https://github.com/KhronosGroup/glTF/blob/main/extensions/1.0/Khronos/KHR_binary_glTF/README.md
  buf.len() >= 4 && buf[0] == 103 && buf[1] == 108 && buf[2] == 84 && buf[3] == 70
}

fn ply_matcher(buf: &[u8]) -> bool {
  // PLY files (ASCII and binary alike) start with the line "ply".
  // https://paulbourke.net/dataformats/ply/
  buf.len() >= 4
    && &buf[..3] == b"ply"
    && (buf[3] == b'\n' || buf[3] == b'\r')
}

fn fbx_matcher(buf: &[u8]) -> bool {
  // Binary FBX magic: "Kaydara FBX Binary  " (two trailing spaces).
  // https://code.blender.org/2013/08/fbx-binary-file-format-specification/
  // NB: ASCII FBX files have no magic and are not detected here.
  const FBX_MAGIC: &[u8] = b"Kaydara FBX Binary  ";
  buf.len() >= FBX_MAGIC.len() && &buf[..FBX_MAGIC.len()] == FBX_MAGIC
}

#[cfg(test)]
mod tests {
  use crate::custom::custom_infer::CUSTOM_INFER;
  use test_utils::test_file_path::test_file_path;

  #[test]
  fn test_gltf() -> anyhow::Result<()> {
    let path = test_file_path("test_data/3d/hanashi.glb")?;
    let maybe_type = CUSTOM_INFER.get_from_path(path)?.unwrap();
    assert_eq!(maybe_type.mime_type(), "model/gltf-binary");
    Ok(())
  }

  #[test]
  fn test_binary_fbx_magic() {
    let mut bytes = b"Kaydara FBX Binary  ".to_vec();
    bytes.extend_from_slice(&[0x00, 0x1a, 0x00]);
    let maybe_type = CUSTOM_INFER.get(&bytes).unwrap();
    assert_eq!(maybe_type.mime_type(), "model/fbx");
  }

  #[test]
  fn test_ply_magic() {
    let bytes = b"ply\nformat binary_little_endian 1.0\n".to_vec();
    let maybe_type = CUSTOM_INFER.get(&bytes).unwrap();
    assert_eq!(maybe_type.mime_type(), "model/ply");
  }

  #[test]
  fn test_ply_prefix_without_newline_is_not_detected() {
    let bytes = b"plywood texture".to_vec();
    assert!(CUSTOM_INFER.get(&bytes).is_none());
  }

  #[test]
  fn test_ascii_fbx_is_not_detected() {
    // ASCII FBX files have no magic bytes.
    let bytes = b"; FBX 7.3.0 project file".to_vec();
    assert!(CUSTOM_INFER.get(&bytes).is_none());
  }
}
