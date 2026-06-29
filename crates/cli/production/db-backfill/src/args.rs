use clap::{CommandFactory, FromArgMatches, Parser, ValueEnum};
use serde_derive::Deserialize;
use errors::AnyhowResult;

// #[derive(Parser, Debug, Deserialize)]
#[derive(Parser, Debug)]
#[command(name="db-backfill")]
// #[clap(rename_all = "kebab_case")]
pub struct Args {
  // #[arg(name="sub_command", long="sub_command", help="the sub-command to run", required=true)]
  //#[arg(short, long)]
  //     #[clap(value_enum, default_value_t=Level::Debug)]
  // #[clap(short, long, value_enum)]
  // #[clap(short, value_enum, required=true)]
  #[clap(index=1, required=true)]
  pub sub_command: Command,
}

// #[clap(rename_all = "kebab_case")]
// #[derive(Debug, Deserialize, Copy, Clone)]
#[derive(ValueEnum, Clone, Copy, Debug)]
pub enum Command {
  BackfillUserSpendEvents,
  CalculateLegacyTtsResultsUsages,
  CalculateModelWeightsUsages,
}

pub fn parse_cli_args() -> AnyhowResult<Args> {
  let args = Args::from_arg_matches_mut(&mut Args::command()
      .ignore_errors(true)
      .get_matches(),
  )?;
  Ok(args)
}

pub fn remaining_args() -> Vec<String> {
  let mut args = std::env::args();
  args.next(); // Remove first arg.
  args.collect()
}