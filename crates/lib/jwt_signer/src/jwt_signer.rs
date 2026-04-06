use std::collections::BTreeMap;

use hmac::Hmac;
use hmac::NewMac;
use jwt::SignWithKey;
use jwt::VerifyWithKey;
use sha2::Sha256;

use crate::jwt_signer_error::JwtSignerError;

#[derive(Clone)]
pub struct JwtSigner {
  hmac_key: Hmac<Sha256>,
}

impl JwtSigner {

  pub fn new(hmac_secret: &str) -> Result<Self, JwtSignerError> {
    let hmac_key = Hmac::new_varkey(hmac_secret.as_bytes())
        .map_err(|_| JwtSignerError::JwtInvalidKeyLength)?;

    Ok(Self {
      hmac_key,
    })
  }

  /// Turn a map of claims into a signed JWT cookie payload (string)
  pub fn claims_to_jwt(&self, claims: &impl Claimable) -> Result<String, JwtSignerError> {
    claims.sign(&self.hmac_key)
  }

  /// Turn a JWT cookie payload (string) into a map of (key, value) claims
  pub fn jwt_to_claims(&self, jwt: &str) -> Result<BTreeMap<String, String>, JwtSignerError> {
    jwt.verify_with_key(&self.hmac_key)
      .map_err(JwtSignerError::JwtVerifyError)
  }
}

pub trait Claimable {
  fn sign(&self, hmac_key: &Hmac<Sha256>) -> Result<String, JwtSignerError>;
}

impl Claimable for BTreeMap<String, String> {
  fn sign(&self, hmac_key: &Hmac<Sha256>) -> Result<String, JwtSignerError> {
    self.sign_with_key(hmac_key)
      .map_err(JwtSignerError::JwtSignError)
  }
}

impl Claimable for BTreeMap<&str, &str> {
  fn sign(&self, hmac_key: &Hmac<Sha256>) -> Result<String, JwtSignerError> {
    self.sign_with_key(hmac_key)
      .map_err(JwtSignerError::JwtSignError)
  }
}

#[cfg(test)]
mod tests {
  use std::collections::BTreeMap;

  use crate::jwt_signer::JwtSigner;

  #[test]
  fn test_round_trip() {
    let signer = JwtSigner::new("secret").unwrap();

    let mut claims = BTreeMap::new();
    claims.insert("foo", "yes");
    claims.insert("bar", "no");

    let jwt = signer.claims_to_jwt(&claims).unwrap();

    let output_claims = signer.jwt_to_claims(&jwt).unwrap();

    assert_eq!(claims.len(), output_claims.len());

    for (k, v) in output_claims.iter() {
      assert_eq!(v, claims[k.as_str()]);
    }
  }

  #[test]
  fn test_stability() {
    let signer = JwtSigner::new("secret").unwrap();

    let mut claims = BTreeMap::new();
    claims.insert("foo", "yes");
    claims.insert("bar", "no");

    let jwt = signer.claims_to_jwt(&claims).unwrap();

    assert_eq!("eyJhbGciOiJIUzI1NiJ9.eyJiYXIiOiJubyIsImZvbyI6InllcyJ9.k4eRvIrtw4tuGDtQqSmEDngtGYAaQVRYVMCK5N3JcZA", &jwt);
  }
}
