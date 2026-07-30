use std::error::Error;
use std::path::{Path, PathBuf};
use std::time::Duration;

use anyhow::anyhow;
use anyhow::bail;
use log::{error, warn};
use log::{debug, info};
use s3::bucket::Bucket;
use s3::creds::Credentials;
use s3::error::S3Error;
use s3::region::Region;
use s3::request::ResponseData;
use tokio::fs::File;
use tokio::io::AsyncReadExt;

use errors::AnyhowResult;

#[derive(Clone)]
pub struct LegacyBucketClient {
  backend: LegacyBucketBackend,
  /// If set, put all files under this root path.
  optional_bucket_root: Option<String>,
}

#[derive(Clone)]
enum LegacyBucketBackend {
  S3 {
    bucket: Bucket,
  },
  /// Development-only: objects live on the local filesystem under `root`,
  /// with the rooted object path (e.g. "/media/a/b/…/file.jpg") mapped
  /// segment-by-segment beneath it — the same layout the dev server's
  /// static /media mount serves. Lets the local dev stack run every upload
  /// endpoint without S3/R2 credentials.
  LocalDir {
    root: PathBuf,
    bucket_name: String,
  },
}

#[derive(Debug)]
pub enum LegacyBucketClientError {
    ErrorWithCodeAndMessage { code: u16, message: String },
}

impl std::fmt::Display for LegacyBucketClientError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            LegacyBucketClientError::ErrorWithCodeAndMessage { code, message } => write!(f, "Error {}: {}", code, message),
        }
    }
}
impl Error for LegacyBucketClientError {}


impl LegacyBucketClient {
  pub fn create(
    access_key: &str,
    secret_key: &str,
    region_name: &str,
    bucket_name: &str,
    s3_endpoint: &str,
    optional_bucket_root: Option<&str>,
    // See underlying docs for timeout details.
    bucket_request_timeout: Option<Duration>,
  ) -> anyhow::Result<Self>
  {
    let credentials = Credentials {
      access_key: Some(access_key.to_string()),
      secret_key: Some(secret_key.to_string()),
      security_token: None,
      session_token: None,
      expiration: None
    };

    // NB: The GCS buckets aren't supported by default.
    let region = Region::Custom {
      region: region_name.to_owned(),
      endpoint: s3_endpoint.to_owned(),
    };

    let mut bucket = Bucket::new(&bucket_name, region, credentials)?;

    bucket.set_request_timeout(bucket_request_timeout);

    match s3_endpoint {
      "https://storage.googleapis.com" => {
        bucket.set_subdomain_style();
      },
      _ => {
        bucket.set_path_style();
      }
    }

    let optional_bucket_root = optional_bucket_root.map(|s| s.to_string());

    Ok(Self {
      backend: LegacyBucketBackend::S3 {
        bucket: *bucket, // NB: We don't need to keep this boxed on the heap.
      },
      optional_bucket_root,
    })
  }

  /// Development-only: a "bucket" backed by a local directory (see
  /// `LegacyBucketBackend::LocalDir`). `bucket_name` is only reported back
  /// via `bucket_name()`; no cloud service is ever contacted.
  pub fn create_local(
    local_root: impl Into<PathBuf>,
    bucket_name: &str,
    optional_bucket_root: Option<&str>,
  ) -> Self {
    Self {
      backend: LegacyBucketBackend::LocalDir {
        root: local_root.into(),
        bucket_name: bucket_name.to_string(),
      },
      optional_bucket_root: optional_bucket_root.map(|s| s.to_string()),
    }
  }

  pub fn bucket_name(&self) -> String {
    match &self.backend {
      LegacyBucketBackend::S3 { bucket } => bucket.name().to_string(),
      LegacyBucketBackend::LocalDir { bucket_name, .. } => bucket_name.clone(),
    }
  }

  pub async fn upload_file(&self, object_name: &str, bytes: &[u8]) -> anyhow::Result<()> {
    debug!("Filename for bucket: {}", object_name);

    let object_name = self.get_rooted_object_name(object_name);
    debug!("Rooted filename for bucket: {}", object_name);

    let bucket = match &self.backend {
      LegacyBucketBackend::S3 { bucket } => bucket,
      LegacyBucketBackend::LocalDir { root, .. } => {
        return write_local_object(root, &object_name, bytes).await;
      },
    };

    let response = bucket.put_object(&object_name, bytes).await?;

    let body_bytes = response.bytes();
    let code = response.status_code();

    debug!("upload code for {}: {}", object_name, code);

    if code != 200 {
      let body = String::from_utf8_lossy(body_bytes);
      warn!("failed upload body: {}", body);
    }

    info!("Successfully uploaded file to bucket: {}", object_name);

    Ok(())
  }

