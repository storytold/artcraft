use std::fs::File;
use std::io::{self, BufRead};
use std::path::Path;

/// Read lines from a file in an iterator.
/// From Rust manual: https://doc.rust-lang.org/rust-by-example/std_misc/file/read_lines.html
pub fn iterate_file_lines<P>(filename: P) -> io::Result<io::Lines<io::BufReader<File>>>
where P: AsRef<Path>, {
  let file = File::open(filename)?;
  Ok(io::BufReader::new(file).lines())
}

#[cfg(test)]
mod tests {
  use test_utils::test_file_path::test_file_path;
  use crate::file_lines::iterate_file_lines::iterate_file_lines;

  #[test]
  fn load_file() {
    let filename = test_file_path("test_data/text_files/cidr_ban_example/local_cidrs_example.txt")
        .expect("should be a valid path");

    let lines = iterate_file_lines(filename)
        .expect("should be readable file");

    let lines: Vec<String> = lines.map(|line| line.unwrap()).collect();

    assert_eq!(
      lines,
      vec![
        "# this is test data".to_string(),
        "".to_string(),
        "# local cidrs".to_string(),
        "127.0.0.0/24".to_string(),
        "192.168.0.0/24".to_string(),
      ]);
  }
}
