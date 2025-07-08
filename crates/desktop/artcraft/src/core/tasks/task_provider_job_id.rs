use tokens::tokens::generic_inference_jobs::InferenceJobToken;

#[derive(Clone, Debug, Hash, PartialEq, Eq, PartialOrd, Ord)]
pub struct TaskProviderJobId(String);

impl TaskProviderJobId {
  pub fn from_str(job_id: &str) -> Self {
    Self(job_id.to_string())
  }

  pub fn from_artcraft_job_id(job_id: InferenceJobToken) -> Self {
    Self(job_id.to_string())
  }

  pub fn to_string(&self) -> String {
    self.0.clone()
  }

  pub fn as_str(&self) -> &str {
    self.0.as_str()
  }
}
