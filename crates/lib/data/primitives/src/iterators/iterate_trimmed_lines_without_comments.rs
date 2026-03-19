

/// Read lines from a file in an iterator.
/// Remove comment lines prefixed with `#`.
pub fn iterate_trimmed_lines_without_comments<'a>(iterator: impl IntoIterator<Item=&'a str>)
  -> impl Iterator<Item = &'a str>
{
  iterator.into_iter()
      .map(|line| line.trim())
      .filter(|line| !(line.starts_with("#") || line.is_empty()))
}

#[cfg(test)]
mod tests {
  use crate::iterators::iterate_trimmed_lines_without_comments::iterate_trimmed_lines_without_comments;
  use std::fs::File;
  use std::io::Read;
  use test_utils::test_file_path::test_file_path;

  #[test]
  fn load_file() {
    let filename = test_file_path("test_data/text_files/cidr_ban_example/local_cidrs_example.txt")
        .expect("should be a valid path");

    let mut file = File::open(filename)
        .expect("file should open");

    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .expect("should be able to read file");

    let lines = contents.lines();
    let lines = iterate_trimmed_lines_without_comments(lines);

    assert_eq!(
      lines.collect::<Vec<_>>(),
      vec![
        "127.0.0.0/24",
        "192.168.0.0/24",
      ]);
  }
}
