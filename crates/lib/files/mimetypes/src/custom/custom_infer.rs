use infer::Infer;
use std::sync::LazyLock;

pub (crate) static CUSTOM_INFER: LazyLock<Infer> = LazyLock::new(|| {
  let mut infer = Infer::new();
  add_custom_types(&mut infer);
  infer
});

fn add_custom_types(infer: &mut Infer) {
  infer.add("model/gltf-binary", "glb", gltf_matcher);
}

fn gltf_matcher(buf: &[u8]) -> bool {
  // Magic is 'glTF' (103 108 84 70)
  // https://github.com/KhronosGroup/glTF/blob/main/extensions/1.0/Khronos/KHR_binary_glTF/README.md
  buf.len() >= 4 && buf[0] == 103 && buf[1] == 108 && buf[2] == 84 && buf[3] == 70
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
}
