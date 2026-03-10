mod commands;
mod utils;

use clap::Parser;
use commands::Cli;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
  // Parse CLI args first so --help works without the env file.
  let cli = Cli::parse();

  // Load secrets from .env file.
  easyenv::from_filename(".env-support-tool-secrets")
    .expect("Failed to load .env-support-tool-secrets");

  easyenv::init_env_logger(Some("info"));

  commands::run(cli).await
}
