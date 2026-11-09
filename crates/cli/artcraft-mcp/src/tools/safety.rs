use std::collections::{HashMap, VecDeque};
use std::path::{Component, Path, PathBuf};
use std::sync::Mutex;
use std::time::{Duration, Instant};

use anyhow::{anyhow, bail, Result};
use log::info;
use serde_json::Value;

// Upload size caps by media kind.
pub const MAX_UPLOAD_IMAGE_BYTES: u64 = 50 * 1024 * 1024;
pub const MAX_UPLOAD_VIDEO_BYTES: u64 = 512 * 1024 * 1024;
pub const MAX_UPLOAD_AUDIO_BYTES: u64 = 100 * 1024 * 1024;
pub const MAX_DOWNLOAD_BYTES: u64 = 512 * 1024 * 1024;
pub const MAX_FILENAME_LEN: usize = 128;

pub const IMAGE_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "webp", "gif", "bmp", "avif"];
pub const VIDEO_EXTENSIONS: &[&str] = &["mp4", "mov", "webm", "mkv", "m4v"];
pub const AUDIO_EXTENSIONS: &[&str] = &["mp3", "wav", "ogg", "flac", "m4a", "aac", "opus"];

const RATE_WINDOW: Duration = Duration::from_secs(60);
const RATE_MAX_CALLS: usize = 10;
const MAX_TEXT_FIELD_LEN: usize = 4000;
const MAX_IDEMPOTENCY_TOKEN_LEN: usize = 128;

static RATE_LIMITER: Mutex<Option<HashMap<String, VecDeque<Instant>>>> = Mutex::new(None);

/// Require an explicit `confirm: true` argument for paid, destructive,
/// privacy-changing, or local-file-reading actions.
pub fn require_confirm(arguments: &Value, action_description: &str) -> Result<()> {
    match arguments.get("confirm").and_then(|v| v.as_bool()) {
        Some(true) => Ok(()),
        _ => Err(anyhow!(
            "Confirmation required: {}. Re-run with \"confirm\": true after the user approves.",
            action_description
        )),
    }
}

/// Optional client-supplied idempotency token; falls back to a fresh UUID so
/// retries with the same key cannot duplicate paid work.
pub fn idempotency_token(arguments: &Value) -> Result<String> {
    match arguments.get("idempotency_token").and_then(|v| v.as_str()) {
        Some(t) => {
            let t = t.trim();
            if t.is_empty() || t.len() > MAX_IDEMPOTENCY_TOKEN_LEN {
                bail!("idempotency_token must be 1-{} characters", MAX_IDEMPOTENCY_TOKEN_LEN);
            }
            if !t.chars().all(|c| c.is_ascii_graphic()) {
                bail!("idempotency_token must contain only printable ASCII characters");
            }
            Ok(t.to_string())
        }
        None => Ok(uuid::Uuid::new_v4().to_string()),
    }
}

pub fn bounded_u64(args: &Value, name: &str, min: u64, max: u64) -> Result<Option<u64>> {
    match args.get(name) {
        None | Some(Value::Null) => Ok(None),
        Some(v) => {
            let n = v.as_u64().ok_or_else(|| anyhow!("{} must be an integer", name))?;
            if n < min || n > max {
                bail!("{} must be between {} and {} (got {})", name, min, max, n);
            }
            Ok(Some(n))
        }
    }
}

pub fn bounded_f64(args: &Value, name: &str, min: f64, max: f64) -> Result<Option<f64>> {
    match args.get(name) {
        None | Some(Value::Null) => Ok(None),
        Some(v) => {
            let n = v.as_f64().ok_or_else(|| anyhow!("{} must be a number", name))?;
            if !n.is_finite() || n < min || n > max {
                bail!("{} must be between {} and {} (got {})", name, min, max, n);
            }
            Ok(Some(n))
        }
    }
}

pub fn bounded_str<'a>(args: &'a Value, name: &str, max_len: usize) -> Result<Option<&'a str>> {
    match args.get(name).and_then(|v| v.as_str()) {
        None => Ok(None),
        Some(s) if s.len() > max_len => {
            bail!("{} exceeds maximum length of {} characters", name, max_len)
        }
        Some(s) => Ok(Some(s)),
    }
}

