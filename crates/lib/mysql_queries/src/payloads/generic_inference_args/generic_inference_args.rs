use crate::payloads::generic_inference_args::inner_payloads::f5_tts_payload::F5TTSPayload;
use crate::payloads::generic_inference_args::inner_payloads::face_fusion_payload::FaceFusionPayload;
use crate::payloads::generic_inference_args::inner_payloads::gptsovits_payload::GptSovitsPayload;
use crate::payloads::generic_inference_args::inner_payloads::image_generation_payload::StableDiffusionArgs;
use crate::payloads::generic_inference_args::inner_payloads::lipsync_payload::LipsyncArgs;
use crate::payloads::generic_inference_args::inner_payloads::live_portrait_payload::LivePortraitPayload;
use crate::payloads::generic_inference_args::inner_payloads::mocap_payload::MocapArgs;
use crate::payloads::generic_inference_args::inner_payloads::render_engine_scene_to_video_payload::RenderEngineSceneToVideoArgs;
use crate::payloads::generic_inference_args::inner_payloads::tts_payload::TTSArgs;
use crate::payloads::generic_inference_args::inner_payloads::videofilter_payload::RerenderArgs;
use crate::payloads::generic_inference_args::inner_payloads::workflow_payload::WorkflowArgs;
use errors::AnyhowResult;

/// Used to encode extra state for the `generic_inference_jobs` table.
/// This should act somewhat like a serialized protobuf stored inside a record.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GenericInferenceArgs {
  /// The category of inference (probably also present in a top-level field)
  #[serde(rename = "cat")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to consume fewer bytes
  #[serde(alias = "inference_category")]
  pub inference_category: Option<InferenceCategoryAbbreviated>,

  /// REQUIRED.
  /// Actual type-specific arguments.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub args: Option<PolymorphicInferenceArgs>,
}

/// Same as `InferenceCategory`, but serialized in fewer characters
/// Do not change the values.
#[derive(Clone, Copy, Debug, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
pub enum InferenceCategoryAbbreviated {
  #[serde(rename = "la")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "lipsync_animation")]
  LipsyncAnimation,

  #[serde(rename = "tts")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "text_to_speech")]
  TextToSpeech,

  #[serde(rename = "vc")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "voice_conversion")]
  VoiceConversion,

  #[serde(rename = "vf")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "video_filter")]
  VideoFilter,

  #[serde(rename = "ig")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "image_generation")]
  ImageGeneration,

  #[serde(rename = "mc")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "mocap")]
  Mocap,

  #[serde(rename = "wf")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "workflow")]
  Workflow,

  #[serde(rename = "lp")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "live_portrait")]
  LivePortrait,

  #[serde(rename = "ff")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "face_fusion")]
  FaceFusion,

  #[serde(rename = "fc")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "format_conversion")]
  FormatConversion,

  #[serde(rename = "bw")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "convert_bvh_to_workflow")]
  ConvertBvhToWorkflow,

  #[serde(rename = "gs")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  #[serde(alias = "gpt_sovits")]
  GptSovits
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug)]
pub enum FundamentalFrequencyMethodForJob {
  #[serde(rename = "r")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  Rmvpe,
  #[serde(rename = "c")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  Crepe,
  #[serde(rename = "d")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  Dio,
  #[serde(rename = "h")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
  Harvest,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum PolymorphicInferenceArgs {
  /// Lipsync Animation (Short name to save  space when serializing)
  /// This is SadTalker, not Wav2Lip.
  La (LipsyncArgs),

  /// Text to speech. (Short name to save space when serializing.)
  Tts(TTSArgs),
    // No arguments yet.
    // It might be best to just not include this when not used.
    
  /// Voice conversion. (Short name to save space when serializing.)
  Vc {
    /// Argument for so-vits-svc
    /// The python model defaults to true, but that sounds awful,
    /// so we default to false unless specified.
    #[serde(rename = "a")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
    #[serde(skip_serializing_if = "Option::is_none")]
    auto_predict_f0: Option<bool>,

    /// Argument for RVC (-fm / --f0_method)
    /// Crepe, dio, harvest, etc.
    /// If unspecified, the model defaults to crepe
    #[serde(rename = "fm")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
    #[serde(skip_serializing_if = "Option::is_none")]
    override_f0_method: Option<FundamentalFrequencyMethodForJob>,

    /// Argument for so-vits-svc (-t / --transpose)
    /// Argument for RVC (--f0_up_key)
    /// Pitch control.
    /// If unspecified, the model uses "0".
    #[serde(rename = "t")] // NB: DO NOT CHANGE. It could break live jobs. Renamed to be fewer bytes.
    #[serde(skip_serializing_if = "Option::is_none")]
    transpose: Option<i32>,
  },

  /// Rerender a video. (Short name to save space when serializing.)
  Rr(RerenderArgs),

  /// Image generation. (Short name to save space when serializing.)
  Ig(StableDiffusionArgs),

  /// Mocap (Short name to save space when serializing.)
  Mc(MocapArgs),

  /// ComfyUI (Short name to save space when serializing.)
  Cu(WorkflowArgs),

  /// ComfyUI (Short name to save space when serializing.)
  Lp(LivePortraitPayload),

  /// Face Fusion
  Ff(FaceFusionPayload),

  /// Render engine scene to video args
  Es(RenderEngineSceneToVideoArgs),

  /// GPT Sovits
  Gs(GptSovitsPayload),

  Ft(F5TTSPayload),
}

impl GenericInferenceArgs {