  pub async fn upload_file_with_content_type_process(&self, object_name: &str, bytes: &[u8], content_type: &str) -> AnyhowResult<()> {
    info!("Filename for bucket: {}", object_name);
    let object_name = self.get_rooted_object_name(object_name);
    info!("Rooted filename for bucket: {}", object_name);

    let bucket = match &self.backend {
      LegacyBucketBackend::S3 { bucket } => bucket,
      LegacyBucketBackend::LocalDir { root, .. } => {
        // Content type is derived from the file extension when the dev
        // static mount serves it back; nothing to store here.
        return write_local_object(root, &object_name, bytes).await;
      },
    };

    let response = bucket.put_object_with_content_type(&object_name, bytes, content_type).await?;
    let body_bytes = response.bytes();
    let code = response.status_code();
    info!("upload code: {}", code);
    if code != 200 {
      let body = String::from_utf8_lossy(body_bytes);
      warn!("upload body: {}", body);
      Err(anyhow!("upload failed: {}", code))
    } else {
      info!("upload success: {}", code);
      Ok(())
    }
  }

  #[deprecated = "Use upload_file instead above it returns an error we can surface and act on. upload_file_with_content_type_process"]
  pub async fn upload_file_with_content_type(&self, object_name: &str, bytes: &[u8], content_type: &str) -> anyhow::Result<()> {
    info!("Filename for bucket: {}", object_name);

    let object_name = self.get_rooted_object_name(object_name);
    info!("Rooted filename for bucket: {}", object_name);

    let bucket = match &self.backend {
      LegacyBucketBackend::S3 { bucket } => bucket,
      LegacyBucketBackend::LocalDir { root, .. } => {
        return write_local_object(root, &object_name, bytes).await;
      },
    };

    let response = bucket.put_object_with_content_type(&object_name, bytes, content_type).await;

    if let Err(err) = &response {
      error!("S3 Upload Error for bucket name {}: {:?}", bucket.name, err);
    }

    let response = response?;

    let body_bytes = response.bytes();
    let code = response.status_code();

    info!("upload code: {}", code);

    if code != 200 {
      let body = String::from_utf8_lossy(body_bytes);
      warn!("upload body: {}", body);
    }

    Ok(())
  }

  pub async fn upload_filename<P: AsRef<Path>, Q: AsRef<Path>>(
    &self,
    object_path: P,
    filename: Q
  ) -> anyhow::Result<()> {
    let object_path_str = object_path.as_ref()
        .to_str()
        .map(|s| s.to_string())
        .ok_or(anyhow!("could not convert object path to string"))?;

    // TODO: does a newer version of this crate handle streaming/buffering file contents?
    let mut file = File::open(filename).await?;
    let mut buffer : Vec<u8> = Vec::new();
    file.read_to_end(&mut buffer).await?;

    info!("Uploading...");

    self.upload_file(&object_path_str, &buffer).await
  }

  pub async fn upload_filename_with_content_type<P: AsRef<Path>, Q: AsRef<Path>>(
    &self,
    object_path: P,
    filename: Q,
    content_type: &str
  ) -> anyhow::Result<()> {
    let object_path_str = object_path.as_ref()
      .to_str()
      .map(|s| s.to_string())
      .ok_or(anyhow!("could not convert object path to string"))?;

    // TODO: does a newer version of this crate handle streaming/buffering file contents?
    let mut file = File::open(filename).await?;
    let mut buffer : Vec<u8> = Vec::new();
    file.read_to_end(&mut buffer).await?;

    info!("Uploading with content type...");

    #[allow(deprecated)]
    self.upload_file_with_content_type(&object_path_str, &buffer, content_type).await
  }

  pub async fn download_file(&self, path: &str) -> anyhow::Result<Vec<u8>> {
    info!("downloading from bucket: {}", path);

    let bucket = match &self.backend {
      LegacyBucketBackend::S3 { bucket } => bucket,
      LegacyBucketBackend::LocalDir { root, .. } => {
        let disk_path = local_object_disk_path(root, path)?;
        return tokio::fs::read(&disk_path).await
            .map_err(|err| anyhow!("File not found in local bucket ({}): {}", disk_path.display(), err));
      },
    };

    let response = bucket.get_object(path).await?;

    let bytes = response.bytes();
    let code = response.status_code();

    match code {
      404 => bail!("File not found in bucket: {}", path),
      _ => {},
    }

    info!("download code: {}", code);
    Ok(bytes.to_vec())
  }

