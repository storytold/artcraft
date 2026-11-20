use serde::{Deserialize, Deserializer, Serialize};
use std::fs::OpenOptions;
use std::io::{self, Read};
use std::path::{Path, PathBuf};

pub const MAX_THEME_BYTES: u64 = 16 * 1024;

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Palette {
  pub background: HexColor,
  pub surface: HexColor,
  pub border: HexColor,
  pub text: HexColor,
  pub text_dim: HexColor,
  pub accent: HexColor,
  pub accent_text: HexColor,
  pub danger: HexColor,
  pub warning: HexColor,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct HexColor(String);

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
#[serde(tag = "status", rename_all = "camelCase")]
pub enum ThemeUpdate {
  Ready { palette: Box<Palette> },
  Error { reason: ThemeError },
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ThemeError {
  Missing,
  Invalid,
  TooLarge,
  Unreadable,
  WatchError,
}

impl<'de> Deserialize<'de> for HexColor {
  fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
    let value = String::deserialize(deserializer)?;
    let bytes = value.as_bytes();
    if bytes.len() != 7 || bytes.first() != Some(&b'#') || !bytes.iter().skip(1).all(u8::is_ascii_hexdigit) {
      return Err(serde::de::Error::custom("expected a #RRGGBB color"));
    }
    Ok(Self(value.to_ascii_lowercase()))
  }
}

pub fn theme_path() -> Option<PathBuf> {
  // dirs follows XDG_CONFIG_HOME (falling back to ~/.config) on Linux.
  dirs::config_dir().map(|root| root.join("ai.artcraft.app").join("theme.json"))
}

pub fn read_theme(path: &Path) -> ThemeUpdate {
  match read_palette(path) {
    Ok(palette) => ThemeUpdate::Ready { palette: Box::new(palette) },
    Err(reason) => ThemeUpdate::Error { reason },
  }
}

fn read_palette(path: &Path) -> Result<Palette, ThemeError> {
  // Check before opening so a user-created FIFO/device cannot block the worker.
  let metadata = path.symlink_metadata().map_err(file_error)?;
  if !metadata.is_file() {
    return Err(ThemeError::Unreadable);
  }
  if metadata.len() > MAX_THEME_BYTES {
    return Err(ThemeError::TooLarge);
  }
  let mut options = OpenOptions::new();
  options.read(true);
  #[cfg(unix)]
  {
    use std::os::unix::fs::OpenOptionsExt;
    // A rename between metadata and open must not follow a link or block on a FIFO.
    options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
  }
  let file = options.open(path).map_err(file_error)?;
  if !file.metadata().map_err(file_error)?.is_file() {
    return Err(ThemeError::Unreadable);
  }
  read_palette_bytes(file)
}

fn read_palette_bytes(reader: impl Read) -> Result<Palette, ThemeError> {
  // Bound the read itself too: the file can grow after the metadata check.
  let mut bytes = Vec::new();
  reader.take(MAX_THEME_BYTES + 1).read_to_end(&mut bytes).map_err(file_error)?;
  if bytes.len() as u64 > MAX_THEME_BYTES {
    return Err(ThemeError::TooLarge);
  }
  // All nine fields are required, so a partial save never applies a partial palette.
  serde_json::from_slice(&bytes).map_err(|_| ThemeError::Invalid)
}

fn file_error(error: io::Error) -> ThemeError {
  if error.kind() == io::ErrorKind::NotFound {
    ThemeError::Missing
  } else {
    ThemeError::Unreadable
  }
}

#[cfg(test)]
pub(crate) mod tests {
  use super::*;
  use std::io::Cursor;

  pub const VALID: &str = r##"{"background":"#112233","surface":"#223344","border":"#334455","text":"#eeeeee","textDim":"#aabbcc","accent":"#44aaff","accentText":"#000000","danger":"#ff0000","warning":"#ffaa00"}"##;

  #[test]
  fn parses_complete_palette_and_normalizes_hex() {
    let palette = read_palette_bytes(Cursor::new(VALID.replace("#aabbcc", "#AaBbCc"))).unwrap();
    assert_eq!(palette.text_dim.0, "#aabbcc");
    assert_eq!(serde_json::to_value(&palette).unwrap()["accentText"], "#000000");
  }

  #[test]
  fn ignores_unknown_properties_even_with_css_text() {
    let input = VALID.replace("{", r#"{"unknown":{"css":"url(evil); color: red"},"#);
    assert_eq!(read_palette_bytes(Cursor::new(input)), read_palette_bytes(Cursor::new(VALID)));
  }

  #[test]
  fn rejects_invalid_colors_for_every_field() {
    for key in ["background", "surface", "border", "text", "textDim", "accent", "accentText", "danger", "warning"] {
      for invalid in ["#abc", "#12345678", "123456", "#gg0000", "#123456\n", " #123456", "red", "rgb(1,2,3)", "#123456; color: red", "#１２３４５６"] {
        let mut json: serde_json::Value = serde_json::from_str(VALID).unwrap();
        json[key] = invalid.into();
        assert_eq!(read_palette_bytes(Cursor::new(json.to_string())), Err(ThemeError::Invalid), "{key}={invalid}");
      }
    }
  }

  #[test]
  fn rejects_missing_fields_and_wrong_types() {
    let complete: serde_json::Value = serde_json::from_str(VALID).unwrap();
    for key in ["background", "surface", "border", "text", "textDim", "accent", "accentText", "danger", "warning"] {
      let mut json = complete.clone();
      json.as_object_mut().unwrap().remove(key);
      assert_eq!(read_palette_bytes(Cursor::new(json.to_string())), Err(ThemeError::Invalid));
      for value in [serde_json::Value::Null, serde_json::json!(12), serde_json::json!([])] {
        let mut json = complete.clone();
        json[key] = value;
        assert_eq!(read_palette_bytes(Cursor::new(json.to_string())), Err(ThemeError::Invalid));
      }
    }
  }

  #[test]
  fn rejects_corrupt_partial_and_duplicate_json() {
    for json in ["", "{", "null", "[]", "{}", &format!("{VALID}garbage"), &VALID.replace("{", r##"{"text":"#000000","##)] {
      assert_eq!(read_palette_bytes(Cursor::new(json)), Err(ThemeError::Invalid));
    }
    assert_eq!(read_palette_bytes(Cursor::new([0xff])), Err(ThemeError::Invalid));
  }

  #[test]
  fn bounds_the_actual_read_and_reports_read_errors() {
    assert_eq!(read_palette_bytes(io::repeat(b' ')), Err(ThemeError::TooLarge));
    assert_eq!(read_palette_bytes(FailingReader), Err(ThemeError::Unreadable));
    let padded = format!("{VALID}{}", " ".repeat(MAX_THEME_BYTES as usize - VALID.len()));
    assert!(read_palette_bytes(Cursor::new(padded)).is_ok());
  }

  #[test]
  fn reads_regular_files_and_reports_missing_corrupt_and_oversized_files() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("theme.json");
    assert_eq!(read_theme(&path), ThemeUpdate::Error { reason: ThemeError::Missing });
    std::fs::write(&path, VALID).unwrap();
    assert!(matches!(read_theme(&path), ThemeUpdate::Ready { .. }));
    std::fs::write(&path, "{").unwrap();
    assert_eq!(read_theme(&path), ThemeUpdate::Error { reason: ThemeError::Invalid });
    std::fs::write(&path, vec![b' '; MAX_THEME_BYTES as usize + 1]).unwrap();
    assert_eq!(read_theme(&path), ThemeUpdate::Error { reason: ThemeError::TooLarge });
    assert_eq!(read_theme(dir.path()), ThemeUpdate::Error { reason: ThemeError::Unreadable });
  }

  #[cfg(unix)]
  #[test]
  fn reports_unreadable_file_and_rejects_symlinks() {
    use std::os::unix::fs::{symlink, PermissionsExt};
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("private.json");
    let link = dir.path().join("theme.json");
    std::fs::write(&path, VALID).unwrap();
    symlink(&path, &link).unwrap();
    assert_eq!(read_theme(&link), ThemeUpdate::Error { reason: ThemeError::Unreadable });
    std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o000)).unwrap();
    assert_eq!(read_theme(&path), ThemeUpdate::Error { reason: ThemeError::Unreadable });
  }

  struct FailingReader;
  impl Read for FailingReader {
    fn read(&mut self, _: &mut [u8]) -> io::Result<usize> {
      Err(io::Error::new(io::ErrorKind::PermissionDenied, "test"))
    }
  }
}
