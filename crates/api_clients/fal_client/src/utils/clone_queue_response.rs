use crate::requests::api::queue_response::QueueResponse;

pub fn clone_queue_response(response: &QueueResponse) -> QueueResponse {
  QueueResponse {
    request_id: response.request_id.clone(),
    response_url: response.response_url.clone(),
    status_url: response.status_url.clone(),
    cancel_url: response.cancel_url.clone(),
  }
}
