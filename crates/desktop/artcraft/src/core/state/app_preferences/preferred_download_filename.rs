use chrono::{DateTime, Datelike, Local, Timelike};
use serde_derive::{Deserialize, Serialize};

/// Characters that may never appear in a download filename (or a custom
/// filename format): path separators, traversal, quoting, and shell-unsafe
/// characters.
const UNSAFE_CHARACTERS: &[char] = &['/', '\\', '\'', '"', '`', '%', '<', '>', '|', ':', '*', '?', '\0'];

/// How downloaded generation files are named on disk.
///
/// Stored in the app preferences file. NEVER change existing serialized
/// values; only add new ones.
#[derive(Debug, Clone, Serialize, Deserialize, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PreferredDownloadFilename {
  /// `{model}_{date}(_{batch_index}).{ext}`
  ///  - model slug, eg. "seedance_2.0", "flux_pro_1.1"
  ///  - date is "YYYY-MM-DD-HH-MM-SS" (download time)
  ///  - batch index is 1-n when the job produced more than one file
  ///  - ext matches the cloud file (jpg, png, mp4, ...)
  ///
  /// NB: Serializes as `"artcraft_convention"` in JSON.
  ArtcraftConvention,

  /// A user-defined format string. Supported tokens:
  ///  - `{model}` — the model slug
  ///  - `{date}` — "YYYY-MM-DD-HH-MM-SS" (download time)
  ///  - `{YYYY}`, `{YY}`, `{MM}`, `{DD}`, `{HH}`, `{mm}`, `{SS}` — date parts
  ///  - `{batch_index}` — 1-n (appended automatically when the job produced
  ///    more than one file and the format doesn't include it)
  ///
  /// Slash, quote, and other unsafe characters are rejected.
  ///
  /// NB: Serializes as `{"custom_format": "..."}` in JSON. (The key is NOT
  /// "custom" so it can't be confused with `PreferredDownloadDirectory`'s
  /// custom variant in loosely-typed payloads.)
  #[serde(rename = "custom_format")]
  Custom(String),
}

impl Default for PreferredDownloadFilename {
  fn default() -> Self {
    Self::ArtcraftConvention
  }
}

/// Everything needed to render a download filename.
pub struct DownloadFilenameParts<'a> {
  /// Model slug, eg. "seedance_2.0". Use [`model_slug_from_model_type_str`].
  pub model_slug: &'a str,

  /// The download time.
  pub download_time: DateTime<Local>,

  /// 1-based index when the job produced more than one file.
  pub maybe_batch_index: Option<usize>,

  /// File extension without the leading dot, matching the cloud file.
  pub extension: &'a str,
}

impl PreferredDownloadFilename {
  /// Render the filename (including extension) for one downloaded file.
  /// The output is sanitized: unsafe characters can never appear.
  pub fn build_filename(&self, parts: &DownloadFilenameParts<'_>) -> String {
    let stem = match self {
      Self::ArtcraftConvention => {
        let mut stem = format!("{}_{}", parts.model_slug, full_date_string(&parts.download_time),);
        if let Some(index) = parts.maybe_batch_index {
          stem.push_str(&format!("_{index}"));
        }
        stem
      },
      Self::Custom(format) => {
        let mut stem = expand_format_tokens(format, parts);
        let has_batch_token = format.contains("{batch_index}");
        if !has_batch_token {
          if let Some(index) = parts.maybe_batch_index {
            stem.push_str(&format!("_{index}"));
          }
        }
        stem
      },
    };

    // Leave room for an extension and a collision suffix on common filesystems.
    let mut stem = sanitize(&stem);
    while stem.len() > 200 {
      stem.pop();
    }
    if stem.is_empty() {
      stem = "artcraft".to_string();
    }
    let device_name = stem.split('.').next().unwrap_or_default().to_ascii_uppercase();
    if matches!(device_name.as_str(), "CON" | "PRN" | "AUX" | "NUL")
      || (device_name.len() == 4
        && (device_name.starts_with("COM") || device_name.starts_with("LPT"))
        && matches!(device_name.as_bytes()[3], b'1'..=b'9'))
    {
      stem.insert_str(0, "artcraft_");
    }
    let extension = sanitize(parts.extension);
    let extension = if extension.is_empty() { "bin" } else { &extension };

    format!("{stem}.{extension}")
  }

