use crate::error::grok_client_error::GrokClientError;
use log::debug;
use once_cell::sync::Lazy;
use regex::Regex;

static CLEAN_NON_DIGIT_REGEX : Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#"[^\d]+"#)
      .expect("Regex should parse")
});

/*
    @staticmethod
    def xa(svg: str) -> List[List[int]]:
        s = (svg)
        substr = s[9:]
        parts = substr.split("C")
        out = []
        for part in parts:
            cleaned = sub(r"[^\d]+", " ", part).strip()
            if cleaned == "":
                nums = [0]
            else:
                nums = [int(tok) for tok in cleaned.split() if tok != ""]
            out.append(nums)
        return out
 */

/// Based on "Grok-Api/core/xctid.py"
/// `svg_data` is the <path d="" /> svg path stroke data
pub fn signature_xa(svg_data: &str) -> Result<Vec<Vec<u32>>, GrokClientError> {
  // s = (svg) -- not this is needed, looks like a NO-OP to me.
  let s = svg_data;
  debug!("[xa] s.len() ={}", s.len());

  // substr = s[9:]
  let substr = &s[9..];
  debug!("[xa] substr ={}", substr);
  debug!("[xa] substr.len() ={}", substr.len());

  // parts = substr.split("C")
  let parts = substr.split("C").collect::<Vec<_>>();
  debug!("[xa] parts.len() = {}", parts.len());
  debug!("[xa] parts = {:?}", parts);

  let mut out = Vec::new();

  for part in parts {
    // cleaned = sub(r"[^\d]+", " ", part).strip()
    let cleaned = CLEAN_NON_DIGIT_REGEX.replace_all(part, " ").to_string().trim().to_string();
    debug!("[xa] cleaned len = {} value = {}", cleaned.len(), cleaned);
    let mut nums;
    if cleaned == "" {
      // nums = [0]
      nums = vec![0u32]
    } else {
      // nums = [int(tok) for tok in cleaned.split() if tok != ""]
      nums = cleaned.split_whitespace()
          .filter(|x| !x.is_empty())
          .filter_map(|s| s.parse::<u32>().ok()) // TODO: Don't choke on parse errors
          .collect();
    }
    out.push(nums);
  }

  debug!("[xa] out = {:?}", out);

  Ok(out)
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::signature::signature_xa::signature_xa;

  #[test]
  fn test() {
    let svg_data = "M 10,30 C 147,16 51,222 136,87 h 31 s 177,77 40,114 C 68,166 18,188 114,44 h 220 s 148,210 202,25 C 220,36 246,218 12,120 h 244 s 34,154 56,161 C 211,204 208,60 174,14 h 155 s 157,116 220,95 C 116,164 53,210 174,232 h 139 s 148,151 135,221 C 167,196 118,27 149,247 h 233 s 129,238 113,21 C 73,44 215,158 218,29 h 68 s 13,98 243,134 C 44,98 149,35 20,178 h 163 s 219,104 41,152 C 237,107 118,120 127,117 h 57 s 41,167 43,136 C 116,168 44,246 182,209 h 143 s 238,93 237,119 C 142,36 64,67 97,111 h 71 s 230,247 119,27 C 206,56 158,51 71,115 h 135 s 120,186 74,57 C 197,165 180,214 102,16 h 88 s 252,48 189,166 C 163,237 57,253 154,60 h 96 s 84,56 15,66 C 177,101 10,202 185,227 h 29 s 204,55 115,219 C 103,82 127,143 194,99 h 102 s 179,63 84,110";
    let expected = vec![
      vec![147, 16, 51, 222, 136, 87, 31, 177, 77, 40, 114],
      vec![68, 166, 18, 188, 114, 44, 220, 148, 210, 202, 25],
      vec![220, 36, 246, 218, 12, 120, 244, 34, 154, 56, 161],
      vec![211, 204, 208, 60, 174, 14, 155, 157, 116, 220, 95],
      vec![116, 164, 53, 210, 174, 232, 139, 148, 151, 135, 221],
      vec![167, 196, 118, 27, 149, 247, 233, 129, 238, 113, 21],
      vec![73, 44, 215, 158, 218, 29, 68, 13, 98, 243, 134],
      vec![44, 98, 149, 35, 20, 178, 163, 219, 104, 41, 152],
      vec![237, 107, 118, 120, 127, 117, 57, 41, 167, 43, 136],
      vec![116, 168, 44, 246, 182, 209, 143, 238, 93, 237, 119],
      vec![142, 36, 64, 67, 97, 111, 71, 230, 247, 119, 27],
      vec![206, 56, 158, 51, 71, 115, 135, 120, 186, 74, 57],
      vec![197, 165, 180, 214, 102, 16, 88, 252, 48, 189, 166],
      vec![163, 237, 57, 253, 154, 60, 96, 84, 56, 15, 66],
      vec![177, 101, 10, 202, 185, 227, 29, 204, 55, 115, 219],
      vec![103, 82, 127, 143, 194, 99, 102, 179, 63, 84, 110]
    ];

    let output = signature_xa(&svg_data).unwrap();

    assert_eq!(output, expected);
  }
}
