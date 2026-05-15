use artcraft_router::generate::generate_image::generate_image_response::GenerateImageResponse;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;

/// Both image pipelines produce this, then the shared handler suffix writes DB rows.
pub struct ImagePipelineResult {
  pub apriori_job_token: InferenceJobToken,
  pub response: GenerateImageResponse,
}
