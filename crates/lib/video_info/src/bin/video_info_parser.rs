//! `video-info-parser` — inspect AI-generation C2PA provenance (Seedance, Veo,
//! Sora, Dreamina, Kling) for a single video, or a whole directory of them.
//!
//! Usage:
//!   video-info-parser <FILE>        # detailed report for one video
//!   video-info-parser <DIR>         # summary table for every .mp4 in the dir
//!   video-info-parser --filename <PATH>
//!   video-info-parser <DIR> --truncate   # shorten long filenames in the table

use std::fs;
use std::path::{Path, PathBuf};
use std::process::ExitCode;

use video_info::error::VideoInfoError;
use video_info::{DreaminaInfo, KlingInfo, SeedanceInfo, SoraInfo, VeoInfo, VideoInfo};

/// Max width before a cell value is truncated with an ellipsis.
const MAX_CELL: usize = 30;

/// Parsed command-line arguments.
struct Args {
  /// File or directory to inspect.
  path: String,
  /// Whether to shorten long filenames in directory-table output. Defaults to
  /// `false` so full filenames are always shown.
  truncate_names: bool,
}

fn main() -> ExitCode {
  let args = match parse_args(std::env::args().skip(1)) {
    Ok(args) => args,
    Err(msg) => {
      eprintln!("{msg}");
      eprintln!("usage: video-info-parser <FILE|DIR> [--truncate]");
      eprintln!("       video-info-parser --filename <PATH>");
      return ExitCode::from(2);
    }
  };

  match fs::metadata(&args.path) {
    Ok(meta) if meta.is_dir() => run_directory(&args.path, args.truncate_names),
    Ok(_) => run_single_file(&args.path),
    Err(err) => {
      eprintln!("error: cannot read {:?}: {err}", args.path);
      ExitCode::FAILURE
    }
  }
}

/// Accept the path as the first positional arg, or via `--filename <PATH>` /
/// `--filename=<PATH>`. The path may be a single file or a directory.
/// `--truncate` shortens long filenames in directory-table output.
fn parse_args(args: impl Iterator<Item = String>) -> Result<Args, String> {
  let mut path: Option<String> = None;
  let mut truncate_names = false;
  let mut args = args.peekable();
  while let Some(arg) = args.next() {
    match arg.as_str() {
      "--filename" | "-f" => {
        let value = args.next().ok_or_else(|| "error: --filename requires a value".to_string())?;
        path = Some(value);
      }
      "--truncate" | "--truncate-names" => truncate_names = true,
      "--help" | "-h" => {
        return Err("video-info-parser: print AI-generation provenance for a file or directory".to_string());
      }
      _ => {
        if let Some(value) = arg.strip_prefix("--filename=") {
          path = Some(value.to_string());
        } else if arg.starts_with('-') {
          return Err(format!("error: unknown flag {arg:?}"));
        } else if path.is_none() {
          path = Some(arg);
        } else {
          return Err(format!("error: unexpected extra argument {arg:?}"));
        }
      }
    }
  }
  match path {
    Some(path) => Ok(Args { path, truncate_names }),
    None => Err("error: no path provided".to_string()),
  }
}

// ── Single-file mode ──

fn run_single_file(filename: &str) -> ExitCode {
  let bytes = match fs::read(filename) {
    Ok(bytes) => bytes,
    Err(err) => {
      eprintln!("error: cannot read {filename:?}: {err}");
      return ExitCode::FAILURE;
    }
  };
  match VideoInfo::from_bytes(&bytes) {
    Ok(VideoInfo::Seedance(info)) => print_seedance(filename, &info),
    Ok(VideoInfo::Veo(info)) => print_veo(filename, &info),
    Ok(VideoInfo::Sora(info)) => print_sora(filename, &info),
    Ok(VideoInfo::Dreamina(info)) => print_dreamina(filename, &info),
    Ok(VideoInfo::Kling(info)) => print_kling(filename, &info),
    Err(VideoInfoError::Unrecognized) => {
      print!("No recognized provenance (not Seedance, Veo, Sora, Dreamina, or Kling)");
      match video_info::encoder_tag(&bytes) {
        Some(enc) if enc.starts_with("Lavf") => {
          println!(" — re-encoded through ffmpeg (encoder: {enc}), which strips provenance");
        }
        Some(enc) => println!(" — encoder: {enc}"),
        None => println!(),
      }
    }
    Err(err) => {
      eprintln!("error: {err}");
      return ExitCode::FAILURE;
    }
  }
  ExitCode::SUCCESS
}