  /// Vet a user-supplied custom format string.
  pub fn validate_custom_format(format: &str) -> Result<(), String> {
    if format.trim().is_empty() {
      return Err("Filename format cannot be empty".to_string());
    }
    if format.contains("..") {
      return Err("Filename format cannot contain '..'".to_string());
    }
    if let Some(bad) = format.chars().find(|c| UNSAFE_CHARACTERS.contains(c) || c.is_control()) {
      return Err(format!("Filename format cannot contain {bad:?}"));
    }
    Ok(())
  }
}

/// Derive a friendly model slug from a `TaskModelType` string value:
/// version markers like "2p0" become "2.0" (eg. "seedance_2p0" ->
/// "seedance_2.0", "flux_pro_1p1" -> "flux_pro_1.1").
pub fn model_slug_from_model_type_str(model_type: &str) -> String {
  let mut slug = String::with_capacity(model_type.len());
  let chars = model_type.chars().collect::<Vec<_>>();
  for (i, c) in chars.iter().enumerate() {
    let is_version_dot =
      *c == 'p' && i > 0 && i + 1 < chars.len() && chars[i - 1].is_ascii_digit() && chars[i + 1].is_ascii_digit();
    slug.push(if is_version_dot { '.' } else { *c });
  }
  slug
}

fn full_date_string(time: &DateTime<Local>) -> String {
  format!(
    "{:04}-{:02}-{:02}-{:02}-{:02}-{:02}",
    time.year(),
    time.month(),
    time.day(),
    time.hour(),
    time.minute(),
    time.second(),
  )
}

fn expand_format_tokens(format: &str, parts: &DownloadFilenameParts<'_>) -> String {
  let time = &parts.download_time;
  format
    .replace("{model}", parts.model_slug)
    .replace("{date}", &full_date_string(time))
    .replace("{YYYY}", &format!("{:04}", time.year()))
    .replace("{YY}", &format!("{:02}", time.year() % 100))
    .replace("{MM}", &format!("{:02}", time.month()))
    .replace("{DD}", &format!("{:02}", time.day()))
    .replace("{HH}", &format!("{:02}", time.hour()))
    .replace("{mm}", &format!("{:02}", time.minute()))
    .replace("{SS}", &format!("{:02}", time.second()))
    .replace(
      "{batch_index}",
      &parts.maybe_batch_index.map(|i| i.to_string()).unwrap_or_default(),
    )
}

/// Strip anything unsafe out of a rendered filename component.
fn sanitize(value: &str) -> String {
  value
    .chars()
    .filter(|c| !UNSAFE_CHARACTERS.contains(c) && !c.is_control())
    .collect::<String>()
    .replace("..", "_")
    .trim_matches(|c: char| c.is_whitespace() || c == '.')
    .to_string()
}

#[cfg(test)]
mod tests {
  use super::*;
  use chrono::TimeZone;

  mod artcraft_convention {
    use super::*;

    #[test]
    fn single_file() {
      let name = PreferredDownloadFilename::ArtcraftConvention.build_filename(&DownloadFilenameParts {
        model_slug: "seedance_2.0",
        download_time: test_time(),
        maybe_batch_index: None,
        extension: "mp4",
      });
      assert_eq!(name, "seedance_2.0_2026-08-05-14-30-09.mp4");
    }

    #[test]
    fn batch_file() {
      let name = PreferredDownloadFilename::ArtcraftConvention.build_filename(&DownloadFilenameParts {
        model_slug: "flux_pro_1.1",
        download_time: test_time(),
        maybe_batch_index: Some(3),
        extension: "png",
      });
      assert_eq!(name, "flux_pro_1.1_2026-08-05-14-30-09_3.png");
    }
  }

  mod custom_format {
    use super::*;

    #[test]
    fn tokens_expand() {
      let format = PreferredDownloadFilename::Custom("{model}-{YYYY}{MM}{DD}-{HH}{mm}{SS}".to_string());
      let name = format.build_filename(&DownloadFilenameParts {
        model_slug: "nano_banana",
        download_time: test_time(),
        maybe_batch_index: None,
        extension: "jpg",
      });
      assert_eq!(name, "nano_banana-20260805-143009.jpg");
    }

    #[test]
    fn batch_index_token() {
      let format = PreferredDownloadFilename::Custom("gen_{batch_index}".to_string());
      let name = format.build_filename(&DownloadFilenameParts {
        model_slug: "unused",
        download_time: test_time(),
        maybe_batch_index: Some(2),
        extension: "png",
      });
      assert_eq!(name, "gen_2.png");
    }

