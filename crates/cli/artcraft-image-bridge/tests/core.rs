use artcraft_image_bridge::Bridge;
use image::{Rgba, RgbaImage};
use std::{fs, path::PathBuf};
use tempfile::TempDir;
use uuid::Uuid;

struct Fixture {
  _temp: TempDir,
  root: PathBuf,
  state: PathBuf,
  image: PathBuf,
}

#[test]
fn preserves_alpha_and_bytes_across_retry_and_restart() -> anyhow::Result<()> {
  let f = fixture()?;
  let bridge = Bridge::new(&f.root, &f.state, true)?;
  let info = bridge.inspect(&f.image)?;
  assert_eq!((info.width, info.height, info.has_alpha), (2, 3, true));
  let id = Uuid::new_v4();
  let first = bridge.import(&f.image, &info.sha256, id)?;
  assert_eq!(first.status, "mock_verified");
  assert_eq!(first.backend, "local_mock_only");
  assert!(first.maybe_media_file_token.is_none());
  assert_eq!(
    fs::read(&f.image)?,
    fs::read(f.state.join(format!("mock-{id}.image")))?
  );
  bridge.import(&f.image, &info.sha256, id)?;
  drop(bridge);
  let restarted = Bridge::new(&f.root, &f.state, true)?;
  assert_eq!(restarted.get(id)?.unwrap().image.sha256, info.sha256);
  assert_eq!(fs::read_dir(&f.state)?.count(), 3); // lock, record and one image
  Ok(())
}

#[test]
fn rejects_changed_hash_and_request_id_reuse() -> anyhow::Result<()> {
  let f = fixture()?;
  let b = Bridge::new(&f.root, &f.state, true)?;
  let old = b.inspect(&f.image)?;
  let id = Uuid::new_v4();
  b.import(&f.image, &old.sha256, id)?;
  RgbaImage::from_pixel(2, 3, Rgba([4, 3, 2, 1])).save(&f.image)?;
  assert!(b.import(&f.image, &old.sha256, Uuid::new_v4()).is_err());
  assert!(b
    .import(&f.image, &b.inspect(&f.image)?.sha256, id)
    .is_err());
  Ok(())
}

#[test]
fn blocks_unconfigured_live_import_but_allows_state_reuse() -> anyhow::Result<()> {
  let f = fixture()?;
  let b = Bridge::new(&f.root, &f.state, false)?;
  assert!(Bridge::new(&f.root, &f.state, true).is_ok());
  assert!(b
    .import(&f.image, &b.inspect(&f.image)?.sha256, Uuid::new_v4())
    .is_err());
  assert!(Bridge::new(&f.root, &f.root.join("state"), true).is_err());
  Ok(())
}

#[test]
fn rejects_outside_root_relative_directory_corrupt_and_oversize_files() -> anyhow::Result<()> {
  let f = fixture()?;
  let b = Bridge::new(&f.root, &f.state, true)?;
  let outside = f._temp.path().join("outside.png");
  fs::copy(&f.image, &outside)?;
  assert!(b.inspect(&outside).is_err());
  assert!(b.inspect(std::path::Path::new("image.png")).is_err());
  assert!(b.inspect(&f.root).is_err());
  let bad = f.root.join("bad.png");
  fs::write(&bad, b"not an image")?;
  assert!(b.inspect(&bad).is_err());
  let huge = f.root.join("huge.png");
  fs::File::create(&huge)?.set_len(21 * 1024 * 1024)?;
  assert!(b.inspect(&huge).is_err());
  Ok(())
}

#[test]
fn detects_corrupted_mock_readback() -> anyhow::Result<()> {
  let f = fixture()?;
  let b = Bridge::new(&f.root, &f.state, true)?;
  let id = Uuid::new_v4();
  b.import(&f.image, &b.inspect(&f.image)?.sha256, id)?;
  fs::write(f.state.join(format!("mock-{id}.image")), b"corrupted")?;
  assert!(b.get(id).is_err());
  Ok(())
}

#[test]
fn recovers_pending_request_without_creating_second_object() -> anyhow::Result<()> {
  let f = fixture()?;
  let b = Bridge::new(&f.root, &f.state, true)?;
  let id = Uuid::new_v4();
  let info = b.inspect(&f.image)?;
  let mut record = b.import(&f.image, &info.sha256, id)?;
  record.status = "pending".into();
  fs::write(
    f.state.join(format!("{id}.json")),
    serde_json::to_vec(&record)?,
  )?;
  drop(b);
  let b = Bridge::new(&f.root, &f.state, true)?;
  assert_eq!(
    b.import(&f.image, &info.sha256, id)?.status,
    "mock_verified"
  );
  assert_eq!(fs::read_dir(&f.state)?.count(), 3);
  Ok(())
}

#[test]
fn accepts_jpeg_content_and_rejects_truncated_png() -> anyhow::Result<()> {
  let f = fixture()?;
  let b = Bridge::new(&f.root, &f.state, true)?;
  let jpg = f.root.join("image.jpg");
  image::RgbImage::new(3, 4).save(&jpg)?;
  let info = b.inspect(&jpg)?;
  assert_eq!(info.mime_type, "image/jpeg");
  assert!(!info.has_alpha);
  let bytes = fs::read(&f.image)?;
  fs::write(&f.image, &bytes[..bytes.len() / 2])?;
  assert!(b.inspect(&f.image).is_err());
  Ok(())
}

#[cfg(windows)]
#[test]
fn rejects_windows_junction_escape_and_alternate_streams() -> anyhow::Result<()> {
  use std::os::windows::process::CommandExt;
  let f = fixture()?;
  let outside = f._temp.path().join("outside");
  fs::create_dir(&outside)?;
  fs::copy(&f.image, outside.join("escape.png"))?;
  let link = f.root.join("linked");
  let output = std::process::Command::new("cmd.exe")
    .args(["/d", "/c", "mklink", "/J"])
    .arg(&link)
    .arg(&outside)
    .creation_flags(0x08000000)
    .output()?;
  assert!(
    output.status.success(),
    "Could not create the junction test fixture"
  );
  let b = Bridge::new(&f.root, &f.state, true)?;
  assert!(b.inspect(&link.join("escape.png")).is_err());
  assert!(b
    .inspect(&PathBuf::from(format!("{}:hidden", f.image.display())))
    .is_err());
  // Remove only the junction itself, before the temporary directory is cleaned up.
  fs::remove_dir(&link)?;
  Ok(())
}

fn fixture() -> anyhow::Result<Fixture> {
  let temp = tempfile::tempdir()?;
  let root = temp.path().join("images");
  fs::create_dir(&root)?;
  let state = temp.path().join("state");
  let image = root.join("image.png");
  RgbaImage::from_pixel(2, 3, Rgba([10, 20, 30, 128])).save(&image)?;
  Ok(Fixture {
    _temp: temp,
    root,
    state,
    image,
  })
}
