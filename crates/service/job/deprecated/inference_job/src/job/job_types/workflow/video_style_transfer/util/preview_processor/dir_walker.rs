use std::path::PathBuf;
use tokio::sync::mpsc;


#[derive(Debug)]
pub struct PathBatch {
  paths: Vec<PathBuf>,
}

impl PathBatch {
  pub fn new() -> Self {
    Self {
      paths: Vec::new(),
    }
  }

  pub fn add_path(&mut self, path: PathBuf) {
    self.paths.push(path);
  }

  pub fn get_paths(&self) -> Vec<PathBuf> {
    self.paths.clone()
  }
}

#[derive(Clone, Debug)]
pub struct DirWalker {
  base_directory: PathBuf,
  batch_size: usize,
  tx: mpsc::Sender<Result<PathBatch, std::io::Error>>,
}

impl DirWalker {
  pub(crate) fn new(base_directory: PathBuf, tx: mpsc::Sender<Result<PathBatch, std::io::Error>>) -> Self {
    Self {
      base_directory,
      tx,
      batch_size: 10,
    }
  }
  
  pub(crate) fn new_with_batch_size(base_directory: PathBuf, tx: mpsc::Sender<Result<PathBatch, std::io::Error>>, batch_size: usize) -> Self {
    Self {
      base_directory,
      tx,
      batch_size,
    }
  }

  pub(crate) async fn send_batch(&self, batch: PathBatch) {
    self.tx.send(Ok(batch)).await.unwrap();
  }

  pub(crate) async fn walk(&self) {
    let dir = std::fs::read_dir(self.base_directory.clone());
    match dir {
      Ok(dir) => {
        if dir.count() > 0 {
          let mut batch = PathBatch::new();
          for entry in std::fs::read_dir(self.base_directory.clone()).unwrap() {
            let entry = entry.unwrap();
            let path = entry.path();
            if path.is_dir() {
              for entry in std::fs::read_dir(&path).unwrap() {
                let entry = entry.unwrap();
                let path = entry.path();
                batch.add_path(path);
                if batch.get_paths().len() >= self.batch_size {
                  self.send_batch(batch).await;
                  batch = PathBatch::new();
                }
              }
            }
          }
          if batch.get_paths().len() > 0 {
            self.send_batch(batch).await;
          }
        }
      },
      Err(e) => {
        log::info!("Error reading preview frames directory: {:?}", e);
      }
    }
  }

  // pub(crate) async fn walk(&self) {
  //   let dir = std::fs::read_dir(self.base_directory.clone());
  //   match dir {
  //     Ok(dir) => {
  //       if dir.count() > 0 {
  //         for entry in std::fs::read_dir(self.base_directory.clone()).unwrap() {
  //           let entry = entry.unwrap();
  //           let path = entry.path();
  //           if path.is_dir() {
  //             for entry in std::fs::read_dir(&path).unwrap() {
  //               let entry = entry.unwrap();
  //               let path = entry.path();
  //               let tx = self.tx.clone();
  //               tokio::spawn(async move {
  //                 log::debug!("Sending frame for processing: {:?}", path);
  //                 tx.send(Ok(path)).await.unwrap();
  //               });
  //             }
  //           }
  //         }
  //       }
  //     },
  //     Err(e) => {
  //       log::info!("Error reading preview frames directory: {:?}", e);
  //     }
  //   }
  // }
}
