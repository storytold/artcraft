use std::path::PathBuf;

use crate::job::job_types::workflow::comfy_ui_dependencies::ComfyDependencies;

/// This is a temporary measure until we start using tempdirs for intermediate inputs and outputs.
pub struct ComfyDirs {
  pub comfy_input_dir: PathBuf,
  pub comfy_output_dir: PathBuf,

}

impl ComfyDirs {
  pub fn new(comfy_deps: &ComfyDependencies) -> Self {
    // TODO(bt,2024-04-21): The pathing for this job is complicated. ComfyUI
    //  was set up with some of these expectations, which is bad. Worse, the
    //  jobs enqueue the expected output path -- no idea why that was done.
    //  This should all be fixed.
    let root_comfy_path = comfy_deps.inference_command.mounts_directory.as_path();
    Self {
      comfy_input_dir: root_comfy_path.join("input"),
      comfy_output_dir: root_comfy_path.join("output"),
    }
  }
}
