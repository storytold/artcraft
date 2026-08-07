use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;

/// The first-party Minimax H3 model tier a job runs on.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum FirstPartyMinimaxH3Model {
  Turbo,
  Ultra,
}

impl FirstPartyMinimaxH3Model {
  pub fn inference_job_type(&self) -> InferenceJobType {
    match self {
      Self::Turbo => InferenceJobType::ArtcraftMinimaxH3Turbo,
      Self::Ultra => InferenceJobType::ArtcraftMinimaxH3Ultra,
    }
  }

  pub fn inference_model_type(&self) -> InferenceModelType {
    match self {
      Self::Turbo => InferenceModelType::MinimaxH3Turbo,
      Self::Ultra => InferenceModelType::MinimaxH3Ultra,
    }
  }
}
