use s3::Bucket;

use crate::bucket_client_error::BucketClientError;
use crate::object_name::ObjectName;

/// Arguments for [`BucketClient::upload_file_bytes`].
pub struct UploadFileBytesArgs<'a, S: AsRef<str>> {
  /// The destination object key (normalized via [`ObjectName`]).
  pub object_name: S,
  /// The raw bytes to upload.
  pub bytes: &'a [u8],
  /// Optional MIME type. Defaults to `application/octet-stream` when `None`.
  pub content_type: Option<&'a str>,
}

/// A client for a single S3-compatible bucket. Cheap to clone. Build one with
/// [`crate::BucketClientBuilder`].
#[derive(Clone)]
pub struct BucketClient {
  bucket: Bucket,
}

impl BucketClient {
  /// Wrap a fully-configured `Bucket`. Internal — use
  /// [`crate::BucketClientBuilder`] to construct a client.
  pub(crate) fn from_bucket(bucket: Bucket) -> Self {
    Self { bucket }
  }

  /// The name of the bucket this client targets.
  pub fn bucket_name(&self) -> &str {
    self.bucket.name.as_str()
  }

  /// Upload raw bytes to `object_name`, optionally with an explicit content type.
  ///
  /// Returns [`BucketClientError::UploadFailed`] if the store responds with a
  /// non-2xx status, or [`BucketClientError::S3Error`] on a transport/protocol
  /// error.
  pub async fn upload_file_bytes<S: AsRef<str>>(
    &self,
    args: UploadFileBytesArgs<'_, S>,
  ) -> Result<(), BucketClientError> {
    let object_name = ObjectName::new(&args.object_name);

    let response = match args.content_type {
      Some(content_type) => {
        self
          .bucket
          .put_object_with_content_type(object_name.as_str(), args.bytes, content_type)
          .await?
      }
      None => self.bucket.put_object(object_name.as_str(), args.bytes).await?,
    };

    let status_code = response.status_code();
    if !(200..300).contains(&status_code) {
      return Err(BucketClientError::UploadFailed {
        status_code,
        message: String::from_utf8_lossy(response.bytes()).into_owned(),
      });
    }

    Ok(())
  }
}
