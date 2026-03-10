pub mod seedance2pro;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "support-tool", about = "Production support CLI")]
pub struct Cli {
  #[command(subcommand)]
  pub command: TopLevelCommand,
}

#[derive(Subcommand)]
pub enum TopLevelCommand {
  /// Seedance2 Pro support commands
  Seedance2pro {
    #[command(subcommand)]
    command: seedance2pro::Seedance2proCommand,
  },
}

pub async fn run(cli: Cli) -> anyhow::Result<()> {
  match cli.command {
    TopLevelCommand::Seedance2pro { command } => {
      seedance2pro::run(command).await
    }
  }
}
