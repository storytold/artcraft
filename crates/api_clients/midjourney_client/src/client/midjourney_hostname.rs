
/// Multiple third party Midjourney clients make this configurable.
/// Not sure why, I'm just cargo culting it.
#[derive(Clone)]
pub enum MidjourneyHostname {
  Standard,
  Custom(String),
}

impl MidjourneyHostname {
  pub fn as_str(&self) -> &str {
    match self {
      Self::Standard => "www.midjourney.com",
      Self::Custom(domain) => domain,
    }
  }
}