// ── Directory mode (summary table) ──

const TABLE_HEADERS: [&str; 6] = ["FILE", "KIND", "MODEL", "DETAIL", "GENERATED", "SIGNER"];

fn run_directory(dir: &str, truncate_names: bool) -> ExitCode {
  let files = match collect_mp4s(Path::new(dir)) {
    Ok(files) => files,
    Err(err) => {
      eprintln!("error: cannot list {dir:?}: {err}");
      return ExitCode::FAILURE;
    }
  };
  if files.is_empty() {
    println!("no .mp4 files found in {dir}");
    return ExitCode::SUCCESS;
  }

  let mut rows: Vec<[String; 6]> = Vec::with_capacity(files.len());
  let mut tally: std::collections::BTreeMap<String, usize> = std::collections::BTreeMap::new();
  for file in &files {
    let name = file.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
    let row = match fs::read(file) {
      Ok(bytes) => {
        let encoder = video_info::encoder_tag(&bytes);
        summary_row(&name, &VideoInfo::from_bytes(&bytes), encoder.as_deref(), truncate_names)
      }
      Err(err) => summary_row(&name, &Err(VideoInfoError::Io(err)), None, truncate_names),
    };
    *tally.entry(row[1].clone()).or_default() += 1;
    rows.push(row);
  }

  render_table(&TABLE_HEADERS, &rows);
  println!();
  let total = files.len();
  let breakdown =
    tally.iter().map(|(kind, n)| format!("{kind}: {n}")).collect::<Vec<_>>().join(", ");
  println!("{total} file(s) — {breakdown}");
  ExitCode::SUCCESS
}

/// Collect every `.mp4` (case-insensitive) directly under `dir`, sorted by name.
fn collect_mp4s(dir: &Path) -> std::io::Result<Vec<PathBuf>> {
  let mut out = Vec::new();
  for entry in fs::read_dir(dir)? {
    let path = entry?.path();
    let is_mp4 = path
      .extension()
      .and_then(|e| e.to_str())
      .is_some_and(|e| e.eq_ignore_ascii_case("mp4"));
    if path.is_file() && is_mp4 {
      out.push(path);
    }
  }
  out.sort();
  Ok(out)
}

