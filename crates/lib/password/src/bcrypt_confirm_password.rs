use crate::constants::PASSWORD_HASH_SENTINEL_VALUE;
use crate::errors::password_confirm_error::PasswordConfirmError;

pub fn bcrypt_confirm_password(password: String, bcrypt_hash: &str) -> Result<bool, PasswordConfirmError> {
  if bcrypt_hash.is_empty() {
    return Err(PasswordConfirmError::HashNotProvided);
  }

  if bcrypt_hash == PASSWORD_HASH_SENTINEL_VALUE {
    return Err(PasswordConfirmError::HashIsSentinelValue);
  }

  let verified = bcrypt::verify(&password, bcrypt_hash)?;
  Ok(verified)
}

#[cfg(test)]
mod tests {
  use crate::bcrypt_confirm_password::bcrypt_confirm_password;
  use crate::errors::password_confirm_error::PasswordConfirmError;

  #[test]
  fn test_confirmation() {
    // NB: This is to make sure we don't migrate the algorithm to a state where it won't work anymore.
    // NB: Be mindful that these are expensive to compute and don't add too many test cases.
    let hash_to_passwords = [
      ("$2b$12$ieU6.dygzbiZjtED5Qz8Vu8fSjDjE9R4AykzpGI5hL666AjV753Iu", "password"),
      ("$2b$12$nGHAaxDCXj0oC/C5vbnhAOQhZHprKmJ8eTnX.uVKXvQNFildSAIAa", "hunter2"),
      ("$2b$12$USIc/tDDOobgW96sBdw13u2Ts9bmddMHDrrixBdwASxur2h4oy8iC", "hunter2"), // hunter2 again
      ("$2b$12$9418BXjnbbJwfu1YFe4r3OOsePo6kflnqypfOFnA1QsID06mqn3X.", "&*KA@jh2l9*2!!2"),
    ];

    for (hash, password) in hash_to_passwords {
      let valid = bcrypt_confirm_password(password.to_string(), hash).unwrap();
      assert!(valid);
    }
  }

  #[test]
  fn test_empty_hash_returns_error() {
    let result = bcrypt_confirm_password("password".to_string(), "");
    assert!(matches!(result, Err(PasswordConfirmError::HashNotProvided)));
  }

  #[test]
  fn test_sentinel_value_returns_error() {
    let result = bcrypt_confirm_password("password".to_string(), "*");
    assert!(matches!(result, Err(PasswordConfirmError::HashIsSentinelValue)));
  }
}
