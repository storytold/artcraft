use std::collections::HashMap;

use errors::AnyhowResult;

use crate::payloads::premium::inner_state::product_by_week_store::ProductByWeekStore;
use crate::payloads::premium::inner_state::product_by_week_subkey::ProductByWeekSubkey;
use crate::traits::hkey_store_adapter::HkeyStoreAdapter;

const PREMIUM_CREDITS_SUBKEY: &str = "credits";

/// We use this to directly serialize and deserialize the state of a user's premium account from Redis.
/// This is the direct translation layer between a Redis hash (HKEY) and the state we require.
/// The state is kept on a per-month basis and keeps track of both premium credits used and free usages
/// for non-premium users on a per-week basis.
#[derive(Clone)]
pub struct PremiumPayload {
  premium_credits_used: u64,
  free_uses: ProductByWeekStore,
}

impl PremiumPayload {

  pub fn new() -> Self {
    Self {
      premium_credits_used: 0,
      free_uses: ProductByWeekStore::new(),
    }
  }

  pub fn maximum(&self, other: &Self) -> Self {
    let premium_credits_used = self.premium_credits_used.max(other.premium_credits_used);
    let free_uses = self.free_uses.maximum(&other.free_uses);
    Self {
      premium_credits_used,
      free_uses
    }
  }

  pub (crate) fn from_redis_hkey_map(map: &HashMap<String, String>) -> AnyhowResult<Self> {
    let mut credits = 0;
    let mut free_uses = ProductByWeekStore::new();

    for (key, value) in map.iter() {
      if key == PREMIUM_CREDITS_SUBKEY {
        credits = value.parse()?;
      }

      if let Ok(subkey) = ProductByWeekSubkey::from_string(key.as_str()) {
        free_uses.set_use_count(subkey, value.parse()?);
      }
    }

    Ok(Self {
      premium_credits_used: credits,
      free_uses
    })
  }

  pub (crate) fn to_redis_hkey_map(&self) -> HashMap<String, String> {
    let mut map = HashMap::new();
    map.insert(PREMIUM_CREDITS_SUBKEY.to_string(), self.premium_credits_used.to_string());
    for (key, value) in self.free_uses.free_uses_per_product_map.iter() {
      map.insert(key.to_string(), value.to_string());
    }
    map
  }

  pub (crate) fn to_redis_hkey_vec(&self) -> Vec<(String, String)> {
    let map = self.to_redis_hkey_map();
    map.iter().map(|(k, v)| (k.clone(), v.clone())).collect()
  }
}

impl HkeyStoreAdapter for PremiumPayload {
  fn serialize_payload(&self) -> AnyhowResult<Vec<(String, String)>> {
    Ok(self.to_redis_hkey_vec())
  }

  fn hydrate_from_vec(values: HashMap<String, String>) -> AnyhowResult<Self> {
    Self::from_redis_hkey_map(&values)
  }
}

#[cfg(test)]
mod tests {
  use enums_api::no_table::premium_product::premium_product_name::PremiumProductName;

  use super::*;

  #[test]
  fn test_from_redis_hkey_map() {
    let mut map = HashMap::new();
    map.insert("credits".to_string(), "10".to_string());
    map.insert("fa:1".to_string(), "5".to_string());
    map.insert("fm:1".to_string(), "3".to_string());
    map.insert("lip:1".to_string(), "2".to_string());
    map.insert("vst:1".to_string(), "1".to_string());
    map.insert("vst:2".to_string(), "1".to_string());

    let payload = PremiumPayload::from_redis_hkey_map(&map).unwrap();
    assert_eq!(payload.premium_credits_used, 10);
    assert_eq!(payload.free_uses.get_use_count(PremiumProductName::FaceAnimator, 1), 5);
    assert_eq!(payload.free_uses.get_use_count(PremiumProductName::FaceMirror, 1), 3);
    assert_eq!(payload.free_uses.get_use_count(PremiumProductName::Lipsync, 1), 2);
    assert_eq!(payload.free_uses.get_use_count(PremiumProductName::VideoStyleTransfer, 1), 1);
    assert_eq!(payload.free_uses.get_use_count(PremiumProductName::VideoStyleTransfer, 2), 1);
  }

  #[test]
  fn test_to_redis_hkey_map() {
    let mut free_uses = ProductByWeekStore::new();
    free_uses.set_use_count(ProductByWeekSubkey::new(PremiumProductName::FaceAnimator, 1), 5);
    free_uses.set_use_count(ProductByWeekSubkey::new(PremiumProductName::FaceMirror, 1), 3);
    free_uses.set_use_count(ProductByWeekSubkey::new(PremiumProductName::Lipsync, 1), 2);
    free_uses.set_use_count(ProductByWeekSubkey::new(PremiumProductName::VideoStyleTransfer, 1), 1);
    free_uses.set_use_count(ProductByWeekSubkey::new(PremiumProductName::VideoStyleTransfer, 2), 1);

    let payload = PremiumPayload {
      premium_credits_used: 10,
      free_uses
    };

    let map = payload.to_redis_hkey_map();
    assert_eq!(map.get("credits").unwrap(), "10");
    assert_eq!(map.get("fa:1").unwrap(), "5");
    assert_eq!(map.get("fm:1").unwrap(), "3");
    assert_eq!(map.get("lip:1").unwrap(), "2");
    assert_eq!(map.get("vst:1").unwrap(), "1");
    assert_eq!(map.get("vst:2").unwrap(), "1");
  }
}