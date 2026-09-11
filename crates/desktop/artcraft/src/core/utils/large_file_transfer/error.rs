//! Implemented from https://github.com/huggingface/hf_transfer/blob/main/src/lib.rs

use reqwest::header::ToStrError;
use std::fmt::Display;

#[derive(Debug)]
pub enum Error {
  Io(std::io::Error),
  Request(reqwest::Error),
  ToStrError(ToStrError),
  Misc(String),
}

impl From<std::io::Error> for Error {
  fn from(value: std::io::Error) -> Self {
    Self::Io(value)
  }
}

impl From<reqwest::Error> for Error {
  fn from(value: reqwest::Error) -> Self {
    Self::Request(value)
  }
}

impl From<ToStrError> for Error {
  fn from(value: ToStrError) -> Self {
    Self::ToStrError(value)
  }
}

impl Display for Error {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::Io(io) => write!(f, "Io: {io}"),
      Self::Request(req) => write!(f, "Request: {req}"),
      Self::ToStrError(req) => write!(f, "Response non ascii: {req}"),
      Self::Misc(err) => write!(f, "Misc error: {err}"),
    }
  }
}

impl std::error::Error for Error {}

impl Error {
  pub fn new_err(reason: String) -> Self {
    Self::Misc(reason)
  }
}
