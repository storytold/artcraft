use uuid::Uuid;

/// Generate a 36 character hyphenated UUID (v4) that can be used as an idempotency token.
pub fn generate_random_uuid() -> String {
  let uuid = Uuid::new_v4();
  let mut buffer = Uuid::encode_buffer();
  let hyphenated_uuid = uuid.hyphenated()
      .encode_lower(&mut buffer);
  hyphenated_uuid.to_string()
}

#[cfg(test)]
mod tests {
  use crate::uuid::generate_random_uuid;

  mod generate_random_uuid {
    use std::collections::HashSet;

    use super::*;

    #[test]
    fn length() {
      for _ in 0..10 {
        assert_eq!(generate_random_uuid().len(), 36);
      }
    }

    #[test]
    fn hyphenated() {
      for _ in 0..10 {
        assert_eq!(generate_random_uuid().contains("-"), true);
      }
    }

    #[test]
    fn no_collision() {
      let mut set = HashSet::new();
      for _ in 0..1000 {
        set.insert(generate_random_uuid());
      }
      assert_eq!(set.len(), 1000);
    }
  }
}