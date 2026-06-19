//! `video-info-parser` — inspect a video file's AI-generation C2PA provenance
//! (Seedance or Veo) and print it.
//!
//! Usage:
//!   video-info-parser <FILE>
//!   video-info-parser --filename <FILE>

use std::process::ExitCode;

use video_info::error::VideoInfoError;
use video_info::{SeedanceInfo, VeoInfo, VideoInfo};

fn main() -> ExitCode {
  let filename = match parse_filename(std::env::args().skip(1)) {
    Ok(name) => name,
    Err(msg) => {
      eprintln!("{msg}");
      eprintln!("usage: video-info-parser <FILE>");
      eprintln!("       video-info-parser --filename <FILE>");
      return ExitCode::from(2);
    }
  };

  match VideoInfo::from_path(&filename) {
    Ok(VideoInfo::Seedance(info)) => {
      print_seedance(&filename, &info);
      ExitCode::SUCCESS
    }
    Ok(VideoInfo::Veo(info)) => {
      print_veo(&filename, &info);
      ExitCode::SUCCESS
    }
    Err(VideoInfoError::Unrecognized) => {
      println!("No recognized provenance (not Seedance or Veo)");
      ExitCode::SUCCESS
    }
    Err(err) => {
      eprintln!("error: {err}");
      ExitCode::FAILURE
    }
  }
}

/// Accept the filename as the first positional arg, or via `--filename <FILE>` /
/// `--filename=<FILE>`.
fn parse_filename(args: impl Iterator<Item = String>) -> Result<String, String> {
  let mut args = args.peekable();
  while let Some(arg) = args.next() {
    if arg == "--filename" || arg == "-f" {
      return args.next().ok_or_else(|| "error: --filename requires a value".to_string());
    }
    if let Some(value) = arg.strip_prefix("--filename=") {
      return Ok(value.to_string());
    }
    if arg == "--help" || arg == "-h" {
      return Err("video-info-parser: print a video's AI-generation provenance".to_string());
    }
    if arg.starts_with('-') {
      return Err(format!("error: unknown flag {arg:?}"));
    }
    return Ok(arg);
  }
  Err("error: no filename provided".to_string())
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
  opt("created description", &info.created_description);
  row("synthid watermark", if info.has_synthid_watermark { "yes" } else { "no" });
  opt("synthid description", &info.synthid_description);
  opt("digital source type", &info.digital_source_type);
  opt("claim generator", &info.claim_generator);
  opt("claim generator version", &info.claim_generator_version);
  opt("manifest id", &info.manifest_id);
  opt("instance id", &info.instance_id);
  opt("cert serial", &info.cert_serial);
  row("model name", "(not embedded in metadata)");
}
