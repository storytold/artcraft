use std::path::Path;

use log::warn;

use crate::file_deletion::safe_delete_directory::safe_delete_directory;
use crate::file_deletion::safe_delete_file::safe_delete_file;
use crate::file_deletion::safe_recursively_delete_files::safe_recursively_delete_files;

/// Safely deletes all files and directories passed to the function without panicking. Errors are logged.
/// Directories are recursively deleted before being removed.
/// This is an infallible, idempotent function.
///
/// Note on usage: since this is a generic function with only one generic type, `P`, you can only pass
/// a list of paths that are all the same type. If you have a mix of `PathBuf` and `&Path`, it's best to
/// convert the PathBuf to &Path references. Mixing other `AsRef<Path>` types will be more complicated,
/// so it may be worth calling `as_ref()` on them, e.g.:
///
/// ```rust
/// use std::path::{Path, PathBuf};
/// use filesys::file_deletion::safe_delete_possible_files_and_directories::safe_delete_possible_files_and_directories;
///
/// safe_delete_possible_files_and_directories(&[
///   Some(Path::new("1234_foo_bar_baz.bash")),
///   None,
///   Some(&PathBuf::from("1234_foo_bar_baz.bin")),
///   None,
/// ]);
/// ```
pub fn safe_delete_possible_files_and_directories<P: AsRef<Path>>(possible_paths: &[Option<P>]) {
  for possible_path in possible_paths {
    let path = match possible_path {
      None => continue,
      Some(path) => path,
    };
    let p = path.as_ref();
    if p.is_file() {
      safe_delete_file(p);
    } else if p.is_dir() {
      safe_recursively_delete_files(p);
      safe_delete_directory(p);
    } else {
      warn!("Path {:?} is neither a file nor a directory", p);
    }
  }
}
