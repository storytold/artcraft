use primitives::numerics::remap_range_f64::{remap_range_f64, Args};

/// Our LCM implementation uses strength [13, 100]. Strength below 13 will take 8 steps, 
/// so we need to limit ourselves to this range from an input range of [0, 100].
pub fn remap_lcm_strength_range(value: f64) -> f64 {
  remap_range_f64(Args {
    old_min: 0.0,
    old_max: 100.0,
    new_min: 13.0,
    new_max: 100.0,
    value,
  })
}

#[cfg(test)]
mod test {
  use crate::ml::stable_diffusion::remap_lcm_strength_range::remap_lcm_strength_range;
  use assertor::{assert_that, FloatAssertion};

  #[test]
  fn old_max() {
    assert_eq!(remap_lcm_strength_range(100.0), 100.0);
  }
  
  #[test]
  fn old_min() {
    assert_eq!(remap_lcm_strength_range(0.0), 13.0);
  }

  #[test]
  fn under_bounds() {
    assert_eq!(remap_lcm_strength_range(-100.0), 13.0);
  }
  
  #[test]
  fn over_bounds() {
    assert_eq!(remap_lcm_strength_range(200.0), 100.0);
  }

  #[test]
  fn other_values() {
    assert_that!(remap_lcm_strength_range(0.0)).with_abs_tol(0.001).is_approx_equal_to(13.000);
    assert_that!(remap_lcm_strength_range(5.0)).with_abs_tol(0.001).is_approx_equal_to(17.350);
    assert_that!(remap_lcm_strength_range(11.0)).with_abs_tol(0.001).is_approx_equal_to(22.570);
    assert_that!(remap_lcm_strength_range(13.0)).with_abs_tol(0.001).is_approx_equal_to(24.310);
    assert_that!(remap_lcm_strength_range(14.0)).with_abs_tol(0.001).is_approx_equal_to(25.180);
    assert_that!(remap_lcm_strength_range(20.0)).with_abs_tol(0.001).is_approx_equal_to(30.400);
    assert_that!(remap_lcm_strength_range(25.0)).with_abs_tol(0.001).is_approx_equal_to(34.750);
    assert_that!(remap_lcm_strength_range(50.0)).with_abs_tol(0.001).is_approx_equal_to(56.500);
    assert_that!(remap_lcm_strength_range(75.0)).with_abs_tol(0.001).is_approx_equal_to(78.250);
    assert_that!(remap_lcm_strength_range(99.0)).with_abs_tol(0.001).is_approx_equal_to(99.130);
    assert_that!(remap_lcm_strength_range(100.0)).with_abs_tol(0.001).is_approx_equal_to(100.000);
  }
}
