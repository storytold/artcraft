
/// Tacotron operates on decoder steps. 1000 steps is the default and correlates to
/// roughly 12 seconds max. Here we map seconds to decoder steps.
///
/// Seconds are interpreted as thus:
///
///   0 -> default, typically 12 seconds (1000 decoder steps)
///   n -> number of seconds
///  -1 -> "unlimited"
///
/// Since 1000 decoder steps corresponds to roughly 12 seconds, the mappings
/// have been approximated below.
pub fn seconds_to_decoder_steps(max_duration_seconds: i32) -> u32 {
  match max_duration_seconds {
    0 | 1..=12 => 1000,
    20..=30 => 3000,
    31..=60 => 6000,
    61..=120 => 12000,
    121..=600 => 25000,
    -1 => 12000,
    _ => 1000,
  }
}

#[cfg(test)]
mod tests {
  use crate::job_steps::seconds_to_decoder_steps::seconds_to_decoder_steps;

  #[test]
  fn test_max_decoder_steps_zero() {
    assert_eq!(1000, seconds_to_decoder_steps(0));
  }

  #[test]
  fn test_default_twelve_seconds() {
    assert_eq!(1000, seconds_to_decoder_steps(1));
    assert_eq!(1000, seconds_to_decoder_steps(12));
  }

  #[test]
  fn test_thirty_seconds() {
    assert_eq!(3000, seconds_to_decoder_steps(30));
  }

  #[test]
  fn test_sixty_seconds() {
    assert_eq!(6000, seconds_to_decoder_steps(60));
  }

  #[test]
  fn test_two_minutes() {
    assert_eq!(12000, seconds_to_decoder_steps(120));
  }

  #[test]
  fn test_five_minutes() {
    assert_eq!(25000, seconds_to_decoder_steps(60 * 5));
  }

  #[test]
  fn test_unlimited() {
    assert_eq!(12000, seconds_to_decoder_steps(-1));
  }

  #[test]
  fn test_unexpected() {
    assert_eq!(1000, seconds_to_decoder_steps(-1000));
    assert_eq!(1000, seconds_to_decoder_steps(1000000));
  }
}