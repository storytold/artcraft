use crate::core::state::data_dir::app_data_root::AppDataRoot;
use anyhow::{anyhow, bail, Context, Result};
use chrono::{DateTime, Utc};
use image::{ImageFormat, ImageReader, Limits};
use log::warn;
use reqwest::Url;
use serde_derive::{Deserialize, Serialize};
use std::fs::{self, File};
use std::fmt::{Display, Formatter};
use std::io::{Cursor, Read, Write, Seek, SeekFrom};
use std::path::{Path, PathBuf};
use tempfile::NamedTempFile;
use tokens::tokens::media_files::MediaFileToken;

const LOCAL_PREFIX: &str = "local_file_";
const MAX_IMAGE_BYTES: u64 = 128 * 1024 * 1024;
const MAX_METADATA_BYTES: u64 = 1024 * 1024;

pub struct KeptGeneration {
  pub token: MediaFileToken,
  pub asset_url: Url,
}

#[derive(Debug)]
pub struct InvalidLocalImage;

impl Display for InvalidLocalImage {
  fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
    formatter.write_str("Provider output is not supported, bounded media")
  }
}

impl std::error::Error for InvalidLocalImage {}

#[derive(Debug, Serialize)]
pub struct LocalGeneration {
  pub id: String,
  pub url: Url,
  pub prompt: String,
  pub model_id: String,
  pub provider: String,
  pub created_at: DateTime<Utc>,
  pub media_class: String,
}

#[derive(Deserialize, Serialize)]
struct Metadata {
  id: String,
  filename: String,
  prompt: String,
  model_id: String,
  provider: String,
  created_at: DateTime<Utc>,
  #[serde(default = "image_class")]
  media_class: String,
}

pub fn keep_as(root: &AppDataRoot, seed: &str, source: &Path, prompt: &str, model_id: &str, provider: &str) -> Result<KeptGeneration> {
  keep_media_as(root, seed, source, prompt, model_id, provider, false)
}

pub fn keep_video_as(root: &AppDataRoot, seed: &str, source: &Path, prompt: &str, model_id: &str, provider: &str) -> Result<KeptGeneration> {
  keep_media_as(root, seed, source, prompt, model_id, provider, true)
}

fn keep_media_as(root: &AppDataRoot, seed: &str, source: &Path, prompt: &str, model_id: &str, provider: &str, video: bool) -> Result<KeptGeneration> {
  if seed.is_empty() || seed.len() > 96 {
    bail!("Local generation seed is empty or too long");
  }
  let id = format!("{LOCAL_PREFIX}{}", seed.as_bytes().iter().map(|byte| format!("{byte:02x}")).collect::<String>());
  let directory = local_directory(root, true)?;
  let metadata_path = directory.join(format!("{id}.json"));
  if metadata_path.try_exists()? {
    let metadata = read_metadata(&directory, &id)?;
    if metadata.media_class != if video { "video" } else { "image" } {
      bail!("Local generation media class changed");
    }
    validate_details(&metadata, prompt, model_id, provider)?;
    return kept_generation(&directory, &metadata);
  }

  let maybe_bytes = if video {
    validate_video_file(source)?;
    None
  } else {
    Some(read_image_bytes(source)?)
  };
  let extension = match &maybe_bytes {
    Some(bytes) => validate_image(bytes).map_err(|_| InvalidLocalImage)?,
    None => "mp4",
  };
  let filename = format!("{id}.{extension}");
  let image_path = directory.join(&filename);
  let mut temporary = NamedTempFile::new_in(&directory)?;
  if let Some(bytes) = &maybe_bytes {
    temporary.write_all(bytes)?;
  } else {
    std::io::copy(&mut File::open(source)?, &mut temporary)?;
  }
  temporary.as_file().sync_all()?;
  match temporary.persist_noclobber(&image_path) {
    Ok(_) => {},
    Err(error) if error.error.kind() == std::io::ErrorKind::AlreadyExists => {
      confined_file(&directory, &image_path)?;
      if !same_files(source, &image_path)? {
        bail!("Local generation already contains different image bytes");
      }
    },
    Err(error) => return Err(error.error.into()),
  }

  let created_at = fs::metadata(&image_path)?.modified()?.into();
  let metadata = Metadata { id: id.clone(), filename, prompt: prompt.into(), model_id: model_id.into(), provider: provider.into(), created_at, media_class: if video { "video".into() } else { "image".into() } };
  let encoded = serde_json::to_vec(&metadata)?;
  if encoded.len() as u64 > MAX_METADATA_BYTES {
    bail!("Local generation metadata is too large");
  }
  let mut temporary = NamedTempFile::new_in(&directory)?;
  temporary.write_all(&encoded)?;
  temporary.as_file().sync_all()?;
  match temporary.persist_noclobber(metadata_path) {
    Ok(_) => kept_generation(&directory, &metadata),
    Err(error) if error.error.kind() == std::io::ErrorKind::AlreadyExists => {
      let metadata = read_metadata(&directory, &id)?;
      validate_details(&metadata, prompt, model_id, provider)?;
      kept_generation(&directory, &metadata)
    },
    Err(error) => Err(error.error.into()),
  }
}

