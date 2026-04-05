//! kube-pod-cleanup
//!
//! Rationale: In production, dead/evicted pods stick around for eternity.
//! Within a matter of days, thousands of dead pods can clutter the output of `kubectl`,
//! making it operationally difficult to maintain the cluster.
//!
//! This tool quickly dispenses of garbage pods. (Though we may still want to keep them
//! for debugging actual issues.)
//!
//! To install as a system binary, do the following:
//!
//!  cargo install --path ./crates/cli/kubectl_pod_cleanup --bin kubectl-pod-cleanup
//!
//! (Cargo install seems to currently require the --path argument in a workspace,
//! as tracked by this issue: https://stackoverflow.com/a/76271890 )
//!

use std::thread;
use std::time::Duration;

use log::info;

use shared_env_var_config::logging::DEFAULT_RUST_LOG;
use errors::AnyhowResult;

use crate::delete_pods_threaded::delete_pods_threaded;

pub mod delete_pods;
pub mod delete_pods_threaded;
pub mod list_pods;
pub mod pod_store;

pub fn main() -> AnyhowResult<()> {
  easyenv::init_all_with_default_logging(Some(DEFAULT_RUST_LOG));

  info!("kube-pod-cleanup");

  let wait_duration = Duration::from_secs(3);

  info!("Clearing in {} seconds... (Last chance to cancel!)", wait_duration.as_secs());

  thread::sleep(wait_duration);

  delete_pods_threaded(6, 30)?;

  info!("Done!");
  Ok(())
}
