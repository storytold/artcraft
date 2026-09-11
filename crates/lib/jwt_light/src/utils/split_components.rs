use crate::error::JwtError;

const SEPARATOR: &str = ".";

pub fn split_components(token: &str) -> Result<[&str; 3], JwtError> {
  let mut components = token.split(SEPARATOR);
  let header = components.next()
      .ok_or_else(|| jwt_error("no header component"))?;

  let claims = components.next()
      .ok_or_else(|| jwt_error("no claims component"))?;

  let signature = components.next()
      .ok_or_else(|| jwt_error("no signature component"))?;

  if components.next().is_some() {
    return Err(jwt_error("too many components"));
  }

  Ok([header, claims, signature])
}

fn jwt_error(reason: &str) -> JwtError {
  JwtError::ParseError(reason.to_string())
}
