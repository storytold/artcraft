use crate::requests::core_api::queue::Queue;
use crate::requests::core_api::queue_response::QueueResponse;
use crate::utils::clone_queue_response::clone_queue_response;
use serde::de::DeserializeOwned;

/// Copy the request id and URLs out of a `Queue` handle.
///
/// `QueueResponse` does not implement `Clone`, so callers that need their own copy of
/// `queue.payload` go through this helper.
pub fn clone_queue_payload<R: DeserializeOwned>(queue: &Queue<R>) -> QueueResponse {
  clone_queue_response(&queue.payload)
}