/// Reduce a parse result to one table row: `[file, kind, model, detail, generated, signer]`.
/// Filenames are shown in full unless `truncate_names` is set. `encoder` is the
/// `©too` tag, shown in DETAIL for unrecognized files to explain the absence.
fn summary_row(
  name: &str,
  result: &Result<VideoInfo, VideoInfoError>,
  encoder: Option<&str>,
  truncate_names: bool,
) -> [String; 6] {
  let file = if truncate_names { truncate(name, MAX_CELL) } else { name.to_string() };
  let (kind, model, detail, generated, signer) = match result {
    Ok(VideoInfo::Seedance(i)) => {
      let variant = if i.is_fast {
        " (fast)"
      } else if i.is_lite {
        " (lite)"
      } else {
        ""
      };
      let detail = format!("{}{variant}", i.platform.as_str());
      ("Seedance", i.model_name.clone(), detail, i.generated_at.clone(), signer_line(&i.signer_country, &i.cert_serial))
    }
    Ok(VideoInfo::Veo(i)) => {
      let detail = if i.has_c2pa_manifest {
        if i.has_synthid_watermark { "c2pa + synthid".to_string() } else { "c2pa".to_string() }
      } else {
        format!("encoder={}", i.encoder.as_deref().unwrap_or("?"))
      };
      ("Veo", "Google Veo".to_string(), detail, String::new(), short_opt(&i.cert_serial))
    }
    Ok(VideoInfo::Sora(i)) => (
      "Sora",
      "OpenAI Sora".to_string(),
      i.model_name.clone().unwrap_or_default(),
      String::new(),
      short_opt(&i.cert_serial),
    ),
    Ok(VideoInfo::Dreamina(i)) => {
      let signer = if i.has_c2pa { signer_line(&i.signer_country, &i.cert_serial) } else { String::new() };
      ("Dreamina", i.product.clone(), i.video_id.clone().unwrap_or_default(), String::new(), signer)
    }
    Ok(VideoInfo::Kling(i)) => {
      let model = match &i.model_version {
        Some(v) => format!("Kling {v}"),
        None => "Kling".to_string(),
      };
      let detail = i.produce_id.clone().unwrap_or_else(|| {
        if i.has_stream_watermark { "watermark-only".to_string() } else { String::new() }
      });
      ("Kling", model, detail, String::new(), i.content_producer.clone().unwrap_or_default())
    }
    Err(VideoInfoError::Unrecognized) => {
      let detail = match encoder {
        Some(enc) if enc.starts_with("Lavf") => format!("re-encoded: {enc}"),
        Some(enc) => format!("encoder: {enc}"),
        None => "no provenance".to_string(),
      };
      ("—", String::new(), detail, String::new(), String::new())
    }
    Err(err) => ("error", err.to_string(), String::new(), String::new(), String::new()),
  };
  [
    file,
    kind.to_string(),
    truncate(&model, MAX_CELL),
    truncate(&detail, MAX_CELL),
    generated,
    truncate(&signer, MAX_CELL),
  ]
}

/// `"<country> <short-cert>"`, omitting whichever parts are absent.
fn signer_line(country: &Option<String>, cert: &Option<String>) -> String {
  match (country.as_deref(), cert.as_deref()) {
    (Some(c), Some(s)) => format!("{c} {}", short(s, 14)),
    (Some(c), None) => c.to_string(),
    (None, Some(s)) => short(s, 14),
    (None, None) => String::new(),
  }
}

fn short_opt(value: &Option<String>) -> String {
  value.as_deref().map(|s| short(s, 14)).unwrap_or_default()
}

fn short(value: &str, max: usize) -> String {
  truncate(value, max)
}

/// Truncate to `max` characters, appending `…` when shortened.
fn truncate(value: &str, max: usize) -> String {
  if value.chars().count() <= max {
    return value.to_string();
  }
  let kept: String = value.chars().take(max.saturating_sub(1)).collect();
  format!("{kept}…")
}

/// Render left-aligned columns sized to the widest cell in each.
fn render_table(headers: &[&str], rows: &[[String; 6]]) {
  let mut widths: Vec<usize> = headers.iter().map(|h| h.chars().count()).collect();
  for row in rows {
    for (i, cell) in row.iter().enumerate() {
      widths[i] = widths[i].max(cell.chars().count());
    }
  }
  let render = |cells: &[String]| {
    cells
      .iter()
      .enumerate()
      .map(|(i, c)| format!("{:<width$}", c, width = widths[i]))
      .collect::<Vec<_>>()
      .join("  ")
  };
  let header_cells: Vec<String> = headers.iter().map(|h| h.to_string()).collect();
  println!("{}", render(&header_cells).trim_end());
  let separators: Vec<String> = widths.iter().map(|w| "-".repeat(*w)).collect();
  println!("{}", render(&separators).trim_end());
  for row in rows {
    println!("{}", render(row).trim_end());
  }
}

// ── Printing ──

fn row(label: &str, value: &str) {
  println!("  {label:>24} : {value}");
}

fn opt(label: &str, value: &Option<String>) {
  row(label, value.as_deref().unwrap_or("(none)"));
}

fn header(title: &str, filename: &str) {
  println!("{title}");
  row("file", filename);
  println!("  {}", "-".repeat(60));
}

