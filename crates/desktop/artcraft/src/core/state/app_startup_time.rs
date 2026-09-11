use chrono::{DateTime, TimeDelta, Utc};

pub struct AppStartupTime {
  startup_time: DateTime<Utc>,
}

impl AppStartupTime {
  pub fn new() -> Self {
    Self {
      startup_time: Utc::now(),
    }
  }

  pub fn get_startup_time(&self) -> DateTime<Utc> {
    self.startup_time
  }
  
  pub fn time_delta_since(&self) -> TimeDelta {
    let now = Utc::now();
    now.signed_duration_since(self.startup_time)
  }
}
