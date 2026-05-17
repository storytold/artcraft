use std::fs;
use std::path::Path;

use anyhow::anyhow;
use clap::{Args, Subcommand};
use log::{info, warn};

use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::utils::api_host::ApiHost;

use super::state::ArtcraftState;
use super::subcommands;

/// All canonical subcommand names for this module.
/// Used by the underscore-insensitive arg normalizer.
pub const SUBCOMMAND_NAMES: &[&str] = &["generate_video"];

const DEFAULT_COOKIE_FILE: &str = "artcraft_cookies.txt";

#[derive(Args)]
pub struct ArtcraftArgs {
  /// Path to a file containing the session cookies.
  /// If not specified, reads from `artcraft_cookies.txt` in the current directory.
  #[arg(long, global = true)]
  pub cookie_file: Option<String>,

  /// Target environment: "dev" / "development" (localhost:12345) or "prod" / "production" (api.storyteller.ai).
  /// [default: dev]
  #[arg(long, global = true, default_value = "dev")]
  pub environment: String,

  #[command(subcommand)]
  pub command: ArtcraftCommand,
}

#[derive(Subcommand)]
#[command(rename_all = "snake_case")]
pub enum ArtcraftCommand {
  /// Generate a video via the ArtCraft omni endpoint
  GenerateVideo(subcommands::generate_video::GenerateVideoArgs),
}

pub async fn dispatch(args: ArtcraftArgs) -> anyhow::Result<()> {
  let cookie_path = args.cookie_file.as_deref().unwrap_or(DEFAULT_COOKIE_FILE);

  info!("Reading cookies from: {}", cookie_path);

  let cookies_str = if Path::new(cookie_path).exists() {
    fs::read_to_string(cookie_path)
      .map_err(|err| anyhow!("Failed to read cookie file {:?}: {}", cookie_path, err))?
      .trim()
      .to_string()
  } else {
    warn!("Cookie file {:?} does not exist.", cookie_path);
    return Err(anyhow!(
      "Cookie file {:?} not found. Use --cookie-file to specify a path, \
       or create '{}' in the current directory.",
      cookie_path, DEFAULT_COOKIE_FILE
    ));
  };

  let creds = StorytellerCredentialSet::parse_multi_cookie_header(&cookies_str)
    .map_err(|err| anyhow!("Failed to parse cookies: {:?}", err))?
    .ok_or_else(|| anyhow!("Cookie file contained no recognized cookies (expected session=... and/or visitor=...)"))?;

  let api_host = match args.environment.as_str() {
    "dev" | "development" => {
      info!("Environment: development (localhost:12345)");
      ApiHost::Localhost { port: 12345 }
    }
    "prod" | "production" => {
      info!("Environment: production (api.storyteller.ai)");
      ApiHost::Storyteller
    }
    other => {
      return Err(anyhow!(
        "Unknown environment '{}'. Use 'dev', 'development', 'prod', or 'production'.",
        other
      ));
    }
  };

  let state = ArtcraftState { creds, api_host };

  match args.command {
    ArtcraftCommand::GenerateVideo(cmd_args) => subcommands::generate_video::run(&state, cmd_args).await,
  }
}
