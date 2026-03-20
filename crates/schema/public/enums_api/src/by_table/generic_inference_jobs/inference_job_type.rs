#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Report certain jobs publicly as different from what we actually run.
/// This is so we have an edge against the competition that might try to run
/// the same models or workflows.
///
/// Previously named `PublicInferenceJobType` in the `enums_public` crate.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, Default, ToSchema, Debug)]
#[serde(rename_all = "snake_case")]
pub enum InferenceJobType {
  // ======= Renamed enum variants  ======

  /// Instead of DB `InferenceJobType::LivePortrait` ("live_portrait")
  ActingFace,

  /// Instead of DB `InferenceJobType::FaceFusion` ("face_fusion")
  Lipsync,

  /// Storyteller Studio and Video Style Transfer Jobs.
  VideoRender,

  GptSovits,

  #[serde(rename = "f5_tts")]
  F5TTS,

  // ======= Everything else is the same =======

  #[serde(rename = "fal_queue")]
  FalQueue,

  #[deprecated(note = "Use VideoRender instead.")]
  ComfyUi,

  #[serde(rename = "studio_gen2")]
  StudioGen2,

  #[serde(rename = "convert_fbx_gltf")]
  ConvertFbxToGltf,

  MocapNet,

  #[serde(rename = "rvc_v2")]
  RvcV2,

  SadTalker,

  #[serde(rename = "seed_vc")]
  SeedVc,

  SoVitsSvc,

  StableDiffusion,

  #[serde(rename = "styletts2")]
  StyleTTS2,

  Tacotron2,

  #[default]
  Unknown,

  #[deprecated(note = "This was for Bevy engine's server side rendering.")]
  #[serde(rename = "bevy_to_workflow")]
  BevyToWorkflow,

  #[deprecated(note = "This was for ReRenderAVideo, which we never productionized.")]
  RerenderAVideo,

  #[serde(rename = "image_gen_api")]
  ImageGenApi,

  #[serde(rename = "seedance2pro_queue")]
  Seedance2ProQueue,

  #[serde(rename = "worldlabs_queue")]
  WorldlabsQueue,
}

impl InferenceJobType {
  pub fn from_db(db_value: enums_db::by_table::generic_inference_jobs::inference_job_type::InferenceJobType) -> Self {
    use enums_db::by_table::generic_inference_jobs::inference_job_type::InferenceJobType as Db;
    match db_value {
      // Renamed variants
      Db::LivePortrait => Self::ActingFace,
      Db::FaceFusion => Self::Lipsync,
      // Conserved variants
      Db::FalQueue => Self::FalQueue,
      Db::VideoRender => Self::VideoRender,
      Db::GptSovits => Self::GptSovits,
      Db::F5TTS => Self::F5TTS,
      Db::ComfyUi => Self::ComfyUi,
      Db::StudioGen2 => Self::StudioGen2,
      Db::ConvertFbxToGltf => Self::ConvertFbxToGltf,
      Db::MocapNet => Self::MocapNet,
      Db::RvcV2 => Self::RvcV2,
      Db::SadTalker => Self::SadTalker,
      Db::SeedVc => Self::SeedVc,
      Db::SoVitsSvc => Self::SoVitsSvc,
      Db::StableDiffusion => Self::StableDiffusion,
      Db::StyleTTS2 => Self::StyleTTS2,
      Db::Tacotron2 => Self::Tacotron2,
      Db::Unknown => Self::Unknown,
      Db::BevyToWorkflow => Self::BevyToWorkflow,
      Db::RerenderAVideo => Self::RerenderAVideo,
      Db::ImageGenApi => Self::ImageGenApi,
      Db::Seedance2ProQueue => Self::Seedance2ProQueue,
      Db::WorldlabsQueue => Self::WorldlabsQueue,
    }
  }

