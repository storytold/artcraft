use std::{io, path::Path, process::Command, string::String};

pub fn audiowmark_add<P>(in_path: P, strength: u8, message: [u8;16], out_path: P) -> Result<String, io::Error>
where P: AsRef<Path> {
    let output = Command::new("audiowmark")
        .args([
            "add",
            in_path.as_ref().as_os_str().to_str()
                .ok_or(io::Error::new(io::ErrorKind::Other, "os_str shenanigans!"))?,
            "--strength", format!("{}", strength).as_str(),
            out_path.as_ref().as_os_str().to_str()
                .ok_or(io::Error::new(io::ErrorKind::Other, "os_str shenanigans!"))?,
            format!("{:16x}", u128::from_be_bytes(message)).as_str()
        ])
        .output();
    match output {
        Ok(o) => {
            if o.status.success() {
                Ok(String::from_utf8(o.stdout)
                    .map_err(|_| io::Error::new(io::ErrorKind::Other, "not utf8"))?)
            }
            else {
                Err(io::Error::new(io::ErrorKind::Other, format!("audiowmark exit status {} {}", o.status, String::from_utf8(o.stderr)
                    .map_err(|_| io::Error::new(io::ErrorKind::Other, "not utf8"))?))
                )
            }
        },
        Err(e) => Err(e)
    }
}

pub fn audiowmark_retrieve<P>(in_path: P) -> Result<[u8;16], io::Error> 
where P: AsRef<Path> {
    let output = Command::new("audiowmark")
        .args([
            "get",
            in_path.as_ref().as_os_str().to_str()
                .ok_or(io::Error::new(io::ErrorKind::Other, "os_str shenanigans!"))?
        ])
        .output();
    match output {
        Ok(out) => 
            if out.status.success() {
                Ok(
                    u128::from_str_radix(String::from_utf8(out.stdout)
                        .map_err(|_e| io::Error::new(io::ErrorKind::Other, "audiowmark output parse failed"))?
                        .split_whitespace().take(3).collect::<Vec<&str>>().get(2)
                            .ok_or(io::Error::new(io::ErrorKind::Other, "audiowmark output didn't match expected format"))?
                    , 16)
                    .map_err(|_e| io::Error::new(io::ErrorKind::Other, "audiowmark output parse failed"))?
                    .to_be_bytes()
                )
            }
            else {
                Err(io::Error::new(
                        io::ErrorKind::Other,
                        format!("audiowmark exit status {} {}", out.status, String::from_utf8(out.stderr)
                            .map_err(|_| io::Error::new(io::ErrorKind::Other, "not utf8"))?
                    ))
                )
            }

        Err(e) => Err(e)
    }
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use super::*;

  fn test_file(path_from_repo_root: &str) -> PathBuf {
    // https://doc.rust-lang.org/cargo/reference/environment-variables.html
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.push(format!("../../../../../{}", path_from_repo_root));

    path
}
  
#[ignore]
#[test]
fn test_audiowmark() {
    let path = test_file("test_data/audio/mp3/super_mario_rpg_beware_the_forests_mushrooms.mp3");
    let message = b"FAKE YOU DOT COM";
    let res = audiowmark_add(
        path,
        40,
        *message,
        "audiowmark_testfile.wav".into()
    );
    match res {
            Ok(output) => {
                // check the output of the process doesn't contain an error message
                assert!(!output.to_lowercase().contains("error"));
                // check the watermark can be decoded 
                let retrieve_out = audiowmark_retrieve(
                    "audiowmark_testfile.wav"
                );
                match retrieve_out {
                    Ok(bytes) => {
                        println!("{:x}", u128::from_be_bytes(bytes));
                        assert_eq!(bytes, *message, "Watermark didn't match the input");
                    }
                    Err(e) => {
                        assert!(false, "Watermark retrieval command failed: {}", e);
                    }
                };
            },
            Err(e) => {
                assert!(false, "Watermark add command failed: {}", e);
            }
        }
    }
}