fn print_seedance(filename: &str, info: &SeedanceInfo) {
  header("Seedance video provenance", filename);
  row("platform", info.platform.as_str());
  row("software agent", &info.software_agent);
  opt("software agent version", &info.software_agent_version);
  row("model name", &info.model_name);
  opt("model brand", &info.model_brand);
  opt("model version", &info.model_version);
  row("fast variant", if info.is_fast { "yes" } else { "no" });
  row("lite variant", if info.is_lite { "yes" } else { "no" });
  row("generated at", &info.generated_at);
  row(
    "generated at (parsed)",
    &info.generated_at_utc.map(|t| t.to_rfc3339()).unwrap_or_else(|| "(unparseable)".to_string()),
  );
  opt("log id", &info.log_id);
  opt("log id (decoded hex)", &info.log_id_decoded_hex);
  opt("digital source type", &info.digital_source_type);
  opt("claim generator", &info.claim_generator);
  opt("claim generator version", &info.claim_generator_version);
  opt("manifest id", &info.manifest_id);
  opt("instance id", &info.instance_id);
  opt("signer email", &info.signer_email);
  opt("signer org id", &info.signer_org_id);
  opt("signer country", &info.signer_country);
  opt("cert serial", &info.cert_serial);
}

fn print_veo(filename: &str, info: &VeoInfo) {
  header("Google Veo video provenance", filename);
  row("producer", &info.producer);
  row("c2pa manifest", if info.has_c2pa_manifest { "yes" } else { "no (encoder tag only)" });
  opt("encoder", &info.encoder);
  opt("created description", &info.created_description);
  row("synthid watermark", if info.has_synthid_watermark { "yes" } else { "no" });
  opt("synthid description", &info.synthid_description);
  opt("digital source type", &info.digital_source_type);
  opt("claim generator", &info.claim_generator);
  opt("claim generator version", &info.claim_generator_version);
  opt("manifest id", &info.manifest_id);
  opt("instance id", &info.instance_id);
  opt("cert serial", &info.cert_serial);
  opt("signer ca", &info.signer_ca);
  row("timestamped", if info.is_timestamped { "yes" } else { "no" });
  opt("timestamp authority", &info.timestamp_authority);
  row("model name", "(not embedded in metadata)");
}

fn print_sora(filename: &str, info: &SoraInfo) {
  header("OpenAI Sora video provenance", filename);
  row("producer", &info.producer);
  opt("model name", &info.model_name);
  opt("created description", &info.created_description);
  opt("digital source type", &info.digital_source_type);
  opt("claim generator", &info.claim_generator);
  opt("manifest id", &info.manifest_id);
  opt("instance id", &info.instance_id);
  opt("cert serial", &info.cert_serial);
}

fn print_dreamina(filename: &str, info: &DreaminaInfo) {
  header("Dreamina (ByteDance/CapCut) video provenance", filename);
  row("product", &info.product);
  opt("export type", &info.export_type);
  opt("os", &info.os);
  opt("source info", &info.source_info);
  row(
    "aigc label type",
    &info.aigc_label_type.map(|n| n.to_string()).unwrap_or_else(|| "(none)".to_string()),
  );
  opt("video id", &info.video_id);
  row("has c2pa", if info.has_c2pa { "yes" } else { "no" });
  opt("signer org id", &info.signer_org_id);
  opt("signer country", &info.signer_country);
  opt("cert serial", &info.cert_serial);
}

fn print_kling(filename: &str, info: &KlingInfo) {
  header("Kling (Kuaishou) video provenance", filename);
  opt("model version", &info.model_version);
  row("ai-generated", if info.is_ai_generated { "yes" } else { "no" });
  opt("aigc label", &info.label);
  opt("content producer", &info.content_producer);
  opt("produce id", &info.produce_id);
  opt("content propagator", &info.content_propagator);
  opt("propagate id", &info.propagate_id);
  opt("reserved code 1", &info.reserved_code_1);
  opt("reserved code 2", &info.reserved_code_2);
  row("stream watermark", if info.has_stream_watermark { "yes" } else { "no" });
  opt("watermark uuid", &info.watermark_uuid);
}
