use crate::certs::key_map::KeyMap;
use errors::{anyhow, AnyhowResult};
use jwt_simple::prelude::RS256PublicKey;
use serde_derive::Deserialize;

/// Parse Google's JWK keys into usable public keys.
/// Grab Google's keys from here: https://www.googleapis.com/oauth2/v3/certs
/// These are updated frequently throughout the day and must be re-fetched.
/// NB: This implementation is adapted from the crate `signin`.
pub fn jwk_to_public_key(json_web_key: &str) -> AnyhowResult<KeyMap> {
  let mut key_map = KeyMap::new();

  let json_keys: JsonKeys = serde_json::from_str(json_web_key)?;

  for key in json_keys.keys {
    if key.use_ != "sig" {
      continue;
    }
    match key.alg.as_ref() {
      "RS256" => {
        let n_decoded = base64_decode_url(&key.n)?;
        let e_decoded = base64_decode_url(&key.e)?;

        let public_key = RS256PublicKey::from_components(&n_decoded, &e_decoded)?
            .with_key_id(&key.kid);

        key_map.insert(key.kid, public_key);
      }
      _ => {},
    }
  }

  if key_map.is_empty() {
    return Err(anyhow!("No keys found in JWK"));
  }

  Ok(key_map)
}

fn base64_decode_url(msg: &str) -> Result<Vec<u8>, base64::DecodeError> {
  base64::decode_config(msg, base64::URL_SAFE)
}

// NB: These definitions are taken from the crate 'signin',
// which has a correct implementation but does not expose
// any of the payload for use. It also appears to be
// unmaintained.
#[derive(Deserialize)]
pub struct JsonKeys {
  pub keys: Vec<JsonKey>,
}

#[derive(Deserialize)]
pub struct JsonKey {
  pub kty: String,
  pub alg: String,
  #[serde(rename = "use")]
  pub use_: String,
  pub kid: String,
  pub n: String,
  pub e: String,
}

#[cfg(test)]
mod tests {
  use crate::certs::jwk_to_public_key::jwk_to_public_key;
  use jwt_simple::algorithms::RSAPublicKeyLike;
  use std::fs::read_to_string;
  use test_utils::test_file_path::test_file_path;

  #[test]
  fn test_jwk_payload_decode() {
    let file = test_file_path("test_data/crypto/google_sign_in.2024-09-20.jwk").unwrap();
    let jwk_payload = read_to_string(file).unwrap();

    let key_map = jwk_to_public_key(&jwk_payload).unwrap();

    // Two keys in the payload
    assert_eq!(key_map.len(), 2);

    // First key
    let public_key = key_map.get("b2620d5e7f132b52afe8875cdf3776c064249d04")
        .expect("key should exist");

    assert_eq!(public_key.sha1_thumbprint(), "JI3Z88BipRcyp0WRF1KN9aX_P3Y");

    // Second key
    let public_key = key_map.get("5aaff47c21d06e266cce395b2145c7c6d4730ea5")
        .expect("key should exist");

    assert_eq!(public_key.sha1_thumbprint(), "vYxSlxKNLmgo1FWPtm2eVMbCnRU");

    // Assertions for all
    for (key_id, public_key) in key_map.into_iter() {
      // Key id in map matches internally held
      let k_id = public_key.key_id().as_deref().unwrap();
      assert_eq!(key_id, k_id);
    }
  }
}
