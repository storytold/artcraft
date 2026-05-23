use crate::datatypes::api::xsid_numbers::XsidNumbers;
use log::error;
use once_cell::sync::Lazy;
use regex::Regex;
use std::str::FromStr;

static NUMBERS_REGEX : Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#"x\[(\d+)\]\s*,\s*16"#)
      .expect("Regex should parse")
});

pub fn parse_xsid_script_numbers(script_body: &str) -> XsidNumbers {
  let numbers = NUMBERS_REGEX.captures_iter(&script_body)
      .flat_map(|captures| captures.get(1).map(|m| m.as_str().to_string()))
      .flat_map(|num| match u32::from_str(&num) {
        Ok(num) => Some(num),
        Err(err) => {
          error!("Error parsing: {:?}", err);
          None
        }
      })
      .collect::<_>();
  
  XsidNumbers {
    numbers,
  }
}
