use crate::kinovi_version::KinoviVersion;
use anyhow::anyhow;
use log::info;
use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;

// Configuration switch
const ENV_SEEDANCE2PRO_VERSION: &str = "SEEDANCE2PRO_VERSION";

// Cookies for Volcengine
#[deprecated]
const ENV_SEEDANCE2PRO_LEGACY_COOKIES: &str = "SEEDANCE2PRO_COOKIES";
const ENV_SEEDANCE2PRO_VOLCENGINE_COOKIES: &str = "SEEDANCE2PRO_VOLCENGINE_COOKIES";

// Cookies for BytePlus
#[deprecated]
const ENV_SEEDANCE2PRO_LEGACY_ALT_COOKIES: &str = "SEEDANCE2PRO_ALT_COOKIES";
const ENV_SEEDANCE2PRO_BYTEPLUS_COOKIES: &str = "SEEDANCE2PRO_BYTEPLUS_COOKIES";

// Cookies for BytePlus Ultra
const ENV_SEEDANCE2PRO_BYTEPLUS_ULTRA_COOKIES: &str = "SEEDANCE2PRO_BYTEPLUS_ULTRA_COOKIES";


pub fn get_kinovi_version() -> anyhow::Result<KinoviVersion> {
  info!("Reading kinovi version from first CLI arg (optional - typical production config is via env vars):");

  if let Some(arg) = std::env::args().nth(1) {
    return parse_kinovi_version(&arg);
  }

  info!("Reading kinovi version from env var: {}", ENV_SEEDANCE2PRO_VERSION);

  if let Some(version) = easyenv::get_env_string_optional(ENV_SEEDANCE2PRO_VERSION) {
    return parse_kinovi_version(&version);
  }

  Err(anyhow!(
    "kinovi version not specified: set env var {} or pass volcengine|byteplus|byteplusultra as the first CLI arg",
    ENV_SEEDANCE2PRO_VERSION,
  ))
}

fn parse_kinovi_version(value: &str) -> anyhow::Result<KinoviVersion> {
  match value.trim().to_lowercase().as_str() {
    "volcengine" => Ok(KinoviVersion::Volcengine),
    "byteplus" => Ok(KinoviVersion::BytePlus),
    "byteplusultra" => Ok(KinoviVersion::BytePlusUltra),
    other => Err(anyhow!(
      "invalid kinovi version {:?} (expected volcengine|byteplus|byteplusultra)",
      other,
    )),
  }
}

pub fn get_kinovi_session(version: KinoviVersion) -> anyhow::Result<Seedance2ProSession> {
  let cookies = read_kinovi_cookies(version)?;
  Ok(Seedance2ProSession::from_cookies_string(cookies))
}

fn read_kinovi_cookies(version: KinoviVersion) -> anyhow::Result<String> {
  match version {
    KinoviVersion::Volcengine => {
      info!("Using Volcengine cookies from env var: {}", ENV_SEEDANCE2PRO_VOLCENGINE_COOKIES);
      easyenv::get_env_string_optional(ENV_SEEDANCE2PRO_VOLCENGINE_COOKIES)
          .or_else(|| easyenv::get_env_string_optional(ENV_SEEDANCE2PRO_LEGACY_COOKIES))
          .ok_or_else(|| anyhow!("missing Seedance2Pro cookies in in env var {}", ENV_SEEDANCE2PRO_VOLCENGINE_COOKIES))
    }
    KinoviVersion::BytePlus => {
      info!("Using BytePlus cookies from env var: {}", ENV_SEEDANCE2PRO_BYTEPLUS_COOKIES);
      easyenv::get_env_string_optional(ENV_SEEDANCE2PRO_BYTEPLUS_COOKIES)
          .or_else(|| easyenv::get_env_string_optional(ENV_SEEDANCE2PRO_LEGACY_ALT_COOKIES))
          .ok_or_else(|| anyhow!("missing Seedance2Pro cookies in in env var {}", ENV_SEEDANCE2PRO_BYTEPLUS_COOKIES))
    }
    KinoviVersion::BytePlusUltra => {
      info!("Using BytePlus Ultra cookies from env var: {}", ENV_SEEDANCE2PRO_BYTEPLUS_ULTRA_COOKIES);
      let cookies = easyenv::get_env_string_required(ENV_SEEDANCE2PRO_BYTEPLUS_ULTRA_COOKIES)?;
      Ok(cookies)
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn parses_volcengine() {
    assert!(matches!(parse_kinovi_version("volcengine"), Ok(KinoviVersion::Volcengine)));
  }

  #[test]
  fn parses_byteplus() {
    assert!(matches!(parse_kinovi_version("byteplus"), Ok(KinoviVersion::BytePlus)));
  }

  #[test]
  fn parses_byteplusultra() {
    assert!(matches!(parse_kinovi_version("byteplusultra"), Ok(KinoviVersion::BytePlusUltra)));
  }

  #[test]
  fn parse_is_case_insensitive() {
    assert!(matches!(parse_kinovi_version("Volcengine"), Ok(KinoviVersion::Volcengine)));
    assert!(matches!(parse_kinovi_version("BYTEPLUS"), Ok(KinoviVersion::BytePlus)));
    assert!(matches!(parse_kinovi_version("BytePlusUltra"), Ok(KinoviVersion::BytePlusUltra)));
  }

  #[test]
  fn parse_trims_whitespace() {
    assert!(matches!(parse_kinovi_version("  volcengine\n"), Ok(KinoviVersion::Volcengine)));
  }

  #[test]
  fn unknown_value_errors() {
    let err = parse_kinovi_version("nope").expect_err("nope should not parse");
    assert!(err.to_string().contains("nope"));
  }

  #[test]
  fn empty_value_errors() {
    assert!(parse_kinovi_version("").is_err());
    assert!(parse_kinovi_version("   ").is_err());
  }
}
