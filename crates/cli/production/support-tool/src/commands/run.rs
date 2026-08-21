use clap::{Parser, Subcommand};

use super::artcraft;
use super::kinovi_web;

/// All canonical subcommand names across all modules.
/// Used by the underscore-insensitive arg normalizer.
pub fn all_canonical_names() -> Vec<&'static str> {
  let mut names: Vec<&str> = vec!["kinovi_web", "artcraft"];
  names.extend_from_slice(kinovi_web::dispatch::SUBCOMMAND_NAMES);
  names.extend_from_slice(artcraft::dispatch::SUBCOMMAND_NAMES);
  names
}

#[derive(Parser)]
#[command(name = "support-tool", about = "Production support CLI")]
pub struct Cli {
  #[command(subcommand)]
  pub command: TopLevelCommand,
}

#[derive(Subcommand)]
#[command(rename_all = "snake_case")]
pub enum TopLevelCommand {
  /// Seedance2 Pro support commands (direct Kinovi API)
  KinoviWeb {
    #[command(subcommand)]
    command: kinovi_web::KinoviWebCommand,
  },

  /// ArtCraft support commands (omni API)
  Artcraft(artcraft::dispatch::ArtcraftArgs),
}

pub async fn run(cli: Cli) -> anyhow::Result<()> {
  match cli.command {
    TopLevelCommand::KinoviWeb { command } => {
      kinovi_web::run(command).await
    }
    TopLevelCommand::Artcraft(args) => {
      artcraft::dispatch(args).await
    }
  }
}
