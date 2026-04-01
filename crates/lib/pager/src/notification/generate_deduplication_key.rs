use chrono::{DateTime, Utc};
use sha2::{Sha256, Digest};

use crate::notification::notification_details::NotificationDetails;

/// Returns the number of whole hours since the Unix epoch for the given time.
fn hours_since_epoch(time: DateTime<Utc>) -> i64 {
  time.timestamp() / 3600
}

/// Generate a deduplication key for a notification.
///
/// Notifications with the same key are considered duplicates and can be suppressed.
/// The key is a hex-encoded SHA-256 hash of the notification's identifying fields.
///
/// When both `http_method` and `endpoint_path` are present, they are included in the
/// hash so that different endpoints with the same title produce distinct keys.
/// The `hours_since_epoch` of the event time is included so that the same notification
/// firing in different hours produces a different key (allowing re-alerting).
pub(crate) fn generate_deduplication_key(details: &NotificationDetails) -> String {
  let mut hasher = Sha256::new();

  hasher.update(details.title.as_bytes());
  hasher.update(if details.is_from_error { b"1" } else { b"0" });

  if let (Some(method), Some(path)) = (&details.http_method, &details.http_path) {
    hasher.update(method.as_bytes());
    hasher.update(path.as_bytes());
  }

  if let Some(status_code) = details.http_status_code {
    hasher.update(status_code.to_le_bytes());
  }

  hasher.update(hours_since_epoch(details.event_time).to_le_bytes());

  let result = hasher.finalize();
  result.iter().map(|b| format!("{:02x}", b)).collect()
}

#[cfg(test)]
mod tests {
  use super::*;
  use chrono::TimeZone;

  fn make_details(
    title: &str,
    is_from_error: bool,
    http_method: Option<&str>,
    http_path: Option<&str>,
    event_time: DateTime<Utc>,
  ) -> NotificationDetails {
    NotificationDetails {
      title: title.to_string(),
      description: None,
      event_time,
      http_method: http_method.map(|s| s.to_string()),
      http_path: http_path.map(|s| s.to_string()),
      http_status_code: None,
      is_from_error,
      urgency: None,
      user_token: None,
      media_file_token: None,
      inference_job_token: None,
      third_party_id: None,
      maybe_error: None,
    }
  }

  // -- hours_since_epoch tests --

  mod hours_since_epoch_tests {
    use super::*;
    #[test]
    fn hours_since_epoch_at_unix_epoch() {
      let epoch = Utc.with_ymd_and_hms(1970, 1, 1, 0, 0, 0).unwrap();
      assert_eq!(hours_since_epoch(epoch), 0);
    }

    #[test]
    fn hours_since_epoch_at_one_hour() {
      let time = Utc.with_ymd_and_hms(1970, 1, 1, 1, 0, 0).unwrap();
      assert_eq!(hours_since_epoch(time), 1);
    }

    #[test]
    fn hours_since_epoch_mid_hour_rounds_down() {
      let time = Utc.with_ymd_and_hms(1970, 1, 1, 1, 30, 0).unwrap();
      assert_eq!(hours_since_epoch(time), 1);
    }

    #[test]
    fn hours_since_epoch_just_before_next_hour() {
      let time = Utc.with_ymd_and_hms(1970, 1, 1, 1, 59, 59).unwrap();
      assert_eq!(hours_since_epoch(time), 1);
    }

    #[test]
    fn hours_since_epoch_known_date() {
      // 2026-03-30 14:00:00 UTC
      let time = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();
      assert_eq!(hours_since_epoch(time), 493022);
    }
  }

  // -- Consistent hashing tests --

  mod consistent_hashing_tests {
    use super::*;

    #[test]
    fn consistent_hash_same_inputs() {
      let time = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();

      let a = make_details("db connection failed", true, Some("POST"), Some("/v1/jobs"), time);
      let b = make_details("db connection failed", true, Some("POST"), Some("/v1/jobs"), time);

      assert_eq!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }

    #[test]
    fn consistent_hash_without_http_fields() {
      let time = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();

      let a = make_details("something broke", true, None, None, time);
      let b = make_details("something broke", true, None, None, time);

      assert_eq!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }

    // -- Same hour deduplication tests --

    #[test]
    fn same_key_within_same_hour() {
      let t1 = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();
      let t2 = Utc.with_ymd_and_hms(2026, 3, 30, 14, 45, 30).unwrap();

      let a = make_details("timeout", true, Some("GET"), Some("/v1/users"), t1);
      let b = make_details("timeout", true, Some("GET"), Some("/v1/users"), t2);

      assert_eq!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }
  }

