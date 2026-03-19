/// Options for launching subprocesses under a docker container
#[derive(Clone)]
pub struct DockerOptions {
  pub image_name: String,
  pub maybe_bind_mount: Option<DockerFilesystemMount>,
  pub maybe_environment_variables: Option<Vec<DockerEnvVar>>,
  pub maybe_gpu: Option<DockerGpu>,
}

#[derive(Clone)]
pub struct DockerFilesystemMount {
  pub local_filesystem: String,
  pub container_filesystem: String,
}

#[derive(Clone)]
pub struct DockerEnvVar {
  pub name: String,
  pub value: String,
}

#[derive(Clone)]
pub enum DockerGpu {
  All,
  Named(String),
}

impl DockerFilesystemMount {
  pub fn tmp_to_tmp() -> Self {
    Self {
      local_filesystem: "/tmp".to_string(),
      container_filesystem: "/tmp".to_string(),
    }
  }

  pub fn to_fuse_option_string(&self) -> String {
    // TODO: Handle spaces and special characters. Make sure this can't lead to injection.
    format!(" --mount type=bind,source={},target={} ", &self.local_filesystem, &self.container_filesystem)
  }
}

impl DockerEnvVar {
  pub fn new(name: &str, value: &str) -> Self {
    Self {
      name: name.to_string(),
      value: value.to_string(),
    }
  }
}

impl DockerGpu {
  pub fn to_option_string(&self) -> String {
    match self {
      DockerGpu::All => " --gpus all ".to_string(),
      // TODO: Handle spaces and special characters. Make sure this can't lead to injection.
      DockerGpu::Named(named) => format!(" --gpus {}", named),
    }
  }
}

impl DockerOptions {
  pub fn to_command_string(&self, container_command: &str) -> String {
    let fuse_command = self.maybe_bind_mount
        .as_ref()
        .map(|mount| mount.to_fuse_option_string())
        .unwrap_or("".to_string());

    let env_vars = match self.maybe_environment_variables {
      None => "".to_string(),
      Some(ref env_vars) => {
        env_vars.iter()
            .map(|var| format!("{}={}", &var.name, &var.value))
            .map(|var_assignment| var_assignment.trim().to_string())
            .map(|var_assignment| format!(" --env {} ", var_assignment))
            .collect::<Vec<String>>()
            .join("")
      }
    };

    let gpu_command = self.maybe_gpu
        .as_ref()
        .map(|gpu| gpu.to_option_string())
        .unwrap_or("".to_string());

    // TODO: Handle spaces and special characters. Make sure this can't lead to injection.
    format!("docker run --rm {} {} {} {} /bin/bash -c \"{}\"",
            &env_vars,
            &fuse_command,
            &gpu_command,
            &self.image_name,
            container_command)
  }
}

#[cfg(test)]
mod tests {
  use crate::docker_options::{DockerEnvVar, DockerFilesystemMount, DockerGpu, DockerOptions};

  #[test]
  fn test_command() {
    let command = DockerOptions {
      image_name: "MY_IMAGE".to_string(),
      maybe_bind_mount: Some(DockerFilesystemMount {
        local_filesystem: "/local".to_string(),
        container_filesystem: "/container".to_string(),
      }),
      maybe_environment_variables: Some(vec![
        DockerEnvVar { name: "FOO".to_string(), value: "1".to_string() },
        DockerEnvVar { name: "BAR".to_string(), value: "2".to_string() },
      ]),
      maybe_gpu: Some(DockerGpu::All),
    };

    assert_eq!("docker run --rm  --env FOO=1  --env BAR=2   --mount type=bind,source=/local,target=/container   --gpus all  MY_IMAGE /bin/bash -c \"echo wat\"",
               command.to_command_string("echo wat"));
  }
}