  pub fn to_db(&self) -> enums_db::by_table::generic_inference_jobs::inference_job_type::InferenceJobType {
    use enums_db::by_table::generic_inference_jobs::inference_job_type::InferenceJobType as Db;
    match self {
      // Renamed variants
      Self::ActingFace => Db::LivePortrait,
      Self::Lipsync => Db::FaceFusion,
      // Conserved variants
      Self::FalQueue => Db::FalQueue,
      Self::VideoRender => Db::VideoRender,
      Self::GptSovits => Db::GptSovits,
      Self::F5TTS => Db::F5TTS,
      Self::ComfyUi => Db::ComfyUi,
      Self::StudioGen2 => Db::StudioGen2,
      Self::ConvertFbxToGltf => Db::ConvertFbxToGltf,
      Self::MocapNet => Db::MocapNet,
      Self::RvcV2 => Db::RvcV2,
      Self::SadTalker => Db::SadTalker,
      Self::SeedVc => Db::SeedVc,
      Self::SoVitsSvc => Db::SoVitsSvc,
      Self::StableDiffusion => Db::StableDiffusion,
      Self::ImageGenApi => Db::ImageGenApi,
      Self::Seedance2ProQueue => Db::Seedance2ProQueue,
      Self::WorldlabsQueue => Db::WorldlabsQueue,
      Self::StyleTTS2 => Db::StyleTTS2,
      Self::Tacotron2 => Db::Tacotron2,
      Self::Unknown => Db::Unknown,
      Self::BevyToWorkflow => Db::BevyToWorkflow,
      Self::RerenderAVideo => Db::RerenderAVideo,
    }
  }
}

#[cfg(test)]
mod tests {
  use strum::IntoEnumIterator;
  use enums_shared::test_helpers::to_json;
  use super::*;

  fn override_enums() -> &'static [InferenceJobType; 2] {
    &[
      InferenceJobType::ActingFace,
      InferenceJobType::Lipsync,
    ]
  }

  mod override_values {
    use super::*;

    #[test]
    fn acting_face() {
      use enums_db::by_table::generic_inference_jobs::inference_job_type::InferenceJobType as Db;
      assert_eq!(InferenceJobType::ActingFace.to_db(), Db::LivePortrait);
      assert_eq!(to_json(&InferenceJobType::ActingFace.to_db()), "live_portrait");
      assert_eq!(InferenceJobType::from_db(Db::LivePortrait), InferenceJobType::ActingFace);
      assert_eq!(to_json(&InferenceJobType::from_db(Db::LivePortrait)), "acting_face");
    }

    #[test]
    fn lipsync() {
      use enums_db::by_table::generic_inference_jobs::inference_job_type::InferenceJobType as Db;
      assert_eq!(InferenceJobType::Lipsync.to_db(), Db::FaceFusion);
      assert_eq!(to_json(&InferenceJobType::Lipsync.to_db()), "face_fusion");
      assert_eq!(InferenceJobType::from_db(Db::FaceFusion), InferenceJobType::Lipsync);
      assert_eq!(to_json(&InferenceJobType::from_db(Db::FaceFusion)), "lipsync");
    }
  }

  mod mechanical_checks {
    use enums_db::by_table::generic_inference_jobs::inference_job_type::InferenceJobType as Db;
    use super::*;

    #[test]
    fn public_to_internal() {
      let mut tested_count = 0;
      for public_variant in InferenceJobType::iter() {
        match public_variant {
          InferenceJobType::ActingFace | InferenceJobType::Lipsync => continue,
          _ => {}
        }
        assert_eq!(public_variant, InferenceJobType::from_db(public_variant.to_db()));
        let internal_enum_string = to_json(&public_variant.to_db());
        let public_enum_string = to_json(&public_variant);
        assert_eq!(internal_enum_string, public_enum_string);
        tested_count += 1;
      }
      assert!(tested_count > 1);
      assert_eq!(tested_count, InferenceJobType::iter().len() - override_enums().len());
    }

    #[test]
    fn internal_to_public() {
      let mut tested_count = 0;
      for internal_variant in Db::all_variants() {
        match internal_variant {
          Db::LivePortrait | Db::FaceFusion => continue,
          _ => {}
        }
        assert_eq!(internal_variant, InferenceJobType::from_db(internal_variant).to_db());
        let public_enum_string = to_json(&InferenceJobType::from_db(internal_variant));
        let internal_enum_string = to_json(&internal_variant);
        assert_eq!(internal_enum_string, public_enum_string);
        tested_count += 1;
      }
      assert!(tested_count > 1);
      assert_eq!(tested_count, Db::all_variants().len() - override_enums().len());
    }
  }
}
