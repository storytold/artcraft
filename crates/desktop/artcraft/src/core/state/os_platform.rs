
#[derive(Copy,Clone,Eq,PartialEq,Debug)]
pub enum OsPlatform {
  Linux,
  MacOs,
  Windows,
}

impl OsPlatform {
  pub fn maybe_get() -> Option<Self> {
    // Totally scientific.
    // https://doc.rust-lang.org/std/env/consts/constant.OS.html
    match std::env::consts::OS {
      "linux" => Some(Self::Linux),
      "windows" => Some(Self::Windows),
      "macos" | "apple" => Some(Self::MacOs),
      _ => None,
    }
  }
  
  pub fn maybe_get_str() -> Option<&'static str> {
    match Self::maybe_get() {
      Some(Self::Linux) => Some("linux"),
      Some(Self::Windows) => Some("windows"),
      Some(Self::MacOs) => Some("macos"), // NB: "apple" can become "macos".
      None => None,
    }
  }

  pub fn get() -> Self {
    Self::maybe_get().unwrap_or(Self::Linux)
  }
}