pub fn bounded_array<'a>(args: &'a Value, name: &str, max_items: usize) -> Result<Option<&'a Vec<Value>>> {
    match args.get(name) {
        None | Some(Value::Null) => Ok(None),
        Some(v) => {
            let arr = v.as_array().ok_or_else(|| anyhow!("{} must be an array", name))?;
            if arr.len() > max_items {
                bail!("{} allows at most {} items (got {})", name, max_items, arr.len());
            }
            Ok(Some(arr))
        }
    }
}

/// Validate a caller-supplied download filename: must be a single safe path
/// component (no separators, no `..`, no absolute paths, printable name).
pub fn validate_filename_component(name: &str) -> Result<()> {
    if name.is_empty() || name.len() > MAX_FILENAME_LEN {
        bail!("filename must be 1-{} characters", MAX_FILENAME_LEN);
    }
    if name == "." || name == ".." || name.starts_with('.') {
        bail!("filename '{}' is not allowed", name);
    }
    if name.chars().any(|c| c.is_control()) {
        bail!("filename contains control characters");
    }
    let path = Path::new(name);
    if path.is_absolute() {
        bail!("filename must not be an absolute path");
    }
    let mut components = path.components();
    match (components.next(), components.next()) {
        (Some(Component::Normal(_)), None) => Ok(()),
        _ => bail!("filename must be a plain file name without directories"),
    }
}

/// Resolve a caller-supplied download directory to a canonicalized path that
/// stays inside the allowed roots. Creates the directory if needed.
pub fn resolve_download_dir(dir_arg: Option<&str>) -> Result<PathBuf> {
    let candidate = match dir_arg {
        Some(d) if !d.trim().is_empty() => {
            let d = d.trim();
            if d.len() > 1024 {
                bail!("download_dir is too long");
            }
            PathBuf::from(d)
        }
        _ => {
            let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
            let artcraft_downloads = home.join("Artcraft").join("downloads");
            if artcraft_downloads.exists() {
                artcraft_downloads
            } else {
                dirs::download_dir().unwrap_or(home)
            }
        }
    };

    std::fs::create_dir_all(&candidate)?;
    let canonical = candidate
        .canonicalize()
        .map_err(|e| anyhow!("failed to resolve download_dir: {}", e))?;

    if !is_within_allowed_roots(&canonical) {
        bail!(
            "download_dir '{}' is outside the allowed directories (user home, system temp, or ARTCRAFT_MCP_ALLOWED_DIRS)",
            candidate.display()
        );
    }
    Ok(canonical)
}

/// Join a validated filename to a canonical download dir and prove the result
/// still lives inside it.
pub fn resolve_download_path(download_dir: &Path, filename: &str) -> Result<PathBuf> {
    validate_filename_component(filename)?;
    let target = download_dir.join(filename);
    if !target.starts_with(download_dir) {
        bail!("resolved path escapes the download directory");
    }
    Ok(target)
}

/// Validate a caller-supplied local file for upload: must exist, be a regular
/// file inside an allowed root, have an allow-listed extension, and be under
/// the size cap. Returns the canonicalized path.
pub fn validate_upload_path(path_str: &str, allowed_exts: &[&str], max_bytes: u64) -> Result<PathBuf> {
    if path_str.trim().is_empty() || path_str.len() > 4096 {
        bail!("file_path must be 1-4096 characters");
    }

    let candidate = PathBuf::from(path_str);
    let canonical = candidate
        .canonicalize()
        .map_err(|_| anyhow!("file_path does not exist or cannot be resolved: {}", path_str))?;

    if !canonical.is_file() {
        bail!("file_path is not a regular file: {}", path_str);
    }

    let ext = canonical
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .ok_or_else(|| anyhow!("file has no extension"))?;
    if !allowed_exts.iter().any(|allowed| *allowed == ext) {
        bail!(
            "file extension '.{}' is not allowed; expected one of: {}",
            ext,
            allowed_exts.join(", ")
        );
    }

    let size = std::fs::metadata(&canonical)?.len();
    if size == 0 {
        bail!("file is empty");
    }
    if size > max_bytes {
        bail!(
            "file is {} bytes; maximum allowed is {} bytes ({:.0} MB)",
            size,
            max_bytes,
            max_bytes as f64 / 1_048_576.0
        );
    }

    if !is_within_allowed_roots(&canonical) {
        bail!(
            "file_path is outside the allowed directories (user home, system temp, or ARTCRAFT_MCP_ALLOWED_DIRS)"
        );
    }

    Ok(canonical)
}

