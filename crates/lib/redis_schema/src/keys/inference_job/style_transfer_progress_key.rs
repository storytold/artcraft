use chrono::Duration;

use tokens::tokens::generic_inference_jobs::InferenceJobToken;

pub struct StyleTransferProgressKey(pub String);

impl_string_key!(StyleTransferProgressKey);

const REDIS_KEY_TTL_DURATION: Duration = Duration::milliseconds(1000 * 60 * 60 * 24 * 2);

impl StyleTransferProgressKey {
  pub fn new_for_job_id(token: InferenceJobToken) -> Self {
    let key = format!("progress:style_transfer:{}", token.as_str());
    Self(key)
  }

  pub fn get_redis_ttl() -> Duration {
    REDIS_KEY_TTL_DURATION
  }
}

