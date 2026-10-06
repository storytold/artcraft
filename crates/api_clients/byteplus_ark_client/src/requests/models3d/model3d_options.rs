/// Output options for Hyper3D Rodin Gen-2. ModelArk takes them as `--name value` flags appended
/// to the text content item; unset options use the model defaults (PBR, Quad mesh, GLB).
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Hyper3dOptions {
  pub maybe_material: Option<Hyper3dMaterial>,
  pub maybe_mesh_mode: Option<Hyper3dMeshMode>,
  /// Face count. Raw mesh: 500..=1_000_000; Quad mesh: 1_000..=200_000.
  pub maybe_quality_override: Option<u32>,
  /// 4K instead of 2K textures.
  pub high_pack_textures: bool,
  pub maybe_hd_texture: Option<bool>,
  pub maybe_file_format: Option<Model3dFileFormat>,
  pub maybe_use_original_alpha: Option<bool>,
  /// Humanoids: force a T/A pose.
  pub maybe_ta_pose: Option<bool>,
}

/// Output options for Hitem3D 2.0, sent as `--name value` flags.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Hitem3dOptions {
  pub maybe_resolution: Option<Hitem3dResolution>,
  /// Face count, 100_000..=2_000_000.
  pub maybe_face_count: Option<u32>,
  /// Hitem3D returns a zipped OBJ when unset; send `Glb` to get a GLB.
  pub maybe_file_format: Option<Model3dFileFormat>,
  pub maybe_request_type: Option<Hitem3dRequestType>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Hyper3dMaterial {
  Pbr,
  Shaded,
  All,
  None,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Hyper3dMeshMode {
  Quad,
  Raw,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Model3dFileFormat {
  Obj,
  Glb,
  Stl,
  Fbx,
  Usdz,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Hitem3dResolution {
  Standard1536,
  Pro1536,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Hitem3dRequestType {
  GeometryOnly,
  GeometryAndTextures,
}

impl Hyper3dOptions {
  pub fn to_flags(&self) -> String {
    let mut flags = Flags::default();
    flags.push("material", self.maybe_material.map(|material| match material {
      Hyper3dMaterial::Pbr => "PBR",
      Hyper3dMaterial::Shaded => "Shaded",
      Hyper3dMaterial::All => "All",
      Hyper3dMaterial::None => "None",
    }));
    flags.push("mesh_mode", self.maybe_mesh_mode.map(|mode| match mode {
      Hyper3dMeshMode::Quad => "Quad",
      Hyper3dMeshMode::Raw => "Raw",
    }));
    flags.push("quality_override", self.maybe_quality_override);
    flags.push("addons", self.high_pack_textures.then_some("HighPack"));
    flags.push("hd_texture", self.maybe_hd_texture);
    flags.push("fileformat", self.maybe_file_format.map(Model3dFileFormat::extension));
    flags.push("use_original_alpha", self.maybe_use_original_alpha);
    flags.push("TAPose", self.maybe_ta_pose);
    flags.into_string()
  }
}

impl Hitem3dOptions {
  pub fn to_flags(&self) -> String {
    let mut flags = Flags::default();
    flags.push("resolution", self.maybe_resolution.map(|resolution| match resolution {
      Hitem3dResolution::Standard1536 => "1536",
      Hitem3dResolution::Pro1536 => "1536pro",
    }));
    flags.push("face", self.maybe_face_count);
    flags.push("ff", self.maybe_file_format.map(Model3dFileFormat::hitem3d_code));
    flags.push("request_type", self.maybe_request_type.map(|request_type| match request_type {
      Hitem3dRequestType::GeometryOnly => 1,
      Hitem3dRequestType::GeometryAndTextures => 3,
    }));
    flags.into_string()
  }
}

impl Model3dFileFormat {
  /// File extension, which is also the Hyper3D `--fileformat` value.
  pub fn extension(self) -> &'static str {
    match self {
      Self::Obj => "obj",
      Self::Glb => "glb",
      Self::Stl => "stl",
      Self::Fbx => "fbx",
      Self::Usdz => "usdz",
    }
  }

  fn hitem3d_code(self) -> u8 {
    match self {
      Self::Obj => 1,
      Self::Glb => 2,
      Self::Stl => 3,
      Self::Fbx => 4,
      Self::Usdz => 5,
    }
  }
}

#[derive(Default)]
struct Flags(Vec<String>);

impl Flags {
  fn push(&mut self, name: &str, maybe_value: Option<impl ToString>) {
    if let Some(value) = maybe_value {
      self.0.push(format!("--{} {}", name, value.to_string()));
    }
  }

  fn into_string(self) -> String {
    self.0.join(" ")
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  mod hyper3d {
    use super::*;

    #[test]
    fn defaults_send_no_flags() {
      assert_eq!(Hyper3dOptions::default().to_flags(), "");
    }

    #[test]
    fn renders_the_documented_flag_names() {
      let options = Hyper3dOptions {
        maybe_material: Some(Hyper3dMaterial::Pbr),
        maybe_mesh_mode: Some(Hyper3dMeshMode::Raw),
        maybe_quality_override: Some(500_000),
        high_pack_textures: true,
        maybe_hd_texture: Some(true),
        maybe_file_format: Some(Model3dFileFormat::Glb),
        maybe_use_original_alpha: Some(false),
        maybe_ta_pose: Some(false),
      };
      assert_eq!(
        options.to_flags(),
        "--material PBR --mesh_mode Raw --quality_override 500000 --addons HighPack --hd_texture true --fileformat glb --use_original_alpha false --TAPose false",
      );
    }
  }

  mod hitem3d {
    use super::*;

    #[test]
    fn defaults_send_no_flags() {
      assert_eq!(Hitem3dOptions::default().to_flags(), "");
    }

    #[test]
    fn uses_numeric_file_format_and_request_type_codes() {
      let options = Hitem3dOptions {
        maybe_resolution: Some(Hitem3dResolution::Pro1536),
        maybe_face_count: Some(2_000_000),
        maybe_file_format: Some(Model3dFileFormat::Glb),
        maybe_request_type: Some(Hitem3dRequestType::GeometryAndTextures),
      };
      assert_eq!(options.to_flags(), "--resolution 1536pro --face 2000000 --ff 2 --request_type 3");
    }
  }
}
