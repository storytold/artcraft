use std::num::ParseIntError;
use chrono::{Datelike, Utc};
use enums_api::no_table::premium_product::premium_product_name::PremiumProductName;
use errors::{anyhow, AnyhowResult};

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ProductByWeekSubkey {
  pub product_name: PremiumProductName,
  pub week: u32,
}

impl ProductByWeekSubkey {
  pub fn new(product_name: PremiumProductName, week: u32) -> Self {
    Self { product_name, week }
  }

  pub fn new_this_week(product_name: PremiumProductName) -> Self {
    let time = Utc::now();
    let week = time.iso_week();
    let week = week.week0();
    Self { product_name, week }
  }

  pub fn from_string(key: &str) -> AnyhowResult<Self> {
    let mut parts = key.split(':');
    let product_name = parts.next()
        .ok_or_else(|| anyhow!("No product name"))?;
    let product_name = PremiumProductName::from_str(product_name)
        .map_err(|err| anyhow!(err))?;
    let week = parts.next()
        .ok_or_else(|| anyhow!("No week"))?
        .parse()
        .map_err(|err: ParseIntError| anyhow!(err))?;
    Ok(Self {
      product_name,
      week,
    })
  }

  pub fn to_string(&self) -> String {
    format!("{}:{}", self.product_name.to_str(), self.week)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_new_this_week() {
    let key = ProductByWeekSubkey::new_this_week(PremiumProductName::FaceAnimator);
    assert_eq!(key.product_name, PremiumProductName::FaceAnimator);
  }

  #[test]
  fn test_from_string() {
    let key = ProductByWeekSubkey::from_string("fa:1").unwrap();
    assert_eq!(key.product_name, PremiumProductName::FaceAnimator);
    assert_eq!(key.week, 1);
  }

  #[test]
  fn test_to_string() {
    let key = ProductByWeekSubkey::new(PremiumProductName::FaceMirror, 2);
    assert_eq!(key.to_string(), "fm:2");
  }
}
