mod commands;
mod utils;

use clap::Parser;
use commands::run::{Cli, all_canonical_names};
use utils::normalize_subcommands::normalize_subcommand_args;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  // Normalize args so underscores in subcommand names are optional.
  let canonical_names = all_canonical_names();
  let args = normalize_subcommand_args(std::env::args(), &canonical_names);

  // Parse CLI args first so --help works without the env file.
  let cli = Cli::parse_from(args);

  // Load secrets from .env file.
  easyenv::from_filename(".env-support-tool-secrets")
    .expect("Failed to load .env-support-tool-secrets");

  easyenv::init_env_logger(Some("info"));

  commands::run::run(cli).await
}
