//! What the generation feed shows: jobs still running, jobs that failed, and finished media.

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum MediaKind {
  Image,
  Video,
}

impl MediaKind {
  pub fn label(self) -> &'static str {
    match self {
      MediaKind::Image => "Image",
      MediaKind::Video => "Video",
    }
  }

  pub fn plural(self) -> &'static str {
    match self {
      MediaKind::Image => "images",
      MediaKind::Video => "videos",
    }
  }
}

/// A finished image or video in the user's library.
#[derive(Clone, Debug)]
pub struct FeedItem {
  /// The media file token.
  pub token: String,
  pub kind: MediaKind,
  /// A thumbnail URL (512 px wide where the CDN can resize).
  pub thumbnail: Option<String>,
  /// The original file.
  pub full_url: String,
  /// Unix seconds.
  pub created_at: i64,
  /// The model that made it (`maybe_model_type`).
  pub model_id: Option<String>,
  pub prompt_token: Option<String>,
  pub batch_token: Option<String>,
  pub duration_secs: Option<f32>,
}

/// A generation the server is still working on.
#[derive(Clone, Debug)]
pub struct PendingJob {
  pub job_token: String,
  pub kind: MediaKind,
  pub prompt: String,
  pub model_id: Option<String>,
  /// Unix seconds when it was enqueued.
  pub created_at: i64,
  /// The server's progress (0–100), when it reports any.
  pub server_progress: Option<u8>,
  /// How long this model usually takes, for the estimated progress bar.
  pub expected_secs: f32,
  pub batch_count: u32,
}

/// A generation that failed or was cancelled.
#[derive(Clone, Debug)]
pub struct FailedJob {
  pub job_token: String,
  pub prompt: String,
  pub model_id: Option<String>,
  pub updated_at: i64,
  pub reason: String,
  pub message: Option<String>,
  /// The first reference image, shown faintly behind the error.
  pub ref_image: Option<String>,
}

/// The progress and time-left labels for a pending job (`derivePendingStatus`).
pub fn pending_status(job: &PendingJob, now: i64) -> (u8, String) {
  let elapsed = (now - job.created_at).max(0) as f32;
  let estimated = ((elapsed / job.expected_secs.max(1.0)) * 100.0).min(95.0) as u8;
  let progress = job.server_progress.filter(|p| *p > 0).unwrap_or(estimated).min(99);
  if progress >= 95 {
    return (progress, "Almost done...".to_owned());
  }
  let left = (job.expected_secs - elapsed).max(1.0) as i64;
  let (h, m, s) = (left / 3600, (left % 3600) / 60, left % 60);
  let label = if h > 0 && m > 0 {
    format!("~{h}h {m}m")
  } else if h > 0 {
    format!("~{h}h")
  } else if m > 0 {
    format!("~{m}m")
  } else {
    format!("~{s}s")
  };
  (progress, label)
}

/// "just now", "5 minutes ago", … for list rows.
pub fn time_ago(then: i64, now: i64) -> String {
  let d = (now - then).max(0);
  let plural = |n: i64, unit: &str| format!("{n} {unit}{} ago", if n == 1 { "" } else { "s" });
  match d {
    0..=59 => "just now".to_owned(),
    60..=3599 => plural(d / 60, "minute"),
    3600..=86_399 => plural(d / 3600, "hour"),
    86_400..=2_591_999 => plural(d / 86_400, "day"),
    2_592_000..=31_535_999 => plural(d / 2_592_000, "month"),
    _ => plural(d / 31_536_000, "year"),
  }
}
