//! Optional setup for the admin dashboard's embedded metrics dashboards.
//!
//! Reads the `DATABOX_DASHBOARD_*` env vars. Each is independent and
//! optional — a missing var means that dashboard is simply not offered to
//! the admin dashboard. Never blocks startup.

use std::env;

use log::info;

use crate::state::server_state::{Dashboards, DataboxDashboards};

/// Build the dashboard configuration from the environment.
pub fn setup_dashboards() -> Dashboards {
  let daus_id = read_non_empty_env("DATABOX_DASHBOARD_DAUS");
  let daily_generations_id = read_non_empty_env("DATABOX_DASHBOARD_DAILY_GENERATIONS");

  info!(
    "Databox dashboards configured: daus={}, daily_generations={}",
    daus_id.is_some(),
    daily_generations_id.is_some(),
  );

  Dashboards {
    databox: DataboxDashboards {
      daus_id,
      daily_generations_id,
    },
  }
}

/// Read an env var, treating unset or whitespace-only as absent.
fn read_non_empty_env(name: &str) -> Option<String> {
  match env::var(name) {
    Ok(value) if !value.trim().is_empty() => Some(value.trim().to_string()),
    _ => None,
  }
}