  pub async fn download_file_to_disk<P: AsRef<Path>, Q: AsRef<Path>>(
    &self,
    object_path: P,
    filesystem_path: Q,
  ) -> AnyhowResult<()> {
    let object_path_str = object_path.as_ref()
      .to_str()
      .map(|s| s.to_string())
      .ok_or(anyhow!("could not convert object path to string"))?;

    let bucket = match &self.backend {
      LegacyBucketBackend::S3 { bucket } => bucket,
      LegacyBucketBackend::LocalDir { root, .. } => {
        let disk_path = local_object_disk_path(root, &object_path_str)?;
        tokio::fs::copy(&disk_path, filesystem_path.as_ref()).await
            .map_err(|err| anyhow!("File not found in local bucket ({}): {}", disk_path.display(), err))?;
        return Ok(());
      },
    };

    info!("creating file for bucket download: {:?}", filesystem_path.as_ref());

    let mut output_file = File::create(filesystem_path).await?;

    let result = bucket.get_object_to_writer(&object_path_str, &mut output_file).await;

    info!("downloading from bucket (named '{}'), path: {}", bucket.name, &object_path_str);

    let status_code = match result {
      Ok(status_code) => status_code,
      Err(err) => {
        return bail!("Error downloading from bucket (named '{}'): {:?}", bucket.name, err)
      }
    };

    match status_code {
      404 => {
        error!("File not found in bucket (named '{}'), path: {}", bucket.name, &object_path_str);
        bail!("File not found in bucket: {}", &object_path_str)
      },
      _ => {
        info!("download code: {}", status_code);
      },
    }

    Ok(())
  }

  fn get_rooted_object_name(&self, object_name: &str) -> String {
    match &self.optional_bucket_root {
      None => object_name.to_string(),
      Some(root) => format!("{}/{}", root, object_name),
    }
  }
}

/// Map a rooted object path (e.g. "/media/a/b/…/file.jpg") to a disk path
/// under `root`, segment by segment. This is the single source of truth for
/// the local-dir layout — the dev server's static /media mount and the fake
/// generation resolver must agree with it (disk = root + rooted path).
pub fn local_object_disk_path(root: &Path, rooted_object_path: &str) -> anyhow::Result<PathBuf> {
  let mut path = root.to_path_buf();
  for segment in rooted_object_path.split('/').filter(|s| !s.is_empty()) {
    // Object names can come from user-controlled archives (e.g. PMX zip
    // entries); never let them escape the root.
    if segment == ".." || segment.contains('\\') {
      bail!("refusing suspicious object path segment: {}", rooted_object_path);
    }
    path.push(segment);
  }
  Ok(path)
}

async fn write_local_object(root: &Path, rooted_object_path: &str, bytes: &[u8]) -> anyhow::Result<()> {
  let disk_path = local_object_disk_path(root, rooted_object_path)?;
  if let Some(parent) = disk_path.parent() {
    tokio::fs::create_dir_all(parent).await?;
  }
  tokio::fs::write(&disk_path, bytes).await?;
  info!("Wrote local bucket object: {}", disk_path.display());
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  mod local_object_disk_path_tests {
    use super::*;

    #[test]
    fn maps_rooted_path_under_root() {
      let path = local_object_disk_path(Path::new("/data"), "/media/a/b/file.jpg").unwrap();
      assert_eq!(path, Path::new("/data").join("media").join("a").join("b").join("file.jpg"));
    }

    #[test]
    fn ignores_leading_slash_and_empty_segments() {
      let with_slash = local_object_disk_path(Path::new("/data"), "/media//x").unwrap();
      let without_slash = local_object_disk_path(Path::new("/data"), "media/x").unwrap();
      assert_eq!(with_slash, without_slash);
    }

    #[test]
    fn rejects_parent_dir_traversal() {
      assert!(local_object_disk_path(Path::new("/data"), "/media/../../etc/passwd").is_err());
    }

    #[test]
    fn rejects_backslash_segments() {
      assert!(local_object_disk_path(Path::new("/data"), "/media/a\\b").is_err());
    }
  }
}
