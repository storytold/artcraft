#[derive(Default)]
pub struct CoordinatedWorkflowArgs {
  /// The "positive" prompt, which is the main workflow prompt
  /// This can include a prompt traveling section, which will be parsed out.
  /// If the `travel_prompt` field is specified, that will be used for prompt travel instead.
  pub prompt: Option<String>,

  /// An optional prompt travelling prompt
  pub travel_prompt: Option<String>,

  /// Use lipsync in the workflow
  pub use_lipsync: Option<bool>,

  /// Use face detailer
  /// Only for premium accounts
  pub use_face_detailer: Option<bool>,

  /// Use video upscaler
  /// Only for premium accounts
  pub use_upscaler: Option<bool>,

  /// Disable LCM
  /// Don't let ordinary users do this.
  /// Non-LCM workflows take a long time.
  pub disable_lcm: Option<bool>,

  /// Use the cinematic workflow
  /// Don't let ordinary users do this.
  pub use_cinematic: Option<bool>,

  /// Use cogvideo
  /// Only for staff
  pub use_cogvideo: Option<bool>,

  /// Remove watermark from the output
  /// Only for premium accounts
  pub remove_watermark: Option<bool>,
}

pub fn coordinate_workflow_args(mut args: CoordinatedWorkflowArgs, is_staff: bool) -> CoordinatedWorkflowArgs {
  handle_prompts(&mut args);
  handle_flags(&mut args, is_staff);
  args
}

fn handle_prompts(args: &mut CoordinatedWorkflowArgs) {
  let mut replace_prompt = None;
  let mut replace_travel_prompt = None;

  let maybe_split_prompts = args.prompt.as_deref()
      .map(|prompt| prompt.split_once("---"))
      .flatten();

  match maybe_split_prompts {
    Some((prompt, travel_prompt)) => {
      let p = prompt.trim();
      let tp = travel_prompt.trim();

      if !tp.is_empty() {
        replace_prompt = Some(p.to_string());
        replace_travel_prompt = Some(tp.to_string());
      }
    }
    _ => {}
  }

  if replace_prompt.is_some() && replace_travel_prompt.is_some() {
    args.prompt = replace_prompt;
    if args.travel_prompt.is_none() {
      args.travel_prompt = replace_travel_prompt;
    }
  }
}

fn handle_flags(args: &mut CoordinatedWorkflowArgs, is_staff: bool) {

  if !is_staff {
    // Non-staff cannot use these workflows
    args.disable_lcm = None;
    args.remove_watermark = None;
    args.use_cogvideo = None;
  }

  if args.use_upscaler == Some(true) {
    args.use_cinematic = None;
  } else {
    // TODO(bt,2024-07-15): Temporarily do this.
    args.use_cinematic = Some(true);
  }


  if args.use_cinematic == Some(true) {
    // use_cinematic has a built-in upscaler
    args.use_upscaler = None;

    // non-lcm is a different workflow.
    //
    // Yae on cinematic vs. non-LCM: "thats...really hard to predict. I would say that current
    // LCM stands pretty confidently against non-LCM, especially considering rendering time.
    // but non-LCM have a chance to give more detailer background and a more saturated picture,
    // but again, it is very checkpoint-related.  Personally, I still use non-lcm for my own
    // projects, but some styles just looks better with LCM."
    args.disable_lcm = None;
  }

  if args.use_lipsync == Some(true) {
    // can't use face detailer and lipsync together
    // TODO(bt): We're testing new code that might make this decision obsolete
    // args.use_face_detailer = None;
  }

  // you can still use upscaler for non-lcm version (it will just take a while)
}

#[cfg(test)]
mod tests {
  use super::{coordinate_workflow_args, CoordinatedWorkflowArgs};

  mod prompts {
    use super::*;

    #[test]
    fn test_no_prompts() {
      let mut args = CoordinatedWorkflowArgs::default();
      args.prompt = None;
      args.travel_prompt = None;
      let coordinated_args = coordinate_workflow_args(args, true);

      assert_eq!(coordinated_args.prompt, None);
      assert_eq!(coordinated_args.travel_prompt, None);
    }

    #[test]
    fn test_simple_positive_prompt() {
      let mut args = CoordinatedWorkflowArgs::default();
      args.prompt = Some("foo, bar, baz".to_string());
      args.travel_prompt = None;
      let coordinated_args = coordinate_workflow_args(args, true);

      assert_eq!(coordinated_args.prompt, Some("foo, bar, baz".to_string())); // Unchanged
      assert_eq!(coordinated_args.travel_prompt, None);
    }

    #[test]
    fn test_composite_positive_prompt() {
      let mut args = CoordinatedWorkflowArgs::default();
      args.prompt = Some("foo, bar, baz --- bin, bash".to_string());
      args.travel_prompt = None;
      let coordinated_args = coordinate_workflow_args(args, true);

      assert_eq!(coordinated_args.prompt, Some("foo, bar, baz".to_string()));
      assert_eq!(coordinated_args.travel_prompt, Some("bin, bash".to_string()));
    }