fn allowed_roots() -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = Vec::new();
    if let Some(home) = dirs::home_dir() {
        if let Ok(c) = home.canonicalize() {
            roots.push(c);
        }
    }
    if let Ok(c) = std::env::temp_dir().canonicalize() {
        roots.push(c);
    }
    if let Ok(extra) = std::env::var("ARTCRAFT_MCP_ALLOWED_DIRS") {
        for p in std::env::split_paths(&extra) {
            if let Ok(c) = p.canonicalize() {
                roots.push(c);
            }
        }
    }
    roots
}

fn is_within_allowed_roots(path: &Path) -> bool {
    allowed_roots().iter().any(|root| path.starts_with(root))
}

/// Sliding-window rate limiter for sensitive (paid/destructive) operations.
pub fn rate_limit(tool_name: &str) -> Result<()> {
    let mut guard = RATE_LIMITER
        .lock()
        .map_err(|_| anyhow!("rate limiter poisoned"))?;
    let map = guard.get_or_insert_with(HashMap::new);
    let calls = map.entry(tool_name.to_string()).or_insert_with(VecDeque::new);
    let now = Instant::now();
    while let Some(front) = calls.front() {
        if now.duration_since(*front) > RATE_WINDOW {
            calls.pop_front();
        } else {
            break;
        }
    }
    if calls.len() >= RATE_MAX_CALLS {
        bail!(
            "rate limit exceeded: {} allows at most {} calls per {} seconds",
            tool_name,
            RATE_MAX_CALLS,
            RATE_WINDOW.as_secs()
        );
    }
    calls.push_back(now);
    Ok(())
}

/// Audit-log a sensitive operation: actor (tool), target, and result.
pub fn audit(action: &str, target: &str, result: &str) {
    info!(target: "artcraft_mcp_audit", "action={} target={} result={}", action, target, result);
}

/// Sanitize attacker-controlled text returned by the API before embedding it in
/// tool output: strip control characters and cap length. Callers should still
/// treat the text as data, never as instructions.
pub fn sanitize_field(raw: &str) -> String {
    let cleaned: String = raw
        .chars()
        .filter(|c| !c.is_control() || *c == '\n')
        .take(MAX_TEXT_FIELD_LEN)
        .collect();
    if cleaned.len() < raw.len() {
        format!("{}…[truncated]", cleaned)
    } else {
        cleaned
    }
}

/// Percent-encode a token for safe interpolation into a URL path segment.
pub fn url_path_segment(segment: &str) -> String {
    urlencoding::encode(segment).into_owned()
}

