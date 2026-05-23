use log::debug;
use serde_derive::Serialize;

use crate::creds::DatadogApiKey;
use crate::error::DatadogError;

pub const DEFAULT_BASE_URL: &str = "https://api.datadoghq.com";

/// Cheap-to-clone HTTP client for the Datadog metrics API.
#[derive(Clone)]
pub struct DatadogClient {
  base_url: String,
  api_key: DatadogApiKey,
  http: reqwest::Client,
}

impl DatadogClient {
  pub fn new(api_key: DatadogApiKey) -> Self {
    Self::with_base_url(api_key, DEFAULT_BASE_URL.to_string())
  }

  pub fn with_base_url(api_key: DatadogApiKey, base_url: String) -> Self {
    Self {
      base_url,
      api_key,
      http: reqwest::Client::new(),
    }
  }

  /// POST `/api/v1/distribution_points`. Each `DistributionSeries.points`
  /// entry contains a list of *raw* observation values; Datadog computes
  /// percentiles server-side, so no t-digest plumbing here.
  pub async fn submit_distribution_points(
    &self,
    series: Vec<DistributionSeries>,
  ) -> Result<(), DatadogError> {
    if series.is_empty() {
      return Ok(());
    }
    let body = DistributionsBody { series };
    let url = format!("{}/api/v1/distribution_points", self.base_url);
    debug!("submitting {} distribution series to {}", body.series.len(), url);
    let response = self.http
      .post(&url)
      .header("DD-API-KEY", self.api_key.as_str())
      .json(&body)
      .send()
      .await?;
    expect_2xx(response).await
  }

  /// POST `/api/v1/series`. For pre-aggregated counts/gauges/rates.
  pub async fn submit_series(
    &self,
    series: Vec<MetricSeries>,
  ) -> Result<(), DatadogError> {
    if series.is_empty() {
      return Ok(());
    }
    let body = SeriesBody { series };
    let url = format!("{}/api/v1/series", self.base_url);
    debug!("submitting {} metric series to {}", body.series.len(), url);
    let response = self.http
      .post(&url)
      .header("DD-API-KEY", self.api_key.as_str())
      .json(&body)
      .send()
      .await?;
    expect_2xx(response).await
  }
}

async fn expect_2xx(response: reqwest::Response) -> Result<(), DatadogError> {
  let status = response.status();
  if status.is_success() {
    return Ok(());
  }
  let body = response.text().await.unwrap_or_default();
  Err(DatadogError::Api { status: status.as_u16(), body })
}

// ==================== Wire-format types ====================

#[derive(Serialize)]
struct DistributionsBody {
  series: Vec<DistributionSeries>,
}

#[derive(Clone, Debug, Serialize)]
pub struct DistributionSeries {
  pub metric: String,
  /// Each point is `[unix_timestamp_secs, [v1, v2, ...]]`.
  pub points: Vec<DistributionPoint>,
  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub tags: Vec<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub host: Option<String>,
}

/// Tuple-style serialization: serializes as `[timestamp, [values]]`.
#[derive(Clone, Debug, Serialize)]
pub struct DistributionPoint(pub i64, pub Vec<f64>);

#[derive(Serialize)]
struct SeriesBody {
  series: Vec<MetricSeries>,
}

#[derive(Clone, Debug, Serialize)]
pub struct MetricSeries {
  pub metric: String,
  /// Each point is `[unix_timestamp_secs, value]`.
  pub points: Vec<MetricPoint>,
  /// `"count"`, `"gauge"`, or `"rate"`.
  #[serde(rename = "type")]
  pub metric_type: String,
  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub tags: Vec<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub host: Option<String>,
  /// Seconds. Required by Datadog for `count`/`rate`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub interval: Option<i64>,
}

/// Tuple-style serialization: serializes as `[timestamp, value]`.
#[derive(Clone, Debug, Serialize)]
pub struct MetricPoint(pub i64, pub f64);