    #[test]
    fn test_composite_positive_prompt_newlines() {
      let mut args = CoordinatedWorkflowArgs::default();
      args.prompt = Some("foo, bar, baz \n---\n bin, bash".to_string());
      args.travel_prompt = None;
      let coordinated_args = coordinate_workflow_args(args, true);

      assert_eq!(coordinated_args.prompt, Some("foo, bar, baz".to_string()));
      assert_eq!(coordinated_args.travel_prompt, Some("bin, bash".to_string()));
    }

    #[test]
    fn test_composite_positive_prompt_and_travel_prompt() {
      let mut args = CoordinatedWorkflowArgs::default();
      args.prompt = Some("foo, bar, baz --- bin, bash".to_string());
      args.travel_prompt = Some("querty, asdf".to_string());
      let coordinated_args = coordinate_workflow_args(args, true);

      assert_eq!(coordinated_args.prompt, Some("foo, bar, baz".to_string())); // Inline travel prompt dropped
      assert_eq!(coordinated_args.travel_prompt, Some("querty, asdf".to_string())); // Authoritative field used
    }
  }

  mod flags {
    use super::*;

    #[test]
    fn test_defaults() {
      let args = CoordinatedWorkflowArgs {
        prompt: None,
        travel_prompt: None,
        use_lipsync: None,
        use_face_detailer: None,
        use_upscaler: None,
        disable_lcm: None,
        use_cinematic: None,
        use_cogvideo: None,
        remove_watermark: None,
      };

      let coordinated_args = coordinate_workflow_args(args, true);

      // By default, cinematic is on.
      assert_eq!(coordinated_args.use_cinematic, Some(true));

      // Everything else is off.
      assert_eq!(coordinated_args.use_lipsync, None);
      assert_eq!(coordinated_args.use_face_detailer, None);
      assert_eq!(coordinated_args.use_upscaler, None);
      assert_eq!(coordinated_args.disable_lcm, None);
      assert_eq!(coordinated_args.use_cogvideo, None);
    }

    #[test]
    fn test_upscaler() {
      let args = CoordinatedWorkflowArgs {
        prompt: None,
        travel_prompt: None,
        use_lipsync: None,
        use_face_detailer: None,
        use_upscaler: Some(true),
        disable_lcm: None,
        use_cinematic: None,
        use_cogvideo: None,
        remove_watermark: None,
      };

      let coordinated_args = coordinate_workflow_args(args, true);

      assert_eq!(coordinated_args.use_lipsync, None);
      assert_eq!(coordinated_args.use_face_detailer, None);
      assert_eq!(coordinated_args.use_upscaler, Some(true));
      assert_eq!(coordinated_args.disable_lcm, None);
      assert_eq!(coordinated_args.use_cinematic, None);
      assert_eq!(coordinated_args.use_cogvideo, None);
    }

    #[test]
    fn test_cinematic_and_upscaler() {
      let args = CoordinatedWorkflowArgs {
        prompt: None,
        travel_prompt: None,
        use_lipsync: None,
        use_face_detailer: None,
        use_upscaler: Some(true),
        disable_lcm: None,
        use_cinematic: Some(true),
        use_cogvideo: None,
        remove_watermark: None,
      };

      let coordinated_args = coordinate_workflow_args(args, true);

      assert_eq!(coordinated_args.use_lipsync, None);
      assert_eq!(coordinated_args.use_face_detailer, None);
      assert_eq!(coordinated_args.use_upscaler, Some(true));
      assert_eq!(coordinated_args.disable_lcm, None);
      assert_eq!(coordinated_args.use_cinematic, None);
      assert_eq!(coordinated_args.use_cogvideo, None);
    }

    #[test]
    fn test_cinematic_and_disable_lcm() {
      let args = CoordinatedWorkflowArgs {
        prompt: None,
        travel_prompt: None,
        use_lipsync: None,
        use_face_detailer: None,
        use_upscaler: None,
        disable_lcm: Some(true),
        use_cinematic: Some(true),
        use_cogvideo: None,
        remove_watermark: None,
      };

      let coordinated_args = coordinate_workflow_args(args, true);

      assert_eq!(coordinated_args.use_lipsync, None);
      assert_eq!(coordinated_args.use_face_detailer, None);
      assert_eq!(coordinated_args.use_upscaler, None);
      assert_eq!(coordinated_args.disable_lcm, None);
      assert_eq!(coordinated_args.use_cinematic, Some(true));
      assert_eq!(coordinated_args.use_cogvideo, None);
    }

    #[test]
    fn test_lipsync_and_face_detailer() {
      let args = CoordinatedWorkflowArgs {
        prompt: None,
        travel_prompt: None,
        use_lipsync: Some(true),
        use_face_detailer: Some(true),
        use_upscaler: None,
        disable_lcm: None,
        use_cinematic: None,
        use_cogvideo: None,
        remove_watermark: None,
      };

      let coordinated_args = coordinate_workflow_args(args, true);

      assert_eq!(coordinated_args.use_lipsync, Some(true));
      assert_eq!(coordinated_args.use_face_detailer, Some(true)); // TODO(bt): Possibly temporary
      assert_eq!(coordinated_args.use_upscaler, None);
      assert_eq!(coordinated_args.disable_lcm, None);
      assert_eq!(coordinated_args.use_cinematic, Some(true));
      assert_eq!(coordinated_args.use_cogvideo, None);
    }
  }
}
