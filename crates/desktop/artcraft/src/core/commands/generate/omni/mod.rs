pub mod request;
pub mod dispatch;

pub use dispatch::{generate, estimate, OmniResponse, OmniResult};
pub use request::{OmniRequest, Modality};