// ==================== Tests ====================

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn distribution_point_serializes_as_tuple() {
    let point = DistributionPoint(1_700_000_000, vec![1.0, 2.5, 3.0]);
    let json = serde_json::to_string(&point).unwrap();
    assert_eq!(json, "[1700000000,[1.0,2.5,3.0]]");
  }

  #[test]
  fn metric_point_serializes_as_tuple() {
    let point = MetricPoint(1_700_000_000, 42.0);
    let json = serde_json::to_string(&point).unwrap();
    assert_eq!(json, "[1700000000,42.0]");
  }

  #[test]
  fn metric_series_uses_type_key() {
    let s = MetricSeries {
      metric: "x".to_string(),
      points: vec![MetricPoint(1, 1.0)],
      metric_type: "count".to_string(),
      tags: vec!["a:b".to_string()],
      host: Some("h".to_string()),
      interval: Some(10),
    };
    let json = serde_json::to_string(&s).unwrap();
    assert!(json.contains(r#""type":"count""#), "got: {}", json);
    assert!(json.contains(r#""interval":10"#), "got: {}", json);
  }

  #[test]
  fn empty_tags_omitted() {
    let s = MetricSeries {
      metric: "x".to_string(),
      points: vec![MetricPoint(1, 1.0)],
      metric_type: "gauge".to_string(),
      tags: vec![],
      host: None,
      interval: None,
    };
    let json = serde_json::to_string(&s).unwrap();
    assert!(!json.contains("tags"));
    assert!(!json.contains("host"));
    assert!(!json.contains("interval"));
  }

  #[test]
  fn api_key_debug_is_redacted() {
    let key = crate::creds::DatadogApiKey::new("supersecret123");
    let debug = format!("{:?}", key);
    assert!(!debug.contains("supersecret123"));
    assert!(debug.contains("***"));
  }

  // ==================== Real-API smoke tests ====================
  //
  // These are marked `#[ignore]` because they hit api.datadoghq.com with a
  // real API key from `datadog_key.txt` at the workspace root and submit a
  // tiny named metric (`datadog_client.smoke_test`).
  //
  // Run explicitly with:
  //   cargo test -p datadog_client -- --ignored
  //
  // After running, look for the metric in Datadog within ~1 minute.

  mod real_api_smoke {
    use super::*;
    use crate::creds::DatadogApiKey;
    use crate::test_utils::get_test_api_key::get_test_api_key;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn now_secs() -> i64 {
      SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs() as i64).unwrap_or(0)
    }

    fn smoke_tags() -> Vec<String> {
      vec![
        "source:datadog_client_smoke_test".to_string(),
        "env:test".to_string(),
      ]
    }

    #[ignore] // hits the real Datadog API
    #[tokio::test]
    async fn submit_distribution_points_real_api() {
      let _ = env_logger::builder().is_test(true).try_init();
      let key = get_test_api_key().expect("could not load datadog_key.txt");
      let client = DatadogClient::new(DatadogApiKey::new(key));
      let series = vec![DistributionSeries {
        metric: "datadog_client.smoke_test.duration".to_string(),
        points: vec![DistributionPoint(now_secs(), vec![1.0, 2.5, 7.0])],
        tags: smoke_tags(),
        host: Some("smoke-test-host".to_string()),
      }];
      client.submit_distribution_points(series).await
        .expect("distribution submission should succeed");
    }

    #[ignore] // hits the real Datadog API
    #[tokio::test]
    async fn submit_series_real_api() {
      let _ = env_logger::builder().is_test(true).try_init();
      let key = get_test_api_key().expect("could not load datadog_key.txt");
      let client = DatadogClient::new(DatadogApiKey::new(key));
      let series = vec![MetricSeries {
        metric: "datadog_client.smoke_test.count".to_string(),
        points: vec![MetricPoint(now_secs(), 1.0)],
        metric_type: "count".to_string(),
        tags: smoke_tags(),
        host: Some("smoke-test-host".to_string()),
        interval: Some(10),
      }];
      client.submit_series(series).await
        .expect("series submission should succeed");
    }
  }
}
