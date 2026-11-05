use crate::requests::core_api::queue_response::QueueResponse;

/// Field-by-field copy of a `QueueResponse` (the type does not derive `Clone`).
pub fn clone_queue_response(response: &QueueResponse) -> QueueResponse {
  QueueResponse {
    request_id: response.request_id.clone(),
    response_url: response.response_url.clone(),
    status_url: response.status_url.clone(),
    cancel_url: response.cancel_url.clone(),
  }
}
