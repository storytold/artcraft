use std::time::Duration;

use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;

pub struct JobSuccessResult {
  pub maybe_result_entity: Option<ResultEntity>,
  pub inference_duration: Duration,
}

pub struct ResultEntity {
  pub entity_type: InferenceResultType,
  pub entity_token: String,
}
