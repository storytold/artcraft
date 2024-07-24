use std::error::Error;
use std::path::Path;
use std::time::Duration;

use anyhow::anyhow;
use anyhow::bail;
use log::info;
use log::warn;
use s3::bucket::Bucket;
use s3::creds::Credentials;
use s3::region::Region;
use tokio::fs::File;
use tokio::io::AsyncReadExt;

use errors::AnyhowResult;

#[derive(Clone)]
pub struct BucketClient {
  bucket: Bucket,
  /// If set, put all files under this root path.
  optional_bucket_root: Option<String>,
}


#[derive(Debug)]
pub enum BucketClientError {
    ErrorWithCodeAndMessage { code: u16, message: String },
}

impl std::fmt::Display for BucketClientError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            BucketClientError::ErrorWithCodeAndMessage { code, message } => write!(f, "Error {}: {}", code, message),
        }
    }
}
impl Error for BucketClientError {}


impl BucketClient {
  pub fn bucket_name(&self) -> String {
    self.bucket.name().to_string()
  }

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
    bucket.set_path_style();
    // bucket.set_subdomain_style();

    let optional_bucket_root = optional_bucket_root.map(|s| s.to_string());

    Ok(Self {
      bucket,
      optional_bucket_root,
    })
  }

  fn get_rooted_object_name(&self, object_name: &str) -> String {
    match &self.optional_bucket_root {
      None => object_name.to_string(),
      Some(root) => format!("{}/{}", root, object_name),
    }
  }

  pub async fn upload_file(&self, object_name: &str, bytes: &[u8]) -> anyhow::Result<()> {
    info!("Filename for bucket: {}", object_name);

    let object_name = self.get_rooted_object_name(object_name);
    info!("Rooted filename for bucket: {}", object_name);

    let response = self.bucket.put_object(&object_name, bytes).await?;

    let body_bytes = response.bytes();
    let code = response.status_code();

    info!("upload code: {}", code);

    if code != 200 {
      let body = String::from_utf8_lossy(body_bytes);
      warn!("upload body: {}", body);
    }

    Ok(())
  }

  pub async fn upload_file_with_content_type_process(&self, object_name: &str, bytes: &[u8], content_type: &str) -> AnyhowResult<()> {
    info!("Filename for bucket: {}", object_name);
    let object_name = self.get_rooted_object_name(object_name);
    info!("Rooted filename for bucket: {}", object_name);
    let response = self.bucket.put_object_with_content_type(&object_name, bytes, content_type).await?;
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

    let response = self.bucket.put_object_with_content_type(&object_name, bytes, content_type).await?;

    let body_bytes = response.bytes();
    let code = response.status_code();

    info!("upload code: {}", code);

    if code != 200 {
      let body = String::from_utf8_lossy(body_bytes);
      warn!("upload body: {}", body);
    }

    Ok(())
  }

  // NB: New version has blocking client rather than blocking calls.
  // pub fn upload_file_blocking(&self, object_name: &str, bytes: &[u8]) -> anyhow::Result<()> {
  //   info!("Filename for bucket: {}", object_name);
  //
  //   let (_, code) = self.bucket.put_object_blocking(object_name, bytes)?;
  //
  //   info!("upload code: {}", code);
  //
  //   Ok(())
  // }

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

    self.upload_file_with_content_type(&object_path_str, &buffer, content_type).await
  }

  // NB: New version has blocking client rather than blocking calls.
  // pub fn upload_filename_blocking(&self, object_name: &str, filename: &Path) -> anyhow::Result<()> {
  //   // TODO: does a newer version of this crate handle streaming/buffering file contents?
  //   let mut file = File::open(filename)?;
  //   let mut buffer : Vec<u8> = Vec::new();
  //   file.read_to_end(&mut buffer)?;
  //
  //   self.upload_file_blocking(object_name, &buffer)
  // }

  pub async fn download_file(&self, path: &str) -> anyhow::Result<Vec<u8>> {
    info!("downloading from bucket: {}", path);

    let response = self.bucket.get_object(path).await?;

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

    info!("downloading from bucket: {:?}", &object_path_str);

    let mut output_file = tokio::fs::File::create(filesystem_path).await?;

    let status_code = self.bucket.get_object_to_writer(&object_path_str, &mut output_file).await?;

    match status_code {
      404 => bail!("File not found in bucket: {}", &object_path_str),
      _ => {},
    }
    info!("download code: {}", status_code);
    Ok(())
  }


  // NB: New version has blocking client rather than blocking calls.
  // pub fn download_file_blocking(&self, path: &str) -> anyhow::Result<Vec<u8>> {
  //   info!("downloading from bucket: {}", path);
  //   let (bytes, code) = self.bucket.get_object_blocking(path)?;
  //
  //   match code {
  //     404 => bail!("File not found in bucket: {}", path),
  //     _ => {},
  //   }
  //
  //   info!("download code: {}", code);
  //   Ok(bytes)
  // }
}