/// Percent-encode a value for safe interpolation into a URL query.
pub fn url_query_value(value: &str) -> String {
    urlencoding::encode(value).into_owned()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    const TMP_FILENAME: &str = "render out-01.png";

    mod confirm_tests {
        use super::*;

        #[test]
        fn rejects_missing_and_false() {
            assert!(require_confirm(&json!({}), "delete media").is_err());
            assert!(require_confirm(&json!({"confirm": false}), "delete media").is_err());
            assert!(require_confirm(&json!({"confirm": "true"}), "delete media").is_err());
        }

        #[test]
        fn accepts_true() {
            assert!(require_confirm(&json!({"confirm": true}), "delete media").is_ok());
        }
    }

    mod bounds_tests {
        use super::*;

        #[test]
        fn bounded_u64_range() {
            let args = json!({"n": 5});
            assert_eq!(bounded_u64(&args, "n", 1, 8).unwrap(), Some(5));
            assert!(bounded_u64(&json!({"n": 0}), "n", 1, 8).is_err());
            assert!(bounded_u64(&json!({"n": 9}), "n", 1, 8).is_err());
            assert!(bounded_u64(&json!({"n": "5"}), "n", 1, 8).is_err());
            assert_eq!(bounded_u64(&json!({}), "n", 1, 8).unwrap(), None);
        }

        #[test]
        fn bounded_str_len() {
            assert!(bounded_str(&json!({"s": "ok"}), "s", 10).unwrap().is_some());
            assert!(bounded_str(&json!({"s": "x".repeat(11)}), "s", 10).is_err());
        }

        #[test]
        fn bounded_array_len() {
            let args = json!({"a": ["x", "y"]});
            assert_eq!(bounded_array(&args, "a", 3).unwrap().unwrap().len(), 2);
            assert!(bounded_array(&json!({"a": [1, 2, 3, 4]}), "a", 3).is_err());
            assert!(bounded_array(&json!({"a": "nope"}), "a", 3).is_err());
        }
    }

    mod filename_tests {
        use super::*;

        #[test]
        fn accepts_plain_names() {
            assert!(validate_filename_component("render.png").is_ok());
            assert!(validate_filename_component(TMP_FILENAME).is_ok());
            assert!(validate_filename_component("a-b_c.4.mp4").is_ok());
        }

        #[test]
        fn rejects_traversal_and_absolute() {
            assert!(validate_filename_component("..").is_err());
            assert!(validate_filename_component("../evil").is_err());
            assert!(validate_filename_component("a/../b").is_err());
            assert!(validate_filename_component("sub/dir.png").is_err());
            assert!(validate_filename_component("sub\\dir.png").is_err());
            assert!(validate_filename_component("/etc/passwd").is_err());
            assert!(validate_filename_component("C:\\Windows\\x.dll").is_err());
            assert!(validate_filename_component(".hidden").is_err());
            assert!(validate_filename_component("").is_err());
        }
    }

    mod idempotency_tests {
        use super::*;

        #[test]
        fn generates_when_absent() {
            let t = idempotency_token(&json!({})).unwrap();
            assert_eq!(t.len(), 36);
        }

        #[test]
        fn echoes_client_token() {
            let t = idempotency_token(&json!({"idempotency_token": "retry-42"})).unwrap();
            assert_eq!(t, "retry-42");
        }

        #[test]
        fn rejects_bad_tokens() {
            assert!(idempotency_token(&json!({"idempotency_token": ""})).is_err());
            assert!(idempotency_token(&json!({"idempotency_token": "x".repeat(200)})).is_err());
            assert!(idempotency_token(&json!({"idempotency_token": "a b\nc"})).is_err());
        }
    }

    mod sanitize_tests {
        use super::*;

        #[test]
        fn strips_control_chars() {
            let out = sanitize_field("hello\u{1b}[31m world\u{0007}");
            assert!(!out.chars().any(|c| c.is_control() && c != '\n'));
            assert!(out.contains("hello"));
        }
    }

    mod path_tests {
        use super::*;

        #[test]
        fn upload_path_rejects_missing_file() {
            assert!(validate_upload_path("no/such/file.png", IMAGE_EXTENSIONS, 1024).is_err());
        }

        #[test]
        fn upload_path_rejects_bad_extension() {
            let f = tempfile::NamedTempFile::with_suffix(".exe").unwrap();
            std::fs::write(f.path(), b"x").unwrap();
            let path = f.path().to_str().unwrap().to_string();
            assert!(validate_upload_path(&path, IMAGE_EXTENSIONS, 1024).is_err());
        }

        #[test]
        fn upload_path_accepts_allowed_file() {
            let dir = std::env::temp_dir().join("artcraft_mcp_test_upload");
            std::fs::create_dir_all(&dir).unwrap();
            let file = dir.join("ok.png");
            std::fs::write(&file, b"png-bytes").unwrap();
            let got = validate_upload_path(file.to_str().unwrap(), IMAGE_EXTENSIONS, 1024).unwrap();
            assert!(got.ends_with("ok.png"));
        }

        #[test]
        fn download_path_blocks_escape() {
            let dir = PathBuf::from("/tmp/base");
            assert!(resolve_download_path(&dir, "ok.png").is_ok());
            assert!(resolve_download_path(&dir, "../ok.png").is_err());
        }
    }
}