pub fn list(root: &AppDataRoot) -> Result<Vec<LocalGeneration>> {
  let directory = local_directory(root, true)?;
  let mut images = Vec::new();
  for entry in fs::read_dir(&directory)? {
    let entry = entry?;
    let path = entry.path();
    if path.extension().and_then(|value| value.to_str()) != Some("json") {
      continue;
    }
    let Some(id) = path.file_stem().and_then(|value| value.to_str()) else {
      continue;
    };
    let result = read_metadata(&directory, id).and_then(|metadata| {
      let kept = kept_generation(&directory, &metadata)?;
      Ok(LocalGeneration { id: metadata.id, url: kept.asset_url, prompt: metadata.prompt, model_id: metadata.model_id, provider: metadata.provider, created_at: metadata.created_at, media_class: metadata.media_class })
    });
    match result {
      Ok(image) => images.push(image),
      Err(_) => warn!("Ignoring invalid local generation metadata"),
    }
  }
  images.sort_by(|left, right| right.created_at.cmp(&left.created_at).then_with(|| left.id.cmp(&right.id)));
  Ok(images)
}

pub fn delete(root: &AppDataRoot, id: &str) -> Result<()> {
  validate_id(id)?;
  let directory = local_directory(root, true)?;
  let metadata_path = directory.join(format!("{id}.json"));
  if !metadata_path.try_exists()? {
    return Ok(());
  }
  let metadata = read_metadata(&directory, id)?;
  let image_path = directory.join(&metadata.filename);
  match fs::symlink_metadata(&image_path) {
    Ok(_) => {
      confined_file(&directory, &image_path)?;
      fs::remove_file(image_path)?;
    },
    Err(error) if error.kind() == std::io::ErrorKind::NotFound => {},
    Err(error) => return Err(error.into()),
  }
  fs::remove_file(metadata_path)?;
  Ok(())
}

pub fn is_local_token(id: &str) -> bool {
  id.starts_with(LOCAL_PREFIX)
}

pub fn resolve_token(root: &AppDataRoot, id: &str) -> Result<PathBuf> {
  let directory = local_directory(root, false)?;
  let metadata = read_metadata(&directory, id)?;
  confined_file(&directory, &directory.join(metadata.filename))
}

pub fn validate_image_file(path: &Path) -> Result<()> {
  let bytes = read_image_bytes(path)?;
  validate_image(&bytes).map_err(|_| InvalidLocalImage)?;
  Ok(())
}

pub fn is_asset_url(url: &Url) -> bool {
  url.scheme() == "asset" || url.host_str() == Some("asset.localhost")
}

pub fn resolve_asset_url(root: &AppDataRoot, url: &Url) -> Result<PathBuf> {
  let valid_origin = (url.scheme() == "asset" && url.host_str() == Some("localhost")) || (url.scheme() == "http" && url.host_str() == Some("asset.localhost"));
  if !valid_origin || !url.username().is_empty() || url.password().is_some() || url.port().is_some() || url.query().is_some() || url.fragment().is_some() {
    bail!("Unsupported local asset URL");
  }
  let decoded = decode_path(url.path().strip_prefix('/').unwrap_or(url.path()))?;
  let path = PathBuf::from(decoded);
  let directory = local_directory(root, false)?;
  let path = confined_file(&directory, &path)?;
  let id = path.file_stem().and_then(|value| value.to_str()).context("Invalid local image path")?;
  let metadata = read_metadata(&directory, id)?;
  if path.file_name().and_then(|value| value.to_str()) != Some(metadata.filename.as_str()) {
    bail!("Asset is not a registered local generation");
  }
  Ok(path)
}

pub fn asset_url(path: &Path) -> Result<Url> {
  let path = path.to_str().context("Local image path is not UTF-8")?;
  let encoded = path.as_bytes().iter().map(|byte| if byte.is_ascii_alphanumeric() || b"-_.!~*'()".contains(byte) { (*byte as char).to_string() } else { format!("%{byte:02X}") }).collect::<String>();
  let origin = if cfg!(windows) { "http://asset.localhost/" } else { "asset://localhost/" };
  Ok(Url::parse(&format!("{origin}{encoded}"))?)
}

