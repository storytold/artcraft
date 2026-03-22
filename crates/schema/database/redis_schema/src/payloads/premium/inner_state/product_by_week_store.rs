use std::collections::HashMap;
use enums_db::no_table::premium_product::premium_product_name::PremiumProductName;
use crate::payloads::premium::inner_state::product_by_week_subkey::ProductByWeekSubkey;

#[derive(Clone)]
pub struct ProductByWeekStore {
  /// Key: "{product_id}:{iso_week_zero_index}"
  /// Value: count of uses
  pub free_uses_per_product_map: HashMap<ProductByWeekSubkey, u64>,
}

impl ProductByWeekStore {
  pub fn new() -> Self {
    Self {
      free_uses_per_product_map: HashMap::new(),
    }
  }

  pub fn set_use_count(&mut self, key: ProductByWeekSubkey, count: u64) {
    self.free_uses_per_product_map.insert(key, count);
  }

  pub fn increment_use(&mut self, name: PremiumProductName, week: u32) {
    let key = ProductByWeekSubkey::new(name, week);
    let count = self.free_uses_per_product_map.entry(key).or_insert(0);
    *count += 1;
  }

  pub fn get_use_count(&self, name: PremiumProductName, week: u32) -> u64 {
    let key = ProductByWeekSubkey::new(name, week);
    *self.free_uses_per_product_map.get(&key).unwrap_or(&0)
  }

  pub fn maximum(&self, other: &Self) -> Self {
    let mut free_uses_per_product_map = HashMap::new();
    for (key, value) in self.free_uses_per_product_map.iter() {
      free_uses_per_product_map.insert(key.clone(), *value);
    }
    for (key, value) in other.free_uses_per_product_map.iter() {
      let count = free_uses_per_product_map.entry(key.clone()).or_insert(0);
      *count = (*count).max(*value);
    }
    Self {
      free_uses_per_product_map,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_increment_use() {
    let mut store = ProductByWeekStore::new();

    store.increment_use(PremiumProductName::FaceAnimator, 10);
    store.increment_use(PremiumProductName::FaceAnimator, 10);
    store.increment_use(PremiumProductName::FaceAnimator, 10);
    store.increment_use(PremiumProductName::FaceMirror, 10);
    store.increment_use(PremiumProductName::Lipsync, 11);

    // Week 10
    assert_eq!(store.get_use_count(PremiumProductName::FaceAnimator, 10), 3);
    assert_eq!(store.get_use_count(PremiumProductName::FaceMirror, 10), 1);
    assert_eq!(store.get_use_count(PremiumProductName::Lipsync, 10), 0);
    assert_eq!(store.get_use_count(PremiumProductName::VideoStyleTransfer, 10), 0);

    // Week 11
    assert_eq!(store.get_use_count(PremiumProductName::FaceAnimator, 11), 0);
    assert_eq!(store.get_use_count(PremiumProductName::FaceMirror, 11), 0);
    assert_eq!(store.get_use_count(PremiumProductName::Lipsync, 11), 1);
    assert_eq!(store.get_use_count(PremiumProductName::VideoStyleTransfer, 11), 0);
  }

  #[test]
  fn test_maximum() {
    let mut store1 = ProductByWeekStore::new();
    store1.set_use_count(ProductByWeekSubkey::new(PremiumProductName::FaceAnimator, 1), 2);
    store1.set_use_count(ProductByWeekSubkey::new(PremiumProductName::FaceMirror, 1), 10);
    store1.set_use_count(ProductByWeekSubkey::new(PremiumProductName::VideoStyleTransfer, 1), 1);
    store1.set_use_count(ProductByWeekSubkey::new(PremiumProductName::VideoStyleTransfer, 3), 30); // Week 3

    let mut store2 = ProductByWeekStore::new();
    store2.set_use_count(ProductByWeekSubkey::new(PremiumProductName::FaceAnimator, 1), 3);
    store2.set_use_count(ProductByWeekSubkey::new(PremiumProductName::FaceMirror, 1), 5);
    store2.set_use_count(ProductByWeekSubkey::new(PremiumProductName::Lipsync, 1), 1);
    store2.set_use_count(ProductByWeekSubkey::new(PremiumProductName::Lipsync, 2), 20); // Week 2

    let store = store1.maximum(&store2);

    // Week 1
    assert_eq!(store.get_use_count(PremiumProductName::FaceAnimator, 1), 3);
    assert_eq!(store.get_use_count(PremiumProductName::FaceMirror, 1), 10);
    assert_eq!(store.get_use_count(PremiumProductName::Lipsync, 1), 1);
    assert_eq!(store.get_use_count(PremiumProductName::VideoStyleTransfer, 1), 1);

    // Week 2
    assert_eq!(store.get_use_count(PremiumProductName::FaceAnimator, 2), 0);
    assert_eq!(store.get_use_count(PremiumProductName::FaceMirror, 2), 0);
    assert_eq!(store.get_use_count(PremiumProductName::Lipsync, 2), 20);
    assert_eq!(store.get_use_count(PremiumProductName::VideoStyleTransfer, 2), 0);

    // Week 3
    assert_eq!(store.get_use_count(PremiumProductName::FaceAnimator, 3), 0);
    assert_eq!(store.get_use_count(PremiumProductName::FaceMirror, 3), 0);
    assert_eq!(store.get_use_count(PremiumProductName::Lipsync, 3), 0);
    assert_eq!(store.get_use_count(PremiumProductName::VideoStyleTransfer, 3), 30);

    // Week not recorded in either store
    assert_eq!(store.get_use_count(PremiumProductName::FaceAnimator, 50), 0);
    assert_eq!(store.get_use_count(PremiumProductName::FaceMirror, 50), 0);
    assert_eq!(store.get_use_count(PremiumProductName::Lipsync, 50), 0);
    assert_eq!(store.get_use_count(PremiumProductName::VideoStyleTransfer, 50), 0);
  }
}