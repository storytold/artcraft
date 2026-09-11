
/// Request IDs. 
/// Type for image websocket "tasks" 
/// These are for image generation websockets.
/// Request IDs are UUIds. 
#[derive(Clone, Debug)]
pub struct RequestId(pub String);

impl RequestId {
  pub fn to_string(&self) -> String {
    self.0.clone()
  }
}
