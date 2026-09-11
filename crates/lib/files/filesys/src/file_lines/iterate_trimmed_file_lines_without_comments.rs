use crate::file_lines::iterate_file_lines::iterate_file_lines;
use std::io;
use std::path::Path;

/// Read lines from a file in an iterator.
/// Remove comment lines prefixed with `#`.
pub fn iterate_trimmed_file_lines_without_comments<P>(filename: P)
  -> io::Result<impl Iterator<Item = io::Result<String>>>
where
  P: AsRef<Path>,
{
  // NB: This is a little bit nasty because we don't want to call ::collect() on
  // the iterator to coalesce any errors in the stream.
  let it = iterate_file_lines(filename)?
      .map(|maybe_line| match maybe_line {
        Ok(line) => Ok(line.trim().to_string()),
        Err(e) => Err(e),
      })
      .filter_map(|maybe_line| match maybe_line {
        Err(e) => Some(Err(e)),
        Ok(line) => {
          if line.starts_with("#") || line.is_empty() {
            None
          } else {
            Some(Ok(line))
          }
        },
      });

  Ok(it)
}

#[cfg(test)]
mod tests {
  use crate::file_lines::iterate_trimmed_file_lines_without_comments::iterate_trimmed_file_lines_without_comments;
  use test_utils::test_file_path::test_file_path;

  #[test]
  fn load_file() {
    let filename = test_file_path("test_data/text_files/cidr_ban_example/local_cidrs_example.txt")
        .expect("should be a valid path");

    let lines = iterate_trimmed_file_lines_without_comments(filename)
        .expect("should be readable file");

    let lines: Vec<String> = lines.filter_map(|line| line.ok()).collect();

    assert_eq!(
      lines,
      vec![
        "127.0.0.0/24".to_string(),
        "192.168.0.0/24".to_string(),
      ]);
  }
}