  pub fn from_json(json: &str) -> AnyhowResult<Self> {
    Ok(serde_json::from_str(json)?)
  }

  pub fn to_json(&self) -> AnyhowResult<String> {
    Ok(serde_json::to_string(self)?)
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::{media_files::MediaFileToken, model_weights::ModelWeightToken};

  use crate::payloads::generic_inference_args::generic_inference_args::{FundamentalFrequencyMethodForJob, GenericInferenceArgs, InferenceCategoryAbbreviated, PolymorphicInferenceArgs};
  use crate::payloads::generic_inference_args::inner_payloads::image_generation_payload::StableDiffusionArgs;
  use crate::payloads::generic_inference_args::inner_payloads::lipsync_payload::{LipsyncAnimationAudioSource, LipsyncAnimationImageSource, LipsyncArgs};
  use crate::payloads::generic_inference_args::inner_payloads::tts_payload::TTSArgs;

  #[test]
  fn typical_lipsync_animation_args_serialize() {
    let args = GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::LipsyncAnimation),
      args: Some(PolymorphicInferenceArgs::La(LipsyncArgs {
        maybe_audio_source: Some(LipsyncAnimationAudioSource::U("foo".to_string())),
        maybe_image_source: Some(LipsyncAnimationImageSource::F("bar".to_string())),
        maybe_face_enhancer: None,
        maybe_pose_style: None,
        maybe_preprocess: None,
        maybe_make_still: None,
        maybe_remove_watermark: None,
        maybe_resize_width: None,
        maybe_resize_height: None,
      })),
    };

    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json, r#"{"cat":"la","args":{"La":{"a":{"U":"foo"},"i":{"F":"bar"}}}}"#.to_string());

    // NB: Make sure we don't overflow the DB field capacity (TEXT column).
    assert!(json.len() < 1000);
  }