fn local_directory(root: &AppDataRoot, create: bool) -> Result<PathBuf> {
  let directory = root.path().canonicalize()?.join("local_generations");
  if create {
    match fs::create_dir(&directory) {
      Ok(()) => {},
      Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => {},
      Err(error) => return Err(error.into()),
    }
  }
  let metadata = fs::symlink_metadata(&directory)?;
  if metadata.file_type().is_symlink() || !metadata.is_dir() || directory.canonicalize()? != directory {
    bail!("Local generations directory is not an owned directory");
  }
  Ok(directory)
}

fn read_metadata(directory: &Path, id: &str) -> Result<Metadata> {
  validate_id(id)?;
  let path = directory.join(format!("{id}.json"));
  confined_file(directory, &path)?;
  let metadata: Metadata = serde_json::from_slice(&read_bounded(&path, MAX_METADATA_BYTES)?)?;
  let extensions: &[&str] = match metadata.media_class.as_str() {
    "image" => &["png", "jpg", "webp", "gif"],
    "video" => &["mp4"],
    _ => bail!("Invalid local media class"),
  };
  if metadata.id != id || !extensions.iter().any(|extension| metadata.filename == format!("{id}.{extension}")) {
    bail!("Invalid local generation metadata");
  }
  Ok(metadata)
}

fn kept_generation(directory: &Path, metadata: &Metadata) -> Result<KeptGeneration> {
  let path = confined_file(directory, &directory.join(&metadata.filename))?;
  Ok(KeptGeneration { token: MediaFileToken::new_from_str(&metadata.id), asset_url: asset_url(&path)? })
}

fn confined_file(directory: &Path, path: &Path) -> Result<PathBuf> {
  let metadata = fs::symlink_metadata(path)?;
  if metadata.file_type().is_symlink() || !metadata.is_file() || path.parent() != Some(directory) {
    bail!("Local image path is not an owned regular file");
  }
  let canonical = path.canonicalize()?;
  if canonical.parent() != Some(directory) {
    bail!("Local image path escaped local storage");
  }
  Ok(canonical)
}

fn validate_id(id: &str) -> Result<()> {
  let suffix = id.strip_prefix(LOCAL_PREFIX).context("Not a local generation token")?;
  if suffix.is_empty() || suffix.len() > 192 || !suffix.bytes().all(|byte| byte.is_ascii_alphanumeric() || byte == b'_') {
    bail!("Invalid local generation token");
  }
  Ok(())
}

fn validate_details(metadata: &Metadata, prompt: &str, model_id: &str, provider: &str) -> Result<()> {
  if metadata.prompt != prompt || metadata.model_id != model_id || metadata.provider != provider {
    bail!("Local generation identity changed");
  }
  Ok(())
}

fn read_bounded(path: &Path, limit: u64) -> Result<Vec<u8>> {
  let file = File::open(path)?;
  if file.metadata()?.len() > limit {
    bail!("Local generation file exceeds size limit");
  }
  let mut bytes = Vec::new();
  file.take(limit + 1).read_to_end(&mut bytes)?;
  if bytes.len() as u64 > limit {
    bail!("Local generation file exceeds size limit");
  }
  Ok(bytes)
}

fn validate_image(bytes: &[u8]) -> Result<&'static str> {
  let format = image::guess_format(bytes)?;
  let extension = match format {
    ImageFormat::Png => "png",
    ImageFormat::Jpeg => "jpg",
    ImageFormat::WebP => "webp",
    ImageFormat::Gif => "gif",
    _ => bail!("Unsupported local image format"),
  };
  let mut reader = ImageReader::with_format(Cursor::new(bytes), format);
  let mut limits = Limits::default();
  limits.max_image_width = Some(32_768);
  limits.max_image_height = Some(32_768);
  limits.max_alloc = Some(256 * 1024 * 1024);
  reader.limits(limits);
  reader.decode().context("Invalid local image bytes")?;
  Ok(extension)
}

fn read_image_bytes(path: &Path) -> Result<Vec<u8>> {
  let file = File::open(path)?;
  if file.metadata()?.len() > MAX_IMAGE_BYTES {
    return Err(InvalidLocalImage.into());
  }
  let mut bytes = Vec::new();
  file.take(MAX_IMAGE_BYTES + 1).read_to_end(&mut bytes)?;
  if bytes.len() as u64 > MAX_IMAGE_BYTES {
    return Err(InvalidLocalImage.into());
  }
  Ok(bytes)
}

