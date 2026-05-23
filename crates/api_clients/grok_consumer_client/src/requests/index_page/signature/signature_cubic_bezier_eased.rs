

pub fn signature_cubic_bezier_eased(t: f64, x1: f64, y1: f64, x2: f64, y2: f64) -> f64 {
  /*
      @staticmethod
      def cubicBezierEased(t: float, x1: float, y1: float, x2: float, y2: float) -> float:
          def bezier(u: float):
              omu = 1.0 - u
              b1 = 3.0 * omu * omu * u
              b2 = 3.0 * omu * u * u
              b3 = u * u * u
              x = b1 * x1 + b2 * x2 + b3
              y = b1 * y1 + b2 * y2 + b3
              return x, y

          lo, hi = 0.0, 1.0
          for _ in range(80):
              mid = 0.5 * (lo + hi)
              if bezier(mid)[0] < t:
                  lo = mid
              else:
                  hi = mid
          u = 0.5 * (lo + hi)
          return bezier(u)[1]
   */

  let mut lo = 0.0;
  let mut hi = 1.0;

  for _ in 0..80 {
    let mid = 0.5 * (lo + hi);
    if bezier(mid, x1, y1, x2, y2).0 < t {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  let u = 0.5 * (lo + hi);

  bezier(u, x1, y1, x2, y2).1
}


fn bezier(u: f64, x1: f64, y1: f64, x2: f64, y2: f64) -> (f64, f64) {
  /*
        def bezier(u: float):
            omu = 1.0 - u
            b1 = 3.0 * omu * omu * u
            b2 = 3.0 * omu * u * u
            b3 = u * u * u
            x = b1 * x1 + b2 * x2 + b3
            y = b1 * y1 + b2 * y2 + b3
            return x, y
   */

  let omu = 1.0 - u;
  let b1 = 3.0 * omu * omu * u;
  let b2 = 3.0 * omu * u * u;
  let b3 = u * u * u;

  let x = b1 * x1 + b2 * x2 + b3;
  let y = b1 * y1 + b2 * y2 + b3;

  (x, y)
}

#[cfg(test)]
mod tests {

  mod test_signature_cubic_bezier_eased {
    use crate::requests::index_page::signature::signature_cubic_bezier_eased::signature_cubic_bezier_eased;

    #[test]
    fn test() {
      // Input:
      //
      // t 0.2197265625
      // cp [0.05, -0.23, 0.95, 0.05]
      // cp[0] 0.05
      // cp[1] -0.23
      // cp[2] 0.95
      // cp[3] 0.05
      //
      // Output:
      //
      // easedY -0.06687371608353283

      let t = 0.2197265625;
      let cp0 = 0.05;
      let cp1 = -0.23;
      let cp2 = 0.95;
      let cp3 = 0.05;

      let output = signature_cubic_bezier_eased(t, cp0, cp1, cp2, cp3);

      let expected = -0.06687371608353283;

      assert_eq!(output, expected);
    }
  }

  mod test_bezier {
    use crate::requests::index_page::signature::signature_cubic_bezier_eased::{bezier, signature_cubic_bezier_eased};

    #[test]
    fn test_0() {
      // bezier.u 0.5 <class 'float'>
      // bezier.x1 0.05 <class 'float'>
      // bezier.y1 -0.23 <class 'float'>
      // bezier.x2 0.95 <class 'float'>
      // bezier.y2 0.05 <class 'float'>
      // bezier.x 0.49999999999999994 <class 'float'>
      // bezier.y 0.057499999999999996 <class 'float'>
      let u = 0.5;
      let x1 = 0.05;
      let y1 = -0.23;
      let x2 = 0.95;
      let y2 = 0.05;

      let expected_x = 0.49999999999999994;
      let expected_y = 0.057499999999999996;

      let output = bezier(u, x1, y1, x2, y2);

      assert_eq!(output.0, expected_x);
      assert_eq!(output.1, expected_y);
    }

    #[test]
    fn test_1() {
      // NB: Test values that were run through Python
      let u = 0.29268743212748927; // bezier.u 0.29268743212748927 <class 'float'>
      let x1 = 0.05; // bezier.x1 0.05 <class 'float'>
      let y1 = -0.23; // bezier.y1 -0.23 <class 'float'>
      let x2 = 0.95; // bezier.x2 0.95 <class 'float'>
      let y2 = 0.05; // bezier.y2 0.05 <class 'float'>

      let expected_x = 0.2197265625; // bezier.x 0.2197265625 <class 'float'>
      let expected_y = -0.06687371608353283; // bezier.y -0.06687371608353283 <class 'float'>

      let output = bezier(u, x1, y1, x2, y2);

      assert_eq!(output.0, expected_x);
      assert_eq!(output.1, expected_y);
    }
  }
}
