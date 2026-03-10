use anyhow::anyhow;
use clap::Subcommand;

use super::state::Seedance2ProState;
use super::subcommands;

#[derive(Subcommand)]
pub enum Seedance2proCommand {
  /// Scan all jobs and print a histogram of failure reasons
  Failedjobhistogram,

  /// Find a job by its order ID across all pages
  Findjob(subcommands::find_job::FindjobArgs),
}

pub async fn run(command: Seedance2proCommand) -> anyhow::Result<()> {
  let cookies = easyenv::get_env_string_required("SEEDANCE2PRO_COOKIES")
    .map_err(|err| anyhow!("Missing SEEDANCE2PRO_COOKIES env var: {:?}", err))?;

  let state = Seedance2ProState { cookies };

  match command {
    Seedance2proCommand::Failedjobhistogram => subcommands::failed_job_histogram::run(&state).await,
    Seedance2proCommand::Findjob(args) => subcommands::find_job::run(&state, args).await,
  }
}