fn image_class() -> String {
  "image".into()
}

pub fn validate_video_file(path: &Path) -> Result<()> {
  let mut file = File::open(path)?;
  let length = file.metadata()?.len();
  if length > 1024 * 1024 * 1024 || length < 32 {
    return Err(InvalidLocalImage.into());
  }
  let mut position = 0u64;
  let mut file_type = false;
  let mut movie = false;
  let mut data = false;
  let mut boxes = 0usize;
  while position < length {
    boxes += 1;
    if boxes > 100_000 { return Err(InvalidLocalImage.into()); }
    let mut header = [0u8; 8];
    if length - position < 8 {
      return Err(InvalidLocalImage.into());
    }
    file.read_exact(&mut header)?;
    let size = u32::from_be_bytes(header[..4].try_into().unwrap()) as u64;
    let (size, header_length) = if size == 1 {
      if length - position < 16 {
        return Err(InvalidLocalImage.into());
      }
      let mut extended = [0u8; 8];
      file.read_exact(&mut extended)?;
      (u64::from_be_bytes(extended), 16)
    } else if size == 0 {
      (length - position, 8)
    } else {
      (size, 8)
    };
    if size < header_length || size > length - position {
      return Err(InvalidLocalImage.into());
    }
    match &header[4..] {
      b"ftyp" => file_type = size >= 16,
      b"moov" => movie = size > header_length,
      b"mdat" => data = size > header_length,
      _ => {},
    }
    position += size;
    file.seek(SeekFrom::Start(position))?;
  }
  if !file_type || !movie || !data {
    return Err(InvalidLocalImage.into());
  }
  Ok(())
}

fn same_files(first: &Path, second: &Path) -> Result<bool> {
  let mut first = File::open(first)?;
  let mut second = File::open(second)?;
  if first.metadata()?.len() != second.metadata()?.len() {
    return Ok(false);
  }
  let mut first_bytes = [0; 64 * 1024];
  let mut second_bytes = [0; 64 * 1024];
  loop {
    let count = first.read(&mut first_bytes)?;
    second.read_exact(&mut second_bytes[..count])?;
    if first_bytes[..count] != second_bytes[..count] {
      return Ok(false);
    }
    if count == 0 {
      return Ok(true);
    }
  }
}

fn decode_path(encoded: &str) -> Result<String> {
  let bytes = encoded.as_bytes();
  let mut decoded = Vec::with_capacity(bytes.len());
  let mut position = 0;
  while position < bytes.len() {
    if bytes[position] == b'%' {
      let pair = bytes.get(position + 1..position + 3).context("Invalid asset path escape")?;
      let high = (pair[0] as char).to_digit(16).context("Invalid asset path escape")?;
      let low = (pair[1] as char).to_digit(16).context("Invalid asset path escape")?;
      decoded.push((high * 16 + low) as u8);
      position += 3;
    } else {
      decoded.push(bytes[position]);
      position += 1;
    }
  }
  String::from_utf8(decoded).map_err(|error| anyhow!(error))
}

#[cfg(test)]
mod tests {
  use super::*;
  use image::{DynamicImage, ImageFormat};
  use tempfile::TempDir;

  #[test]
  fn keeps_and_deletes_bounded_local_video_with_real_container_checks() {
    let (_temporary, root, source) = fixture();
    let bytes = minimal_mp4();
    fs::write(&source, &bytes).unwrap();
    let kept = keep_video_as(&root, "video:0", &source, "prompt", "seedance_2p0", "wavespeed").unwrap();
    let output = resolve_asset_url(&root, &kept.asset_url).unwrap();
    assert_eq!(fs::read(&output).unwrap(), bytes);
    assert_eq!(list(&root).unwrap()[0].media_class, "video");
    assert!(keep_as(&root, "video:0", &source, "prompt", "seedance_2p0", "wavespeed").is_err());
    let again = keep_video_as(&root, "video:0", &source, "prompt", "seedance_2p0", "wavespeed").unwrap();
    assert_eq!(again.token, kept.token);
    delete(&root, kept.token.as_str()).unwrap();
    assert!(list(&root).unwrap().is_empty());
    for invalid in [b"not a video".as_slice(), &bytes[..20], b"\0\0\0\x08ftyp\0\0\0\x08moov\0\0\0\x08mdat"] {
      fs::write(&source, invalid).unwrap();
      assert!(validate_video_file(&source).is_err());
    }
  }

