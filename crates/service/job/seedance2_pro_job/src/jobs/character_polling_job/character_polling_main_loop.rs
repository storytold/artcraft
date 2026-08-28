use std::collections::HashMap;
use std::time::{Duration, Instant};

use log::{error, info, warn};

use mysql_queries::queries::generic_inference::api_providers::kinovi_web::list_pending_kinovi_web_character_jobs::list_pending_kinovi_web_character_jobs;
use kinovi_web_client::requests::poll_characters::poll_characters::{
  poll_characters, CharacterCreationStatus, CharacterStatus, PollCharactersArgs,
};

use crate::job_dependencies::JobDependencies;
use crate::with_deadline::{with_deadline, DATABASE_DEADLINE};
use super::process_failed_character::process_failed_character;
use super::process_successful_character::process_successful_character;

const POLL_ALERT_THRESHOLD: Duration = Duration::from_secs(600);

/// Hard ceiling on reconciling one finished character (download + DB writes).
const CHARACTER_PROCESSING_DEADLINE: Duration = Duration::from_secs(15 * 60);

/// Name under which this loop reports liveness to the health check.
pub const HEARTBEAT_NAME: &str = "character_polling";

pub async fn character_polling_main_loop(deps: JobDependencies) {
  while !deps.application_shutdown.get() {
    deps.heartbeats.beat(HEARTBEAT_NAME);

    let start = Instant::now();
    let result = run_poll_iteration(&deps).await;
    let elapsed = start.elapsed();

    if let Err(err) = result {
      error!("Error in character poll iteration: {:?}", err);
      let _ = deps.job_stats.increment_failure_count();
    }

    if elapsed > POLL_ALERT_THRESHOLD {
      warn!("Character poll iteration took {:.1}s (threshold: {}s)", elapsed.as_secs_f64(), POLL_ALERT_THRESHOLD.as_secs());
    }

    tokio::select! {
      _ = tokio::time::sleep(Duration::from_millis(deps.poll_interval_millis)) => {}
      _ = deps.shutdown_notify.notified() => {}
    }
  }

  warn!("Character polling main loop is shut down.");
}

async fn run_poll_iteration(deps: &JobDependencies) -> anyhow::Result<()> {
  // 1. Query all pending character creation jobs from DB.
  let pending_jobs = with_deadline(
    "pending character jobs query",
    DATABASE_DEADLINE,
    list_pending_kinovi_web_character_jobs(&deps.mysql_pool),
  ).await?;

  if pending_jobs.is_empty() {
    return Ok(());
  }

  info!("Found {} pending character job(s).", pending_jobs.len());

  // Build a lookup: kinovi_character_id -> job
  let job_by_character_id: HashMap<String, _> = pending_jobs
    .into_iter()
    .map(|job| (job.kinovi_character_id.clone(), job))
    .collect();

  // 2. Poll characters from Kinovi API.
  let response = poll_characters(PollCharactersArgs {
    session: &deps.kinovi_web_session,
    cursor: None,
    limit: None,
    host_override: None,
  })
    .await
    .map_err(|err| anyhow::anyhow!("Error polling characters from Kinovi: {:?}", err))?;

  info!("Polled {} character(s) from Kinovi.", response.characters.len());

  // 3. Match polled characters against pending jobs.
  for character in &response.characters {
    if deps.application_shutdown.get() {
      break;
    }

    deps.heartbeats.beat(HEARTBEAT_NAME);

    let job = match job_by_character_id.get(&character.character_id) {
      Some(j) => j,
      None => continue, // Not one of our pending jobs.
    };

    match &character.status {
      CharacterCreationStatus::Success => {
        info!(
          "Character {} completed successfully, processing job {}",
          character.character_id, job.job_token,
        );
        let outcome = with_deadline(
          "character processing",
          CHARACTER_PROCESSING_DEADLINE,
          process_successful_character(deps, job, character),
        ).await;

        match outcome {
          Ok(()) => {
            let _ = deps.job_stats.increment_success_count();
          }
          Err(err) => {
            warn!(
              "Error processing completed character {}: {:?}",
              character.character_id, err,
            );
            let _ = deps.job_stats.increment_failure_count();
          }
        }
      }
      CharacterCreationStatus::Failed => {
        info!(
          "Character {} failed, processing job {}",
          character.character_id, job.job_token,
        );
        let outcome = with_deadline(
          "failed character processing",
          CHARACTER_PROCESSING_DEADLINE,
          async { Ok::<(), anyhow::Error>(process_failed_character(deps, job, character).await) },
        ).await;

        if let Err(err) = outcome {
          warn!("Error processing failed character {}: {:?}", character.character_id, err);
        }
      }
      CharacterCreationStatus::Pending => {
        // Still in progress — check again next poll.
      }
    }
  }

  Ok(())
}
