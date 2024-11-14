use utoipa::ToSchema;

use enums::common::visibility::Visibility;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use tokens::tokens::media_files::MediaFileToken;

#[derive(Deserialize, ToSchema)]
pub struct VstRequest {
  /// Entropy for request de-duplication (required)
  pub uuid_idempotency_token: String,

  /// The name of the style to invoke (required)
  pub style: StyleTransferName,

  /// The input video media file (required)
  pub input_file: MediaFileToken,

  /// Optional: the depth video file
  /// The underlying media file must be a video.
  pub input_depth_file: Option<MediaFileToken>,

  /// Optional: the normal map video file
  /// The underlying media file must be a video.
  pub input_normal_file: Option<MediaFileToken>,

  /// Optional: the outline video file
  /// The underlying media file must be a video.
  pub input_outline_file: Option<MediaFileToken>,

  /// Optional: Global IP-Adapter image.
  /// The underlying media file must be an image.
  pub global_ipa_media_token: Option<MediaFileToken>,

  /// The positive prompt (optional)
  pub prompt: Option<String>,

  /// The negative prompt (optional)
  pub negative_prompt: Option<String>,

  /// Use Strength of the style transfer
  /// Must be between 0.0 (match source) and 1.0 (maximum dreaming).
  /// The default, if not sent, is 1.0.
  pub use_strength: Option<f32>,

  /// Optional trim start in milliseconds
  pub trim_start_millis: Option<u64>,

  /// Optional trim end in milliseconds
  pub trim_end_millis: Option<u64>,

  /// Enable lipsyncing in the workflow
  pub enable_lipsync: Option<bool>,

  /// Use lipsync in the workflow
  #[deprecated(note = "use enable_lipsync")]
  pub use_lipsync: Option<bool>,

  /// Remove watermark from the output
  /// Only for premium accounts
  pub remove_watermark: Option<bool>,

  /// Disable LCM
  /// Don't let ordinary users do this.
  /// Non-LCM workflows take a long time.
  pub disable_lcm: Option<bool>,

  /// Use the cinematic workflow
  /// Don't let ordinary users do this.
  pub use_cinematic: Option<bool>,

  /// Use face detailer
  /// Only for premium accounts
  pub use_face_detailer: Option<bool>,

  /// Use video upscaler
  /// Only for premium accounts
  pub use_upscaler: Option<bool>,

  /// Use cogvideo
  pub use_cogvideo: Option<bool>,

  /// Optional visibility setting override.
  pub creator_set_visibility: Option<Visibility>,

  /// To use prompt traveling, enqueue a prompt with this.
  ///
  /// An example of a prompt travel section:
  ///
  ///    "50": "(explosion:1.4)",
  ///    "59": "(explosion:1.4)",
  ///    "60": "fire, smoke, ash",
  ///    "99": "fire, smoke, ash",
  ///    "100": "",
  ///
  /// On the interval 50-59 there will be explosion, on
  /// the interval 60-99 there will be fire, smoke, ash.
  /// You must set
  ///
  /// Alternatively, the main `prompt` field can have a
  /// prompt travel section if you end the main prompt
  /// with `---` and then include a prompt travel text.
  pub travel_prompt: Option<String>,

  /// If you'd like to skip frames.
  ///
  /// Meaning:
  ///  * 1 = not skipping frames.
  ///  * 2 = skipping every 2nd, etc.
  ///
  /// The default, if not specified, is 2, which means
  /// every 2nd frame is skipped.
  pub frame_skip: Option<u8>,

  /// If this workflow should try to write store preview frames
  pub previews_enabled: Option<bool>,
}