  #[test]
  fn saves_valid_image_bytes_and_idempotent_metadata() {
    let (temporary, root, source) = fixture();
    let first = keep_as(&root, "job:0", &source, "prompt", "model", "wavespeed").unwrap();
    let original = list(&root).unwrap();
    fs::remove_file(&source).unwrap();
    let second = keep_as(&root, "job:0", &source, "prompt", "model", "wavespeed").unwrap();
    assert_eq!(first.asset_url, second.asset_url);
    assert_eq!(original[0].created_at, list(&root).unwrap()[0].created_at);
    assert!(resolve_asset_url(&root, &first.asset_url).unwrap().starts_with(temporary.path()));
    let encoded = serde_json::to_value(&original).unwrap();
    assert!(encoded[0]["created_at"].as_str().unwrap().contains('T'));
    assert!(keep_as(&root, "job:0", &source, "changed prompt", "model", "wavespeed").is_err());
  }

  #[test]
  fn punctuation_seeds_are_distinct_and_delete_is_idempotent() {
    let (_temporary, root, source) = fixture();
    let first = keep_as(&root, "job:0", &source, "prompt", "model", "wavespeed").unwrap();
    let second = keep_as(&root, "job_0", &source, "prompt", "model", "wavespeed").unwrap();
    assert_ne!(first.asset_url, second.asset_url);
    let records = list(&root).unwrap();
    delete(&root, &records[0].id).unwrap();
    delete(&root, &records[0].id).unwrap();
    assert_eq!(list(&root).unwrap().len(), 1);
    assert!(delete(&root, "local_file_../../other").is_err());
  }

  #[test]
  fn rejects_non_images_and_truncated_images() {
    let (_temporary, root, source) = fixture();
    fs::write(&source, b"not an image").unwrap();
    assert!(keep_as(&root, "bad", &source, "", "", "").is_err());
    fs::write(&source, b"\x89PNG\r\n\x1a\n").unwrap();
    assert!(keep_as(&root, "bad", &source, "", "", "").is_err());
    assert!(list(&root).unwrap().is_empty());
  }

  #[test]
  fn asset_paths_are_strict_and_bound_to_the_actual_root() {
    let (_temporary, root, source) = fixture();
    let kept = keep_as(&root, "job", &source, "", "", "").unwrap();
    let unrelated = TempDir::new().unwrap();
    let unrelated_root = AppDataRoot::create_existing(unrelated.path()).unwrap();
    assert!(resolve_asset_url(&unrelated_root, &kept.asset_url).is_err());
    assert!(resolve_asset_url(&root, &asset_url(&source).unwrap()).is_err());
    for encoded in ["%+1", "%1", "%GG", "%", "%FF"] {
      assert!(decode_path(encoded).is_err());
    }
    let mut with_query = kept.asset_url.clone();
    with_query.set_query(Some("x=1"));
    assert!(resolve_asset_url(&root, &with_query).is_err());
  }

  #[cfg(unix)]
  #[test]
  fn rejects_symlinked_storage_and_files() {
    use std::os::unix::fs::symlink;
    let (_temporary, root, source) = fixture();
    let kept = keep_as(&root, "job", &source, "", "", "").unwrap();
    let path = resolve_asset_url(&root, &kept.asset_url).unwrap();
    fs::remove_file(&path).unwrap();
    symlink(&source, &path).unwrap();
    assert!(resolve_asset_url(&root, &kept.asset_url).is_err());
    assert!(list(&root).unwrap().is_empty());
    let unrelated = TempDir::new().unwrap();
    let unrelated_root = AppDataRoot::create_existing(unrelated.path()).unwrap();
    symlink(root.path().join("local_generations"), unrelated_root.path().join("local_generations")).unwrap();
    assert!(list(&unrelated_root).is_err());
  }

  fn fixture() -> (TempDir, AppDataRoot, PathBuf) {
    let temporary = TempDir::new().unwrap();
    let root = AppDataRoot::create_existing(temporary.path()).unwrap();
    let source = temporary.path().join("source.misleading");
    let mut encoded = Cursor::new(Vec::new());
    DynamicImage::new_rgb8(2, 2).write_to(&mut encoded, ImageFormat::Png).unwrap();
    fs::write(&source, encoded.into_inner()).unwrap();
    (temporary, root, source)
  }

  fn minimal_mp4() -> Vec<u8> {
    let mut bytes = Vec::new();
    for (kind, body) in [(b"ftyp", b"isom\0\0\0\0".as_slice()), (b"moov", b"\0\0\0\x08mvhd".as_slice()), (b"mdat", b"media".as_slice())] {
      bytes.extend_from_slice(&((body.len() + 8) as u32).to_be_bytes());
      bytes.extend_from_slice(kind);
      bytes.extend_from_slice(body);
    }
    bytes
  }
}
