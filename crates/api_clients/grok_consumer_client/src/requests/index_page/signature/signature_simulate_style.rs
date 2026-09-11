use crate::error::grok_client_error::GrokClientError;
use crate::requests::index_page::signature::signature_cubic_bezier_eased::signature_cubic_bezier_eased;
use crate::requests::index_page::signature::signature_h::signature_h;
use log::{debug, error};
use once_cell::sync::Lazy;
use regex::Regex;
use std::fmt::format;

static CLEAN_NON_DIGIT_REGEX : Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#"[^\d]+"#)
      .expect("Regex should parse")
});

/*
    @staticmethod
    def simulateStyle(values: List[int], c: int) -> Dict[str,str]:
        duration = 4096
        currentTime = round(c / 10.0) * 10
        t = currentTime / duration

        cp = [Signature._h(v, -1 if (i % 2) else 0, 1, False) for i, v in enumerate(values[7:])]

        easedY = Signature.cubicBezierEased(t, cp[0], cp[1], cp[2], cp[3])

        start = [float(x) for x in values[0:3]]
        end = [float(x) for x in values[3:6]]
        r = round(start[0] + (end[0] - start[0]) * easedY)
        g = round(start[1] + (end[1] - start[1]) * easedY)
        b = round(start[2] + (end[2] - start[2]) * easedY)
        color = f"rgb({r}, {g}, {b})"

        endAngle = Signature._h(values[6], 60, 360, True)
        angle = endAngle * easedY
        rad = angle * pi / 180.0

        def is_effectively_zero(val: float) -> bool:
            return abs(val) < 1e-7

        def is_effectively_integer(val: float) -> bool:
            return abs(val - round(val)) < 1e-7

        cosv = cos(rad)
        sinv = sin(rad)

        if is_effectively_zero(cosv):
            a = 0
            d = 0
        else:
            if is_effectively_integer(cosv):
                a = int(round(cosv))
                d = int(round(cosv))
            else:
                a = f"{cosv:.6f}"
                d = f"{cosv:.6f}"

        if is_effectively_zero(sinv):
            bval = 0
            cval = 0
        else:
            if is_effectively_integer(sinv):
                bval = int(round(sinv))
                cval = int(round(-sinv))
            else:
                bval = f"{sinv:.7f}"
                cval = f"{(-sinv):.7f}"

        transform = f"matrix({a}, {bval}, {cval}, {d}, 0, 0)"
        return {"color": color, "transform": transform}
 */

pub struct SimulatedStyle {
  pub color: String,
  pub transform: String,
}