  // -- Differentiation tests --

  mod differentiation_tests {
    use super::*;

    #[test]
    fn different_key_across_hour_boundary() {
      let t1 = Utc.with_ymd_and_hms(2026, 3, 30, 14, 59, 59).unwrap();
      let t2 = Utc.with_ymd_and_hms(2026, 3, 30, 15, 0, 0).unwrap();

      let a = make_details("timeout", true, Some("GET"), Some("/v1/users"), t1);
      let b = make_details("timeout", true, Some("GET"), Some("/v1/users"), t2);

      assert_ne!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }

    #[test]
    fn different_title_different_key() {
      let time = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();

      let a = make_details("error A", true, None, None, time);
      let b = make_details("error B", true, None, None, time);

      assert_ne!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }

    #[test]
    fn different_is_from_error_different_key() {
      let time = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();

      let a = make_details("something happened", true, None, None, time);
      let b = make_details("something happened", false, None, None, time);

      assert_ne!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }

    #[test]
    fn different_endpoint_different_key() {
      let time = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();

      let a = make_details("db error", true, Some("POST"), Some("/v1/jobs"), time);
      let b = make_details("db error", true, Some("POST"), Some("/v1/users"), time);

      assert_ne!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }

    #[test]
    fn different_method_different_key() {
      let time = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();

      let a = make_details("db error", true, Some("GET"), Some("/v1/jobs"), time);
      let b = make_details("db error", true, Some("POST"), Some("/v1/jobs"), time);

      assert_ne!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }
  }

  mod http_status_code_tests {
    use super::*;

    fn make_details_with_status(
      title: &str,
      is_from_error: bool,
      http_method: Option<&str>,
      http_path: Option<&str>,
      http_status_code: Option<u16>,
      event_time: DateTime<Utc>,
    ) -> NotificationDetails {
      NotificationDetails {
        title: title.to_string(),
        description: None,
        event_time,
        http_method: http_method.map(|s| s.to_string()),
        http_path: http_path.map(|s| s.to_string()),
        http_status_code,
        is_from_error,
        urgency: None,
        user_token: None,
        media_file_token: None,
        inference_job_token: None,
        third_party_id: None,
        maybe_error: None,
      }
    }

    #[test]
    fn different_status_code_different_key() {
      let time = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();

      let a = make_details_with_status("db error", true, Some("POST"), Some("/v1/jobs"), Some(500), time);
      let b = make_details_with_status("db error", true, Some("POST"), Some("/v1/jobs"), Some(503), time);

      assert_ne!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }

    #[test]
    fn status_code_vs_none_different_key() {
      let time = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();

      let a = make_details_with_status("db error", true, Some("POST"), Some("/v1/jobs"), Some(500), time);
      let b = make_details_with_status("db error", true, Some("POST"), Some("/v1/jobs"), None, time);

      assert_ne!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }

    #[test]
    fn same_status_code_same_key() {
      let t1 = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();
      let t2 = Utc.with_ymd_and_hms(2026, 3, 30, 14, 30, 0).unwrap();

      let a = make_details_with_status("timeout", true, Some("GET"), Some("/v1/users"), Some(504), t1);
      let b = make_details_with_status("timeout", true, Some("GET"), Some("/v1/users"), Some(504), t2);

      assert_eq!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }

    #[test]
    fn status_code_without_http_fields_still_differentiates() {
      let time = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();

      let a = make_details_with_status("error", true, None, None, Some(500), time);
      let b = make_details_with_status("error", true, None, None, Some(502), time);

      assert_ne!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }
  }

  mod other_behaviors {
    use super::*;
    #[test]
    fn only_method_set_ignores_it() {
      // When only http_method is Some but endpoint_path is None, HTTP fields are excluded.
      let time = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();

      let a = make_details("db error", true, Some("POST"), None, time);
      let b = make_details("db error", true, None, None, time);

      assert_eq!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }

    #[test]
    fn only_path_set_ignores_it() {
      // When only endpoint_path is Some but http_method is None, HTTP fields are excluded.
      let time = Utc.with_ymd_and_hms(2026, 3, 30, 14, 0, 0).unwrap();

      let a = make_details("db error", true, None, Some("/v1/jobs"), time);
      let b = make_details("db error", true, None, None, time);

      assert_eq!(generate_deduplication_key(&a), generate_deduplication_key(&b));
    }
  }
}
