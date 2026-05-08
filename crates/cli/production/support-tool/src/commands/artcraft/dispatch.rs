use anyhow::anyhow;
use clap::Subcommand;

use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;

use super::state::ArtcraftState;
use super::subcommands;

/// All canonical subcommand names for this module.
/// Used by the underscore-insensitive arg normalizer.
pub const SUBCOMMAND_NAMES: &[&str] = &["generate_video"];

#[derive(Subcommand)]
#[command(rename_all = "snake_case")]
pub enum ArtcraftCommand {
  /// Generate a video via the ArtCraft omni endpoint
  GenerateVideo(subcommands::generate_video::GenerateVideoArgs),
}

pub async fn run(command: ArtcraftCommand) -> anyhow::Result<()> {
  let cookies_str = easyenv::get_env_string_required("ARTCRAFT_COOKIES")
    .map_err(|err| anyhow!("Missing ARTCRAFT_COOKIES env var: {:?}", err))?;

  let creds = StorytellerCredentialSet::parse_multi_cookie_header(&cookies_str)
    .map_err(|err| anyhow!("Failed to parse ARTCRAFT_COOKIES: {:?}", err))?
    .ok_or_else(|| anyhow!("ARTCRAFT_COOKIES contained no recognized cookies (expected session=... and/or visitor=...)"))?;

  let state = ArtcraftState { creds };

  match command {
    ArtcraftCommand::GenerateVideo(args) => subcommands::generate_video::run(&state, args).await,
  }
}
