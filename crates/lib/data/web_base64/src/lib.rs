//! Base64 encoding and decoding library that handles data from the web.
//! Most of the base64 we receive from the web is of a particular encoding
//! type, and we also have to juggle URL prefixes.

pub mod error;
pub mod web_base64_decode;
pub mod web_base64_encode;

pub use error::WebBase64Error;
pub use web_base64_decode::web_base64_decode;
pub use web_base64_encode::web_base64_encode;
