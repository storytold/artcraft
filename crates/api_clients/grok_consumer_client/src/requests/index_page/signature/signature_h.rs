use log::debug;
use crate::error::grok_client_error::GrokClientError;
use crate::requests::index_page::signature::round_two_decimals::round_two_decimals;
/*
    @staticmethod
    def _h(x: float, _param: float, c: float, e: bool):
        f = ((x * (c - _param)) / 255.0) + _param
        if e:
            return floor(f)
        rounded = round(float(f), 2)
        if rounded == 0.0:
            return 0.0
        return rounded
 */


/// Based on "Grok-Api/core/xctid.py"
/// Some kind of stroke angle calculator or trig function
/// `x` - could be values in the svg path
/// `param` - misc values: flags (-1, 1) and constants (60)
/// `c` - misc values: (1, 360)
/// `e` - some kind of flag
pub fn signature_h(x: f64, param: f64, c: f64, e: bool) -> Result<f64, GrokClientError> {
  // f = ((x * (c - _param)) / 255.0) + _param
  let f = ((x * (c - param)) / 255.0) + param;

  debug!("[signature_h] f = {}", f);

  if e {
    let floor = f.floor();
    debug!("[signature_h] floor = {}", floor);
    return Ok(floor)
  }

  // rounded = round(float(f), 2)
  let rounded = round_two_decimals(f);

  debug!("[signature_h] rounded = {}", rounded);

  if rounded == 0.0 {
    debug!("[signature_h] rounded is zero");
    return Ok(0.0) // TODO: This might not work
  }

  Ok(rounded) // TODO: Looks like it can return ints or floats
}


#[cfg(test)]
mod tests {
  use crate::requests::index_page::signature::signature_h::signature_h;

  // TODO: This needs more tests for other parameter setups
  #[test]
  fn test_end_angle() {
    // "h" gets used lots of times, but the "end angle" calculation case is the most straightforward to use as a test case
    // values = [73, 44, 215, 158, 218, 29, 68, 13, 98, 243, 134]
    // endAngle = Signature._h(values[6], 60, 360, True)

    // NB: Note that the function type annotations call for floats, but that the "end_angle" case passes integers.
    let x = 68f64; // [73, 44, 215, 158, 218, 29, 68, 13, 98, 243, 134] @ index 6
    let param = 60f64;
    let c = 360f64;
    let e = true;

    let observed = signature_h(x, param, c, e).unwrap();

    let expected = 140.0; // NB: Python returns in `int` for this (I checked the type), but it can also return floats. Ugh.

    assert_eq!(expected, observed);
  }

  #[test]
  fn svg_test_1() {
    // Actual test case, called in loop:
    //    cp = [Signature._h(v, -1 if (i % 2) else 0, 1, False) for i, v in enumerate(values[7:])]
    // Python Inputs:
    //
    // _h.x 13 <class 'int'>
    // _h._param 0 <class 'int'>
    // _h.c 1 <class 'int'>
    // _h.e False <class 'bool'>
    //
    // Python Outputs:
    //
    // _h.f 0.050980392156862744 <class 'float'>
    // _h.rounded 0.05 <class 'float'>

    let x = 13.0; // NB: This was an int in python
    let param = 0.0; // NB: This was an int in python
    let c = 1.0; // NB: This was an int in python
    let e = false;

    let observed = signature_h(x, param, c, e).unwrap();

    let expected = 0.05;

    assert_eq!(expected, observed);
  }

  #[test]
  fn svg_test_2() {
    // Actual test case, called in loop:
    //    cp = [Signature._h(v, -1 if (i % 2) else 0, 1, False) for i, v in enumerate(values[7:])]
    // Python Inputs:
    //
    // _h.x 98 <class 'int'>
    // _h._param -1 <class 'int'>
    // _h.c 1 <class 'int'>
    // _h.e False <class 'bool'>
    //
    // Python Outputs:
    //
    // _h.f -0.2313725490196078 <class 'float'>
    // _h.rounded -0.23 <class 'float'>

    let x = 98.0; // NB: This was an int in python
    let param = -1.0; // NB: This was an int in python
    let c = 1.0; // NB: This was an int in python
    let e = false;

    let observed = signature_h(x, param, c, e).unwrap();

    let expected = -0.23;

    assert_eq!(expected, observed);
  }

  #[test]
  fn svg_test_3() {
    // Actual test case, called in loop:
    //    cp = [Signature._h(v, -1 if (i % 2) else 0, 1, False) for i, v in enumerate(values[7:])]
    // Python Inputs:
    //
    // _h.x 243 <class 'int'>
    // _h._param 0 <class 'int'>
    // _h.c 1 <class 'int'>
    // _h.e False <class 'bool'>
    //
    // Python Outputs:
    //
    // _h.f 0.9529411764705882 <class 'float'>
    // _h.rounded 0.95 <class 'float'>

    let x = 243.0; // NB: This was an int in python
    let param = 0.0; // NB: This was an int in python
    let c = 1.0; // NB: This was an int in python
    let e = false;

    let observed = signature_h(x, param, c, e).unwrap();

    let expected = 0.95;

    assert_eq!(expected, observed);
  }
}
