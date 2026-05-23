use log::debug;
use crate::error::grok_client_error::GrokClientError;
use crate::requests::index_page::signature::round_two_decimals::round_two_decimals;

/*
    @staticmethod
    def tohex(num: float) -> str:
        rounded = round(float(num), 2)
        if rounded == 0.0:
            return "0"
        sign = "-" if copysign(1.0, rounded) < 0 else ""
        absval = abs(rounded)
        intpart = int(floor(absval))
        frac = absval - intpart
        if frac == 0.0:
            return sign + format(intpart, "x")
        frac_digits = []
        f = frac
        for _ in range(20):
            f *= 16
            digit = int(floor(f + 1e-12))
            frac_digits.append(format(digit, "x"))
            f -= digit
            if abs(f) < 1e-12:
                break
        frac_str = "".join(frac_digits).rstrip("0")
        if frac_str == "":
            return sign + format(intpart, "x")
        return sign + format(intpart, "x") + "." + frac_str
*/

/// Convert the floating point number to a hexadecimal representation
pub fn signature_to_hex(num: f64) -> Result<String, GrokClientError> {
  // rounded = round(float(num), 2)
  let rounded = round_two_decimals(num);

  debug!("[to_hex] rounded = {}", rounded);

  if rounded == 0.0 {
    return Ok("0".to_string());
  }

  // sign = "-" if copysign(1.0, rounded) < 0 else ""
  let test = 1.0f64.copysign(rounded);
  let sign = if test < 0.0 { "-" } else { "" };

  debug!("[to_hex] sign = {}", sign);

  let absval = rounded.abs();
  let intpart = absval.floor() as u32;

  debug!("[to_hex] absval = {}", absval);
  debug!("[to_hex] intpart = {}", intpart);

  let frac = absval - (intpart as f64);

  debug!("[to_hex] frac = {}", frac);

  if frac == 0.0 {
    // return sign + format(intpart, "x") -- this is hex formatting
    let ret = format!("{sign}{intpart:x}");
    debug!("[to_hex] return = {}", ret);
    return Ok(ret);
  }

  /*
        frac_digits = []
        f = frac
        for _ in range(20):
            f *= 16
            digit = int(floor(f + 1e-12))
            frac_digits.append(format(digit, "x"))
            f -= digit
            if abs(f) < 1e-12:
                break
        frac_str = "".join(frac_digits).rstrip("0")
        if frac_str == "":
            return sign + format(intpart, "x")
        return sign + format(intpart, "x") + "." + frac_str
   */

  let mut frac_digits = Vec::new();

  let mut f = frac;

  for _ in 0..20 {
    // f *= 16
    f *= 16.0;

    // digit = int(floor(f + 1e-12))
    let digit = (f + 1e-12).floor() as i32;

    // frac_digits.append(format(digit, "x"))
    frac_digits.push(format!("{digit:x}"));

    // f -= digit
    f -= digit as f64;
    if f.abs() < 1e-12 {
      break;
    }
  }

  // frac_str = "".join(frac_digits).rstrip("0")
  let frac_str = frac_digits.join("");
  let frac_str = frac_str.trim_end_matches('0');

  debug!("[to_hex] frac_str = {}", frac_str);

  if frac_str.is_empty() {
    // return sign + format(intpart, "x")
    let ret = format!("{sign}{intpart:x}");
    debug!("[to_hex] return = {}", ret);
    return Ok(ret);
  }

  // return sign + format(intpart, "x") + "." + frac_str
  let ret = format!("{sign}{intpart:x}.{frac_str}");
  debug!("[to_hex] return = {}", ret);

  Ok(ret)
}

#[cfg(test)]
mod tests {
  use errors::AnyhowResult;
  use crate::requests::index_page::signature::signature_to_hex::signature_to_hex;

  #[test]
  fn integers() -> AnyhowResult<()> {
    assert_eq!(&signature_to_hex(67.0)?, "43"); // Test case from Python
    assert_eq!(&signature_to_hex(32.0)?, "20"); // Test case from Python
    assert_eq!(&signature_to_hex(227.0)?, "e3"); // Test case from Python
    assert_eq!(&signature_to_hex(0.0)?, "0"); // Test case from Python
    Ok(())
  }

  #[test]
  fn fractions() -> AnyhowResult<()> {
    assert_eq!(&signature_to_hex(0.986679)?, "0.fd70a3d70a3d7"); // Test case from Python
    assert_eq!(&signature_to_hex(-0.1626771)?, "-0.28f5c28f5c28f6"); // Test case from Python
    assert_eq!(&signature_to_hex(0.1626771)?, "0.28f5c28f5c28f6"); // Test case from Python
    Ok(())
  }
}
