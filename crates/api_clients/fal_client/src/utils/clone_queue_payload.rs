use crate::requests::core_api::queue::Queue;
use crate::requests::core_api::queue_response::QueueResponse;
use crate::utils::clone_queue_response::clone_queue_response;
use serde::de::DeserializeOwned;

pub fn clone_queue_payload<R: DeserializeOwned>(queue: &Queue<R>) -> QueueResponse {
  clone_queue_response(&queue.payload)
}
