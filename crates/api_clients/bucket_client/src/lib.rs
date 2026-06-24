//! bucket_client
//!
//! A small, ergonomic client for S3-compatible object storage, built on the
//! `rust-s3` crate. Construct one with [`BucketClientBuilder`] and upload bytes
//! with [`BucketClient::upload_file_bytes`].

pub mod bucket_client;
pub mod bucket_client_builder;
pub mod bucket_client_error;
pub mod object_name;

pub use bucket_client::{BucketClient, UploadFileBytesArgs};
pub use bucket_client_builder::BucketClientBuilder;
pub use bucket_client_error::BucketClientError;
pub use object_name::ObjectName;