/// Based on "Grok-Api/core/xctid.py"
/// `values` is one svg path stroke calculated by the `xa` algo
/// `c` is the multiplied value from `xs`
///
pub fn signature_simulate_style(values: &[u32], c: u32) -> Result<SimulatedStyle, GrokClientError> {
  // duration = 4096
  let duration = 4096;

  // currentTime = round(c / 10.0) * 10
  let current_time = ((c as f32 / 10.0).round()) as u32 * 10;

  debug!("[simulate_style] current_time = {:?}", current_time);

  // t = currentTime / duration
  let t = current_time as f64 / duration as f64;

  debug!("[simulate_style] t = {:?}", t);

  // cp = [Signature._h(v, -1 if (i % 2) else 0, 1, False) for i, v in enumerate(values[7:])]
  let subvalues = &values[7..];
  let mut cp = Vec::with_capacity(subvalues.len());
  for (i, v) in subvalues.iter().enumerate() {
    let param = if i % 2 != 0 { - 1.0 } else { 0.0 };
    let val = signature_h(*v as f64, param, 1.0, false)?;
    cp.push(val);
  }

  debug!("[simulate_style] cp = {:?}", cp);

  // easedY = Signature.cubicBezierEased(t, cp[0], cp[1], cp[2], cp[3])
  let cp_0 = cp.get(0).map(|x| *x).ok_or_else(|| GrokClientError::BadSignatureInputs)?;
  let cp_1 = cp.get(1).map(|x| *x).ok_or_else(|| GrokClientError::BadSignatureInputs)?;
  let cp_2 = cp.get(2).map(|x| *x).ok_or_else(|| GrokClientError::BadSignatureInputs)?;
  let cp_3 = cp.get(3).map(|x| *x).ok_or_else(|| GrokClientError::BadSignatureInputs)?;
  let eased_y = signature_cubic_bezier_eased(t, cp_0, cp_1, cp_2, cp_3);

  debug!("[simulate_style] eased_y = {:?}", eased_y);

  // NB: Safety
  if values.len() < 6 {
    error!("Values array is too short.");
    return Err(GrokClientError::BadSignatureInputs);
  }

  // start = [float(x) for x in values[0:3]]
  let start = values[0..3].iter().map(|x| *x as f64).collect::<Vec<_>>();

  // end = [float(x) for x in values[3:6]]
  let end = values[3..6].iter().map(|x| *x as f64).collect::<Vec<_>>();

  debug!("[simulate_style] start = {:?}", start);
  debug!("[simulate_style] end = {:?}", end);

  // r = round(start[0] + (end[0] - start[0]) * easedY)
  // g = round(start[1] + (end[1] - start[1]) * easedY)
  // b = round(start[2] + (end[2] - start[2]) * easedY)

  let r = (start[0] + (end[0] - start[0]) * eased_y).round() as u32;
  let g = (start[1] + (end[1] - start[1]) * eased_y).round() as u32;
  let b = (start[2] + (end[2] - start[2]) * eased_y).round() as u32;

  // color = f"rgb({r}, {g}, {b})"
  let color = format!("rgb({r}, {g}, {b})");

  debug!("[simulate_style] color = {:?}", color);

  // endAngle = Signature._h(values[6], 60, 360, True)
  let value_6 = values.get(6).map(|v| *v as f64).ok_or_else(|| GrokClientError::BadSignatureInputs)?;
  let end_angle = signature_h(value_6, 60.0, 360.0, true)?;

  debug!("[simulate_style] end_angle = {:?}", end_angle);

  // angle = endAngle * easedY
  let angle = end_angle * eased_y;

  debug!("[simulate_style] angle = {:?}", angle);

  // rad = angle * pi / 180.0
  let pi = std::f64::consts::PI;
  let rad = angle * pi / 180.0;

  debug!("[simulate_style] rad = {:?}", rad);

  // cosv = cos(rad)
  // sinv = sin(rad)
  let cosv = rad.cos();
  let sinv = rad.sin();

  debug!("[simulate_style] cosv = {:?}", cosv);
  debug!("[simulate_style] sinv = {:?}", sinv);

  /*
        if is_effectively_zero(cosv):
            a = 0
            d = 0
        else:
            if is_effectively_integer(cosv):
                a = int(round(cosv))
                d = int(round(cosv))
            else:
                a = f"{cosv:.6f}"
                d = f"{cosv:.6f}"

        if is_effectively_zero(sinv):
            bval = 0
            cval = 0
        else:
            if is_effectively_integer(sinv):
                bval = int(round(sinv))
                cval = int(round(-sinv))
            else:
                bval = f"{sinv:.7f}"
                cval = f"{(-sinv):.7f}"

        transform = f"matrix({a}, {bval}, {cval}, {d}, 0, 0)"
        return {"color": color, "transform": transform}
   */

  let a;
  let d;

  if is_effectively_zero(cosv) {
    // a = 0
    // d = 0
    a = "0".to_string();
    d = "0".to_string();
  } else {
    if is_effectively_integer(cosv) {
      // a = int(round(cosv))
      // d = int(round(cosv))
      let rounded = cosv.round() as i32;
      a = format!("{:.0}", rounded);
      d = format!("{:.0}", rounded);
    } else {
      //a = f"{cosv:.6f}"
      //d = f"{cosv:.6f}"
      a = format!("{:.6}", cosv);
      d = format!("{:.6}", cosv);
    }
  }

  let bval;
  let cval;

  if is_effectively_zero(sinv) {
    // bval = 0
    // cval = 0
    bval = "0".to_string();
    cval = "0".to_string();
  } else {
    if is_effectively_integer(cosv) {
      // bval = int(round(sinv))
      // cval = int(round(-sinv))
      let rounded_pos = sinv.round() as i32;
      let rounded_neg= (-1.0 * sinv).round() as i32;
      bval = format!("{:.0}", rounded_pos);
      cval = format!("{:.0}", rounded_neg);
    } else {
      // bval = f"{sinv:.7f}"
      // cval = f"{(-sinv):.7f}"
      bval = format!("{:.7}", sinv);
      cval = format!("{:.7}", (sinv * -1.0));
    }
  }

  debug!("[simulate_style] a = {}", a);
  debug!("[simulate_style] d = {}", d);
  debug!("[simulate_style] bval = {}", bval);
  debug!("[simulate_style] cval = {}", cval);

  // transform = f"matrix({a}, {bval}, {cval}, {d}, 0, 0)"
  let transform = format!("matrix({a}, {bval}, {cval}, {d}, 0, 0)");

  debug!("[simulate_style] transform = {:?}", transform);

  Ok(SimulatedStyle {
    color,
    transform,
  })
}


fn is_effectively_zero(val: f64) -> bool {
  val.abs() <= 1e-7
}

fn is_effectively_integer(val: f64) -> bool {
  (val - val.round()).abs() <= 1e-7
}

#[cfg(test)]
mod tests {

  mod test_signature_simulate_style {
    use crate::requests::index_page::signature::signature_simulate_style::signature_simulate_style;

    #[test]
    fn test_1() {
      // from xs - 'vals'
      let values = vec![73, 44, 215, 158, 218, 29, 68, 13, 98, 243, 134];
      // from xs - 'c'
      let c = 900;

      let output = signature_simulate_style(&values, c).unwrap();

      // NB: Values from python code
      let expected_color = "rgb(67, 32, 227)";
      let expected_transform = "matrix(0.986679, -0.1626771, 0.1626771, 0.986679, 0, 0)";

      assert_eq!(&output.color, expected_color);
      assert_eq!(&output.transform, expected_transform);
    }
  }

  mod helper_functions {
    use crate::requests::index_page::signature::signature_simulate_style::{is_effectively_integer, is_effectively_zero};

    #[test]
    fn test_is_effectively_zero() {
      // Yes
      assert!(is_effectively_zero(0.0));
      assert!(is_effectively_zero(0.00000001));
      assert!(is_effectively_zero(0.0000000001));
      // No
      assert!(!is_effectively_zero(0.000001));
      assert!(!is_effectively_zero(1.0));
      assert!(!is_effectively_zero(-1.0));
      assert!(!is_effectively_zero(10.0));
      assert!(!is_effectively_zero(0.231));
    }

    #[test]
    fn test_is_effectively_integer() {
      // Yes
      assert!(is_effectively_integer(0.0));
      assert!(is_effectively_integer(1.0));
      assert!(is_effectively_integer(1.00000001));
      assert!(is_effectively_integer(3.00000001));
      assert!(is_effectively_integer(-0.00000001));
      // No
      assert!(!is_effectively_integer(3.5));
      assert!(!is_effectively_integer(0.2));
      assert!(!is_effectively_integer(-0.01234));
    }
  }
}
