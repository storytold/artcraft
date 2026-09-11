use once_cell::sync::Lazy;
use std::io;
use std::path::{PathBuf, MAIN_SEPARATOR};

static PREFIX: Lazy<String> = Lazy::new(|| format!("~{}", MAIN_SEPARATOR));

/// The "expanduser" crate doesn't compile on Windows, so we replace its functionality slightly
pub fn expanduser<P: AsRef<str>>(path: P) -> io::Result<PathBuf> {

   Ok(match path.as_ref() {
       // matches an exact "~"
       s if s == "~" => {
           home_dir()?
       },
       // matches paths that start with `~/`
       s if s.starts_with(&*PREFIX) => {
           let home = home_dir()?;
           home.join(&s[2..])
       },
       // // matches paths that start with `~` but not `~/`, might be a `~username/` path
       // s if s.starts_with("~") => {
       //     let mut parts = s[1..].splitn(2, MAIN_SEPARATOR);
       //     let user = parts.next()
       //         .ok_or_else(|| io::Error::new(io::ErrorKind::Other, "malformed path"))?;
       //     let user = Passwd::from_name(&user)
       //         .map_err(|_| io::Error::new(io::ErrorKind::Other, "error searching for user"))?
       //         .ok_or_else(|| io::Error::new(io::ErrorKind::Other, format!("user '{}', does not exist", &user)))?;
       //     if let Some(ref path) = parts.next() {
       //         PathBuf::from(user.dir).join(&path)
       //     } else {
       //         PathBuf::from(user.dir)
       //     }
       // },
       // nothing to expand, just make a PathBuf
       s => PathBuf::from(s)
   })
}

pub fn home_dir() -> io::Result<PathBuf> {
    dirs::home_dir()
        .ok_or_else(|| io::Error::new(io::ErrorKind::Other, "no home directory is set"))
}

#[cfg(test)]
mod tests {
  use crate::core::state::expanduser::expanduser;
  use std::env;
  use std::path::PathBuf;

  #[test]
    #[serial_test::serial]
    fn test_success() {
        let old_home = env::var("HOME").expect("no home dir set");
        let new_home = "/home/foo";
        env::set_var("HOME", new_home);
        let path = expanduser("~/path/to/directory");
        env::set_var("HOME", old_home);
        assert_eq!(path.expect("io error"), PathBuf::from("/home/foo/path/to/directory"));
    }

    #[test]
    #[serial_test::serial]
    fn test_only_tilde() {
        let old_home = env::var("HOME").expect("no home dir set");
        let new_home = "/home/foo";
        env::set_var("HOME", new_home);
        let pathstr = "~";
        let path = expanduser(pathstr);
        env::set_var("HOME", old_home);
        assert_eq!(path.expect("io error"), PathBuf::from("/home/foo"));
    }

}