    #[test]
    fn batch_index_appended_when_absent_from_format() {
      let format = PreferredDownloadFilename::Custom("gen".to_string());
      let name = format.build_filename(&DownloadFilenameParts {
        model_slug: "unused",
        download_time: test_time(),
        maybe_batch_index: Some(2),
        extension: "png",
      });
      assert_eq!(name, "gen_2.png");
    }

    #[test]
    fn empty_expansions_reserved_names_and_long_unicode_names_are_portable() {
      let parts = DownloadFilenameParts {
        model_slug: "midjourney_8",
        download_time: test_time(),
        maybe_batch_index: None,
        extension: "png",
      };
      assert_eq!(
        PreferredDownloadFilename::Custom("{batch_index}".into()).build_filename(&parts),
        "artcraft.png"
      );
      assert_eq!(
        PreferredDownloadFilename::Custom("CON".into()).build_filename(&parts),
        "artcraft_CON.png"
      );
      let name = PreferredDownloadFilename::Custom("画".repeat(150)).build_filename(&parts);
      assert!(name.len() < 240);
      assert!(name.ends_with(".png"));
    }

    #[test]
    fn unsafe_characters_stripped_from_output() {
      let format = PreferredDownloadFilename::Custom("weird{model}".to_string());
      let name = format.build_filename(&DownloadFilenameParts {
        model_slug: "a/b\\c\"d",
        download_time: test_time(),
        maybe_batch_index: None,
        extension: "png",
      });
      assert_eq!(name, "weirdabcd.png");
    }
  }

  mod validation {
    use super::*;

    #[test]
    fn accepts_reasonable_formats() {
      assert!(PreferredDownloadFilename::validate_custom_format("{model}_{date}").is_ok());
      assert!(PreferredDownloadFilename::validate_custom_format("my file {YYYY}").is_ok());
    }

    #[test]
    fn rejects_unsafe_formats() {
      assert!(PreferredDownloadFilename::validate_custom_format("").is_err());
      assert!(PreferredDownloadFilename::validate_custom_format("a/b").is_err());
      assert!(PreferredDownloadFilename::validate_custom_format("a\\b").is_err());
      assert!(PreferredDownloadFilename::validate_custom_format("a\"b").is_err());
      assert!(PreferredDownloadFilename::validate_custom_format("a'b").is_err());
      assert!(PreferredDownloadFilename::validate_custom_format("../etc").is_err());
    }
  }

  mod model_slug {
    use super::*;

    #[test]
    fn version_markers_become_dots() {
      assert_eq!(model_slug_from_model_type_str("seedance_2p0"), "seedance_2.0");
      assert_eq!(model_slug_from_model_type_str("flux_pro_1p1"), "flux_pro_1.1");
      assert_eq!(model_slug_from_model_type_str("seedream_5p0_pro_u"), "seedream_5.0_pro_u");
    }

    #[test]
    fn non_version_names_unchanged() {
      assert_eq!(model_slug_from_model_type_str("nano_banana"), "nano_banana");
      assert_eq!(model_slug_from_model_type_str("midjourney_8"), "midjourney_8");
      assert_eq!(model_slug_from_model_type_str("marble_1p1_plus"), "marble_1.1_plus");
    }
  }

  mod serialization {
    use super::*;

    #[test]
    fn artcraft_convention_serializes_as_string() {
      let val = PreferredDownloadFilename::ArtcraftConvention;
      assert_eq!(serde_json::to_string(&val).unwrap(), "\"artcraft_convention\"");
    }

    #[test]
    fn custom_serializes_with_custom_format_key() {
      let val = PreferredDownloadFilename::Custom("{model}_{date}".to_string());
      assert_eq!(serde_json::to_string(&val).unwrap(), "{\"custom_format\":\"{model}_{date}\"}");
    }

    #[test]
    fn round_trips() {
      for val in [
        PreferredDownloadFilename::ArtcraftConvention,
        PreferredDownloadFilename::Custom("{model}".to_string()),
      ] {
        let json = serde_json::to_string(&val).unwrap();
        let back: PreferredDownloadFilename = serde_json::from_str(&json).unwrap();
        assert_eq!(back, val);
      }
    }
  }

  fn test_time() -> DateTime<Local> {
    Local.with_ymd_and_hms(2026, 8, 5, 14, 30, 9).unwrap()
  }
}
