
pub struct Args {
  pub old_min: f64,
  pub old_max: f64,
  pub new_min: f64,
  pub new_max: f64,
  
  /// The value to remap to the new range.
  pub value: f64,
}

pub fn remap_range_f64(args: Args) -> f64 {
  let old_range = args.old_max - args.old_min;
  let new_range = args.new_max -  args.new_min;

  let new_value = (args.value -  args.old_min) * new_range / old_range + args.new_min;
  
  if new_value > args.new_max {
    args.new_max
  } else if new_value < args.new_min { 
    args.new_min
  } else {
    new_value
  }
}

#[cfg(test)]
mod tests {
  use crate::numerics::remap_range_f64::{remap_range_f64, Args};
  use assertor::{assert_that, FloatAssertion};

  #[test]
  fn test_base_cases() {
    assert_that!(remap_range_f64(Args {
      old_min: 0.0,
      old_max: 1.0,
      new_min: 0.0,
      new_max: 1.0,
      value: 0.0,
    })).with_abs_tol(0.01).is_approx_equal_to(0.0);
    
    assert_that!(remap_range_f64(Args {
      old_min: 0.0,
      old_max: 1.0,
      new_min: 0.0,
      new_max: 1.0,
      value: 1.0,
    })).with_abs_tol(0.01).is_approx_equal_to(1.0);
  }

  #[test]
  fn test_maxima() {
    assert_that!(remap_range_f64(Args {
      old_min: 0.0,
      old_max: 100.0,
      new_min: 0.0,
      new_max: 1.0,
      value: 100.0,
    })).with_abs_tol(0.01).is_approx_equal_to(1.0);

    assert_that!(remap_range_f64(Args {
      old_min: 0.0,
      old_max: 1.0,
      new_min: 0.0,
      new_max: 50.0,
      value: 1.0,
    })).with_abs_tol(0.01).is_approx_equal_to(50.0);

    assert_that!(remap_range_f64(Args {
      old_min: 0.0,
      old_max: 1.0,
      new_min: -100.0,
      new_max: 100.0,
      value: 1.0,
    })).with_abs_tol(0.01).is_approx_equal_to(100.0);
  }

  #[test]
  fn test_minima() {
    assert_that!(remap_range_f64(Args {
      old_min: 0.0,
      old_max: 100.0,
      new_min: 0.0,
      new_max: 1.0,
      value: 0.0,
    })).with_abs_tol(0.01).is_approx_equal_to(0.0);

    assert_that!(remap_range_f64(Args {
      old_min: 0.0,
      old_max: 1.0,
      new_min: 0.0,
      new_max: 50.0,
      value: 0.0,
    })).with_abs_tol(0.01).is_approx_equal_to(0.0);

    assert_that!(remap_range_f64(Args {
      old_min: 0.0,
      old_max: 1.0,
      new_min: -100.0,
      new_max: 100.0,
      value: 0.0,
    })).with_abs_tol(0.01).is_approx_equal_to(-100.0);
  }

  #[test]
  fn test_other_values() {
    assert_that!(remap_range_f64(Args {
      old_min: 0.0,
      old_max: 100.0,
      new_min: 0.0,
      new_max: 1.0,
      value: 50.0,
    })).with_abs_tol(0.01).is_approx_equal_to(0.50);

    assert_that!(remap_range_f64(Args {
      old_min: 0.0,
      old_max: 1.0,
      new_min: 0.0,
      new_max: 50.0,
      value: 0.10,
    })).with_abs_tol(0.01).is_approx_equal_to(5.0);

    assert_that!(remap_range_f64(Args {
      old_min: 0.0,
      old_max: 1.0,
      new_min: -100.0,
      new_max: 100.0,
      value: 0.25,
    })).with_abs_tol(0.01).is_approx_equal_to(-50.0);
  }
}
