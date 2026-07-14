use anyhow::anyhow;
use clap::Subcommand;

use super::state::Seedance2ProState;
use super::subcommands;

/// All canonical subcommand names for this module.
/// Used by the underscore-insensitive arg normalizer.
pub const SUBCOMMAND_NAMES: &[&str] = &[
  "audit_orders",
  "audit_payments",
  "failed_job_histogram",
  "find_job",
  "generate_video",
];

#[derive(Subcommand)]
#[command(rename_all = "snake_case")]
pub enum Seedance2proCommand {
  /// Dump Kinovi's per-order billing records (totalCredits) to CSV for a
  /// date window, to audit whether failed orders are charged
  AuditOrders(subcommands::audit_orders::AuditOrdersArgs),

  /// Dump the account's billing payments history (credit-package
  /// purchases) to CSV, for reconciling refills against invoices
  AuditPayments(subcommands::audit_payments::AuditPaymentsArgs),

  /// Find a job by its order ID across all pages
  FindJob(subcommands::find_job::FindJobArgs),

  /// Scan all jobs and print a histogram of failure reasons
  FailedJobHistogram,

  /// Generate a video via Seedance2Pro/Kinovi directly
  GenerateVideo(subcommands::generate_video::GenerateVideoArgs),
}

pub async fn run(command: Seedance2proCommand) -> anyhow::Result<()> {
  let cookies = easyenv::get_env_string_required("SEEDANCE2PRO_COOKIES")
    .map_err(|err| anyhow!("Missing SEEDANCE2PRO_COOKIES env var: {:?}", err))?;

  let state = Seedance2ProState { cookies };

  match command {
    Seedance2proCommand::AuditOrders(args) => subcommands::audit_orders::run(&state, args).await,
    Seedance2proCommand::AuditPayments(args) => subcommands::audit_payments::run(&state, args).await,
    Seedance2proCommand::FindJob(args) => subcommands::find_job::run(&state, args).await,
    Seedance2proCommand::FailedJobHistogram => subcommands::failed_job_histogram::run(&state).await,
    Seedance2proCommand::GenerateVideo(args) => subcommands::generate_video::run(&state, args).await,
  }
}
