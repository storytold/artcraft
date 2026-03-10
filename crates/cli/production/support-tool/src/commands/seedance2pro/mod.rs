mod findjob;

use clap::Subcommand;

#[derive(Subcommand)]
pub enum Seedance2proCommand {
  /// Find a job by its order ID across all pages
  Findjob(findjob::FindjobArgs),
}

pub async fn run(command: Seedance2proCommand) -> anyhow::Result<()> {
  match command {
    Seedance2proCommand::Findjob(args) => findjob::run(args).await,
  }
}
