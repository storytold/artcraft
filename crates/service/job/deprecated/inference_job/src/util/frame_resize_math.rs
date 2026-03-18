use std::cmp::max;

pub struct Dimensions {
  pub width: u32,
  pub height: u32,
}
pub struct ResizeArgs {
  pub source: Dimensions,
  pub target: Dimensions,
  pub resize_method: ResizeMethod,
}

pub enum ResizeMethod {
  /// The frame or image must fit within maximum bounds.
  KeepUnder,
  /// The dimensions must be greater than the minimum bounds.
  MustFill,
}

pub struct ResizeResult {
  pub new_width: u32,
  pub new_height: u32,
}

pub fn aspect_preserving_frame_resize(args: ResizeArgs) -> ResizeResult {
  let width_ratio = args.target.width as f64 / args.source.width as f64;
  let height_ratio = args.target.height as f64 / args.source.height as f64;

  let resize_ratio= match args.resize_method {
    ResizeMethod::KeepUnder => f64::min(width_ratio, height_ratio),
    ResizeMethod::MustFill => f64::max(width_ratio, height_ratio),
  };

  let mut new_width = max((args.source.width as f64 * resize_ratio).round() as u64, 1);
  let mut new_height = max((args.source.height as f64 * resize_ratio).round() as u64, 1);

  // TODO(bt): u32 overflow.

  ResizeResult {
    new_width: new_width as u32,
    new_height: new_height as u32,
  }
}

#[cfg(test)]
mod tests {
  use crate::util::frame_resize_math::{aspect_preserving_frame_resize, ResizeMethod, ResizeArgs, Dimensions};

  #[test]
  fn no_resize() {
    for resize_method in [ResizeMethod::MustFill, ResizeMethod::KeepUnder] {
      let result = aspect_preserving_frame_resize(ResizeArgs {
        source: Dimensions {
          width: 100,
          height: 100,
        },
        target: Dimensions {
          width: 100,
          height: 100,
        },
        resize_method,
      });
      assert_eq!(result.new_width, 100);
      assert_eq!(result.new_height, 100);
    }
  }

  mod keep_under {
    use super::*;

    #[test]
    fn above_constraints_width() {
      let result = aspect_preserving_frame_resize(ResizeArgs {
        source: Dimensions {
          width: 1000,
          height: 1000,
        },
        target: Dimensions {
          width: 768,
          height: 512,
        },
        resize_method: ResizeMethod::KeepUnder,
      });
      assert_eq!(result.new_width, 512);
      assert_eq!(result.new_height, 512);
    }
  }
}
