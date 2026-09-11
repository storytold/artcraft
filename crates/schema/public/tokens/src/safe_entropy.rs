

// Don't generate slurs or dangerous terms in the token generator
// Beware, this is an n*m*k operation.
//  see: https://news.ycombinator.com/item?id=35337210
//  see: https://www.reddit.com/r/ProgrammerHumor/comments/3ov56n/randomly_generating_ids_can_be_dangerous/
//  see: https://stackoverflow.com/a/36294356
#[inline]
pub fn entropy_is_safe(entropic_string: &str) -> bool {
  let entropic_string = entropic_string.to_lowercase();
  for bad in BAD_LIST.iter() {
    if entropic_string.contains(bad) {
      return false;
    }
  }
  true
}

/// This list of atoms should be kept *short* and the atoms themselves should
/// be short as long strings are improbable.
/// Some of this list came via ChatGPT.
/// Note: Crockford does not have `i`, `l`, `o`, `u`, ...
const BAD_LIST : [&str; 64] = [
  "000",
  "111",
  "1s15", // ISIS
  "1s1s", // ISIS
  "1sd",
  "455", // ass
  "4s5", // ass
  "4ss", // ass
  "53x",
  "5ex", // sex
  "5h1t",
  "a1ep", // https://news.ycombinator.com/item?id=35337210
  "a55", // ass
  "a5s", // ass
  "as5", // ass
  "ass",
  "b0mb",
  "bmb", // bomb
  "crp",
  "cvm", // cum
  "d1c", // dick
  "d1e", // die
  "d1k", // dick
  "dyk", // dyk[e] / ~dick
  "f3c",
  "f4ck", // fuck
  "f4g", // fag
  "fag",
  "fec",
  "fvc", // fvc[k]
  "fvk", // fuck
  "g0d",
  "g4y", // gay
  "gay",
  "gvn", // gun
  "jew",
  "k11", // kill
  "mvs",
  "n1g",
  "p00",
  "p0t",
  "p15", // piss
  "p1s", // piss
  "p33", // pee
  "p3e", // pee
  "p3n", // p3n[1s]
  "pcp",
  "pe3", // pee
  "pee",
  "pen", // pen[1s]
  "pn15", // penis
  "pn5", // penis
  "pns", // penis
  "pvs", // pus
  "r1p",
  "s3x", // sex
  "sex",
  "sh1t", // shit
  "sht", // shit
  "t1t",
  "tw4t", // twat
  "twt", // twat
  "war",
  "xxx",
];

#[cfg(test)]
mod tests {
  use crate::CROCKFORD_LOWERCASE_CHARSET;
  use super::BAD_LIST;

  mod do_not_waste_compute {
    use std::collections::HashSet;
    use super::*;

    #[test]
    fn no_duplicates() {
      let set = HashSet::from(BAD_LIST);
      assert_eq!(set.len(), BAD_LIST.len());
    }

    #[test]
    fn every_bad_word_is_crockford() {
      for bad in BAD_LIST.iter() {
        for c_test in bad.chars() {
          if !CROCKFORD_LOWERCASE_CHARSET.contains(&(c_test as u8)) {
            panic!("Bad word '{}' contains non-crockford character '{}'", bad, c_test);
          }
        }
      }
    }

    #[test]
    fn no_bad_word_is_a_subset_of_another_bad_word() {
      for bad_large in BAD_LIST.iter() {
        for bad_small in BAD_LIST.iter() {
          if bad_large != bad_small && bad_large.contains(bad_small) {
            panic!("Bad word '{}' contains another bad word '{}'", bad_large, bad_small);
          }
        }
      }
    }
  }
}