  #[test]
  fn typical_tts_args_serialize() {
    let args = GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::TextToSpeech),
      args: Some(PolymorphicInferenceArgs::Tts(TTSArgs {
        voice_token: Some("token".to_string()),
        dataset_token: None,
      })),
    };

    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json, r#"{"cat":"tts","args":{"Tts":{"vt":"token"}}}"#.to_string());

    // NB: Make sure we don't overflow the DB field capacity (TEXT column).
    assert!(json.len() < 1000);
  }

  #[test]
  fn typical_image_gen_args_serialize() {

    let video_media_token = MediaFileToken("video_media_token".to_string());
    let image_media_token = MediaFileToken("image_media_token".to_string());
    let sd_model_token = ModelWeightToken("sd_model_token".to_string());
    let lora_model_token = ModelWeightToken("lora_model_token".to_string());

    let prompt = "prompt".to_string();
    let a_prompt = "a_prompt".to_string();
    let n_prompt = "n_prompt".to_string();
    let seed = 1;
    let upload_path = "upload_path".to_string();
    let lora_upload_path = "lora_upload_path".to_string();
    let checkpoint = "checkpoint".to_string();
    let type_of_inference = "type_of_inference".to_string();
    let version: u32 = 0;

    let args = GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::ImageGeneration),
      args: Some(PolymorphicInferenceArgs::Ig(StableDiffusionArgs {
        maybe_sd_model_token: Some(sd_model_token),
        maybe_lora_model_token: Some(lora_model_token),
        maybe_sampler: Some("sampler".to_string()),
        maybe_height: Some(512),
        maybe_width: Some(512),
        maybe_cfg_scale: Some(7),
        maybe_prompt: Some(prompt),
        maybe_n_prompt: Some(n_prompt),
        maybe_batch_count: Some(1),
        maybe_number_of_samples: Some(25),
        maybe_seed: Some(seed),
        maybe_upload_path: Some(upload_path),
        maybe_lora_upload_path: Some(lora_upload_path),
        type_of_inference,
        maybe_description: Some("Option".to_string()),
        maybe_name: Some("Model Name".to_string()),
        maybe_version: Some(version),
      })),
    };

    let json = serde_json::ser::to_string(&args).unwrap();
    assert_eq!(json, r#"{"cat":"ig","args":{"Ig":{"sd":"sd_model_token","lm":"lora_model_token","w":512,"h":512,"s":"sampler","p":"prompt","np":"n_prompt","se":1,"mu":"upload_path","cf":7,"lu":"lora_upload_path","sa":25,"bc":1,"t":"type_of_inference","de":"Option","na":"Model Name","ve":0}}}"#.to_string());
  }

  #[test]
  fn typical_voice_conversion_args_serialize() {
    let args = GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::VoiceConversion),
      args: Some(PolymorphicInferenceArgs::Vc {
        auto_predict_f0: Some(false),
        override_f0_method: None,
        transpose: None,
      }),
    };

    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json,
      r#"{"cat":"vc","args":{"Vc":{"a":false}}}"#.to_string());

    // NB: Make sure we don't overflow the DB field capacity (TEXT column).
    assert!(json.len() < 1000);
  }

  #[test]
  fn many_voice_conversion_args_serialize() {
    let args = GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::VoiceConversion),
      args: Some(PolymorphicInferenceArgs::Vc {
        auto_predict_f0: Some(false),
        override_f0_method: Some(FundamentalFrequencyMethodForJob::Dio),
        transpose: Some(-1),
      }),
    };

    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json,
               r#"{"cat":"vc","args":{"Vc":{"a":false,"fm":"d","t":-1}}}"#.to_string());

    // NB: Make sure we don't overflow the DB field capacity (TEXT column).
    assert!(json.len() < 1000);
  }

  #[test]
  fn voice_conversion_args_do_not_serialize_none() {
    let args = GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::VoiceConversion),
      args: Some(PolymorphicInferenceArgs::Vc {
        auto_predict_f0: None, // NB: Do not serialize
        override_f0_method: None,
        transpose: None,
      }),
    };

    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json,
               r#"{"cat":"vc","args":{"Vc":{}}}"#.to_string());

    // NB: Make sure we don't overflow the DB field capacity (TEXT column).
    assert!(json.len() < 1000);
  }

  #[test]
  fn serialize_nullable_form() {
    let mut args : Option<GenericInferenceArgs> = None;
    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json, "null");

    args = Some(GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::VoiceConversion),
      args: Some(PolymorphicInferenceArgs::Vc {
        auto_predict_f0: Some(true),
        override_f0_method: None,
        transpose: None,
      }),
    });

    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json,
               r#"{"cat":"vc","args":{"Vc":{"a":true}}}"#.to_string());

    // NB: Make sure we don't overflow the DB field capacity (TEXT column).
    assert!(json.len() < 1000);
  }

  #[test]
  fn rmvpe() {
    let args = GenericInferenceArgs {
      inference_category: Some(InferenceCategoryAbbreviated::VoiceConversion),
      args: Some(PolymorphicInferenceArgs::Vc {
        auto_predict_f0: None,
        override_f0_method: Some(FundamentalFrequencyMethodForJob::Rmvpe),
        transpose: None,
      }),
    };

    let json = serde_json::ser::to_string(&args).unwrap();

    // NB: Assert the serialized form. If this changes and the test breaks, be careful about migrating.
    assert_eq!(json,
               r#"{"cat":"vc","args":{"Vc":{"fm":"r"}}}"#.to_string());

    // NB: Make sure we don't overflow the DB field capacity (TEXT column).
    assert!(json.len() < 1000);
  }
}
