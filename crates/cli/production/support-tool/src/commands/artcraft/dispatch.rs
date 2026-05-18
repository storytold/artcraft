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
  let cookies_str = load_cookies(cookie_path)?;

  let creds = StorytellerCredentialSet::parse_multi_cookie_header(&cookies_str)
    .map_err(|err| anyhow!("Failed to parse cookies: {:?}", err))?
    .ok_or_else(|| anyhow!("Cookie file contained no recognized cookies (expected session=... and/or visitor=...)"))?;

  let api_host = parse_api_host(&args.environment)?;
  let state = ArtcraftState { creds, api_host };

  match args.command {
    ArtcraftCommand::GenerateVideo(cmd_args) => subcommands::generate_video::run(&state, cmd_args).await,
  }
}

fn load_cookies(cookie_path: &str) -> anyhow::Result<String> {
  info!("Reading cookies from: {}", cookie_path);

  if Path::new(cookie_path).exists() {
    let content = fs::read_to_string(cookie_path)
      .map_err(|err| anyhow!("Failed to read cookie file {:?}: {}", cookie_path, err))?;
    Ok(content.trim().to_string())
  } else {
    warn!("Cookie file {:?} does not exist.", cookie_path);
    Err(anyhow!(
      "Cookie file {:?} not found. Use --cookie-file to specify a path, \
       or create '{}' in the current directory.",
      cookie_path, DEFAULT_COOKIE_FILE
    ))
  }
}

fn parse_api_host(environment: &str) -> anyhow::Result<ApiHost> {
  match environment {
    "dev" | "development" => {
      info!("Environment: development (localhost:12345)");
      Ok(ApiHost::Localhost { port: 12345 })
    }
    "prod" | "production" => {
      info!("Environment: production (api.storyteller.ai)");
      Ok(ApiHost::Storyteller)
    }
    other => Err(anyhow!(
      "Unknown environment '{}'. Use 'dev', 'development', 'prod', or 'production'.",
      other
    )),
  }
}
