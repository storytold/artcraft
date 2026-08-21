use crate::job_dependencies::ReengagementConfig;

const MAX_SCORE: f64 = 1000.0;
const MAX_VALUE_COMPONENT: f64 = 700.0;
const MAX_RECENCY_COMPONENT: f64 = 300.0;

/// Re-engagement score in `0..=1000`; higher = better re-engagement target.
///
/// `0` means "not a target": still active, never paid, or no net spend. Otherwise
/// the score is a value component (dominant, log-scaled lifetime net spend) plus a
/// recency component that decays with time since the user lapsed. A big spender who
/// lapsed a while ago still outranks a small spender who just lapsed.
pub fn reengagement_score(
  lifetime_net_spend_usd_cents: u64,
  maybe_days_since_last_payment: Option<u32>,
  config: &ReengagementConfig,
) -> u32 {
  let days_since_last = match maybe_days_since_last_payment {
    Some(days) => days,
    None => return 0, // never paid -> not a re-engagement target
  };

  if lifetime_net_spend_usd_cents == 0 {
    return 0;
  }
  if days_since_last < config.active_threshold_days {
    return 0; // still active -> no need to re-engage
  }

  let dollars = lifetime_net_spend_usd_cents as f64 / 100.0;
  let value_component = (MAX_VALUE_COMPONENT * (1.0 + dollars).ln()
    / (1.0 + config.value_cap_dollars).ln())
    .clamp(0.0, MAX_VALUE_COMPONENT);

  let days_lapsed = (days_since_last - config.active_threshold_days) as f64;
  let recency_fraction = (1.0 - days_lapsed / config.decay_days).max(0.0);
  let recency_component = MAX_RECENCY_COMPONENT * recency_fraction;

  (value_component + recency_component).round().clamp(0.0, MAX_SCORE) as u32
}

#[cfg(test)]
mod tests {
  use super::*;

  const CONFIG: ReengagementConfig = ReengagementConfig {
    value_cap_dollars: 1000.0,
    active_threshold_days: 14,
    decay_days: 350.0,
  };

  #[test]
  fn never_paid_scores_zero() {
    assert_eq!(reengagement_score(50_000, None, &CONFIG), 0);
  }

  #[test]
  fn still_active_scores_zero() {
    assert_eq!(reengagement_score(50_000, Some(3), &CONFIG), 0);
  }

  #[test]
  fn zero_net_spend_scores_zero() {
    assert_eq!(reengagement_score(0, Some(90), &CONFIG), 0);
  }

  #[test]
  fn whale_recently_lapsed_outranks_whale_long_lapsed() {
    let recent = reengagement_score(100_000, Some(35), &CONFIG); // $1000, ~3wks
    let old = reengagement_score(100_000, Some(379), &CONFIG); // $1000, ~1yr
    assert!(recent > old, "recent={recent} old={old}");
    assert!(recent > 900, "recent={recent}");
  }

  #[test]
  fn whale_long_lapsed_outranks_small_recent() {
    let whale_old = reengagement_score(100_000, Some(379), &CONFIG); // $1000, ~1yr -> ~700
    let small_recent = reengagement_score(2_000, Some(35), &CONFIG); // $20, ~3wks
    assert!(whale_old > small_recent, "whale_old={whale_old} small_recent={small_recent}");
  }

  #[test]
  fn score_never_exceeds_1000() {
    assert!(reengagement_score(100_000_000, Some(15), &CONFIG) <= 1000);
  }
}
