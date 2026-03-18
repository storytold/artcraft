//! email_sender
//!
//! Provide SMTP and other email sending capabilities to the rest of our services.
//!

/// Public re-exports
pub mod letter_exports {
  pub use lettre::Message;
  pub use lettre::message::header::ContentType;
  pub use lettre::message::Mailbox;
}

pub mod smtp_email_sender;
