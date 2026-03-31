use crate::errors::password_hash_error::PasswordHashError;

pub fn bcrypt_hash_password(password: String) -> Result<String, PasswordHashError> {
  let hash = bcrypt::hash(&password, bcrypt::DEFAULT_COST)?;
  Ok(hash)
}

#[cfg(test)]
mod tests {
  use crate::bcrypt_hash_password::bcrypt_hash_password;

  #[test]
  fn test_password_hash_round_trip() {
    let password = "password";
    let hash = bcrypt_hash_password(password.to_string()).unwrap();
    let valid = bcrypt::verify(password, &hash).unwrap();
    assert!(valid);
  }
}
