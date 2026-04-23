pub(crate) mod execute_fal;
pub(crate) mod execute_kinovi;

use enums::common::generation::common_generation_mode::CommonGenerationMode;

/// Result of a successful generation, regardless of provider.
pub struct GenerationResult {
  /// The external job ID used to track the generation (first order_id for Seedance).
  pub external_job_id: String,

  /// Whether this is a Seedance2Pro generation (changes DB insertion path).
  pub is_seedance2pro: bool,

  /// For Seedance2Pro batch jobs, the list of all order IDs.
  pub maybe_seedance_order_ids: Option<Vec<String>>,

  /// The generation mode (Text, Keyframe, Reference).
  pub generation_mode: CommonGenerationMode,
}
