use anyhow::{bail, ensure, Context, Result};
use fs2::FileExt;
use image::{ImageFormat, ImageReader, Limits};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, File, OpenOptions};
use std::io::{Cursor, Read, Write};
use std::path::{Path, PathBuf};
use uuid::Uuid;

pub mod live_upload;
pub mod loopback_upload;
pub mod recovery;
pub mod remote_verify;

const MAX_BYTES: u64 = 20 * 1024 * 1024;
const MAX_PIXELS: u64 = 40_000_000;

pub struct Bridge {
  root: PathBuf,
  state: PathBuf,
  mock: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ImageInfo {
  pub sha256: String,
  pub mime_type: String,
  pub byte_size: usize,
  pub width: u32,
  pub height: u32,
  pub has_alpha: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ImportRecord {
  pub request_id: Uuid,
  pub status: String,
  pub backend: String,
  pub image: ImageInfo,
  pub maybe_media_file_token: Option<String>,
}

impl Bridge {
  pub fn new(root: &Path, state: &Path, mock: bool) -> Result<Self> {
    let root = root.canonicalize().context("Allowed root must exist")?;
    ensure!(root.is_dir(), "Allowed root must be a directory");
    fs::create_dir_all(state)?;
    let state = state.canonicalize()?;
    ensure!(
      !state.starts_with(&root),
      "State must be outside the allowed image root"
    );
    Ok(Self { root, state, mock })
  }

  pub fn inspect(&self, path: &Path) -> Result<ImageInfo> {
    Ok(self.read_image(path)?.0)
  }

  pub fn import(&self, path: &Path, expected_hash: &str, request_id: Uuid) -> Result<ImportRecord> {
    let _transaction = self.lock_state()?;
    ensure!(
      self.mock,
      "Live import is disabled; no ArtCraft authentication is configured"
    );
    let (info, bytes) = self.read_image(path)?;
    ensure!(
      info.sha256 == expected_hash,
      "Image hash changed or does not match"
    );
    if let Some(old) = self.get(request_id)? {
      ensure!(
        old.backend == "local_mock_only",
        "Request ID belongs to a live import"
      );
      ensure!(
        old.image.sha256 == info.sha256,
        "Request ID already belongs to different content"
      );
      if old.status == "mock_verified" {
        self.verify_mock(&old)?;
        return Ok(old);
      }
    }
    let mut record = ImportRecord {
      request_id,
      status: "pending".into(),
      backend: "local_mock_only".into(),
      image: info,
      maybe_media_file_token: None,
    };
    self.save_record(&record)?;
    // Same request ID always addresses the same simulated backend object.
    atomic_write(&self.state.join(format!("mock-{request_id}.image")), &bytes)?;
    self.verify_mock(&record)?;
    record.status = "mock_verified".into();
    self.save_record(&record)?;
    Ok(record)
  }

  pub fn get(&self, request_id: Uuid) -> Result<Option<ImportRecord>> {
    let path = self.state.join(format!("{request_id}.json"));
    match fs::read(path) {
      Ok(bytes) => {
        let record: ImportRecord = serde_json::from_slice(&bytes)?;
        ensure!(record.request_id == request_id, "Invalid stored request ID");
        if record.status == "mock_verified" {
          self.verify_mock(&record)?;
        }
        Ok(Some(record))
      }
      Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(None),
      Err(err) => Err(err.into()),
    }
  }

  /// Explain retained evidence only. Never decrypt credentials, contact the
  /// service, clear a claim, or require the original image to remain available.
  pub fn recovery_report(&self, request_id: Uuid) -> Result<recovery::RecoveryReport> {
    Ok(recovery::RecoveryReport::from_record(
      request_id,
      self.get(request_id)?,
    ))
  }

  /// Persist before network I/O. Existing attempts never cause another POST,
  /// including after a crash, cancellation, rejection, or uncertain outcome.
  pub fn prepare_live(
    &self,
    path: &Path,
    hash: &str,
    id: Uuid,
  ) -> Result<(ImportRecord, Option<Vec<u8>>)> {
    let _transaction = self.lock_state()?;
    ensure!(!self.mock, "Live upload cannot use mock state");
    let (info, bytes) = self.read_image(path)?;
    ensure!(info.sha256 == hash, "Image hash changed or does not match");
    if let Some(old) = self.get(id)? {
      ensure!(
        old.backend == "artcraft_live" && old.image.sha256 == hash,
        "Request ID belongs to a different backend or image"
      );
      return Ok((old, None));
    }
    let record = ImportRecord {
      request_id: id,
      status: "upload_outcome_unknown".into(),
      backend: "artcraft_live".into(),
      image: info,
      maybe_media_file_token: None,
    };
    self.save_record(&record)?;
    Ok((record, Some(bytes)))
  }

  pub fn save_live_result(&self, record: &ImportRecord) -> Result<()> {
    let _transaction = self.lock_state()?;
    let old = self
      .get(record.request_id)?
      .context("Missing live attempt")?;
    ensure!(
      old.backend == "artcraft_live"
        && record.backend == old.backend
        && record.image.sha256 == old.image.sha256,
      "Live record mismatch"
    );
    if let Some(token) = &old.maybe_media_file_token {
      ensure!(
        record.maybe_media_file_token.as_ref() == Some(token),
        "Cannot replace an accepted media token"
      );
    }
    self.save_record(record)
  }

  // Hold the cross-process lock only for a state transaction, never across
  // initialization, MCP discovery, or HTTP I/O. Closing the File releases it.
  fn lock_state(&self) -> Result<File> {
    let lock = OpenOptions::new()
      .create(true)
      .truncate(false)
      .read(true)
      .write(true)
      .open(self.state.join("bridge.lock"))?;
    lock
      .try_lock_exclusive()
      .context("State is busy; retry with the same request ID")?;
    Ok(lock)
  }

  fn read_image(&self, path: &Path) -> Result<(ImageInfo, Vec<u8>)> {
    ensure!(path.is_absolute(), "Image path must be absolute");
    // Only ordinary local paths. Reject Windows device/UNC paths and alternate streams.
    let text = path.to_string_lossy();
    ensure!(
      !text.starts_with(r"\\"),
      "UNC and device paths are not accepted"
    );
    #[cfg(windows)]
    ensure!(
      !text.get(2..).unwrap_or("").contains(':'),
      "Alternate streams are not accepted"
    );
    let resolved = path.canonicalize().context("Cannot resolve image")?;
    ensure!(
      resolved.starts_with(&self.root),
      "Image is outside the allowed root"
    );
    let mut file = File::open(&resolved).context("Cannot open image")?;
    let metadata = file.metadata()?;
    ensure!(metadata.is_file(), "Image must be a regular file");
    ensure!(metadata.len() <= MAX_BYTES, "Image exceeds 20 MiB limit");
    ensure!(
      path.canonicalize()? == resolved,
      "Path changed while opening image"
    );
    ensure!(
      same_file::Handle::from_file(file.try_clone()?)? == same_file::Handle::from_path(&resolved)?,
      "File changed while opening image"
    );
    let mut bytes = Vec::new();
    (&mut file).take(MAX_BYTES + 1).read_to_end(&mut bytes)?;
    ensure!(
      bytes.len() as u64 <= MAX_BYTES,
      "Image exceeds 20 MiB limit"
    );
    let format = image::guess_format(&bytes).context("Invalid image content")?;
    ensure!(
      matches!(format, ImageFormat::Png | ImageFormat::Jpeg),
      "Only PNG and JPEG are supported"
    );
    let dimensions = ImageReader::with_format(Cursor::new(&bytes), format).into_dimensions()?;
    ensure!(
      u64::from(dimensions.0) * u64::from(dimensions.1) <= MAX_PIXELS,
      "Image exceeds pixel limit"
    );
    let mut reader = ImageReader::with_format(Cursor::new(&bytes), format);
    let mut limits = Limits::default();
    limits.max_alloc = Some(256 * 1024 * 1024);
    reader.limits(limits);
    let decoded = reader.decode().context("Image failed full decoding")?;
    let info = ImageInfo {
      sha256: format!("{:x}", Sha256::digest(&bytes)),
      mime_type: if format == ImageFormat::Png {
        "image/png"
      } else {
        "image/jpeg"
      }
      .into(),
      byte_size: bytes.len(),
      width: decoded.width(),
      height: decoded.height(),
      has_alpha: decoded.color().has_alpha(),
    };
    Ok((info, bytes))
  }

  fn save_record(&self, record: &ImportRecord) -> Result<()> {
    atomic_write(
      &self.state.join(format!("{}.json", record.request_id)),
      &serde_json::to_vec_pretty(record)?,
    )
  }

  fn verify_mock(&self, record: &ImportRecord) -> Result<()> {
    let bytes = fs::read(self.state.join(format!("mock-{}.image", record.request_id)))?;
    if format!("{:x}", Sha256::digest(&bytes)) != record.image.sha256 {
      bail!("Mock read-back does not match imported bytes");
    }
    Ok(())
  }
}

fn atomic_write(path: &Path, bytes: &[u8]) -> Result<()> {
  let mut file = tempfile::NamedTempFile::new_in(path.parent().context("Missing parent")?)?;
  file.write_all(bytes)?;
  file.as_file().sync_all()?;
  file.persist(path).map_err(|err| err.error)?;
  Ok(())
}
