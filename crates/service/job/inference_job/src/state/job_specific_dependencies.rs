use crate::job::job_types::f5_tts::f5_tts_dependencies::F5TTSDependencies;
use crate::job::job_types::format_conversion::fbx_to_gltf::dependencies::FbxToGltfDependencies;
use crate::job::job_types::gpt_sovits::gpt_sovits_dependencies::GptSovitsDependencies;
use crate::job::job_types::image_generation::sd::stable_diffusion_dependencies::StableDiffusionDependencies;
use crate::job::job_types::lipsync::sad_talker::sad_talker_dependencies::SadTalkerDependencies;
use crate::job::job_types::mocap::mocap_net::mocapnet_dependencies::MocapNetDependencies;
use crate::job::job_types::render_engine_scene::render_engine_scene_to_video::dependencies::RenderEngineSceneToVideoDependencies;
use crate::job::job_types::tts::styletts2::styletts2_dependencies::StyleTTS2Dependencies;
use crate::job::job_types::tts::tacotron2::tacotron2_dependencies::Tacotron2Dependencies;
use crate::job::job_types::tts::vall_e_x::vall_e_x_dependencies::VallExDependencies;
use crate::job::job_types::tts::vits::vits_dependencies::VitsDependencies;
use crate::job::job_types::vc::rvc_v2::rvc_v2_dependencies::RvcV2Dependencies;
use crate::job::job_types::vc::seed_vc::seed_vc_dependencies::SeedVcDependencies;
use crate::job::job_types::vc::so_vits_svc::svc_dependencies::SvcDependencies;
use crate::job::job_types::videofilter::rerender_a_video::rerender_dependencies::RerenderDependencies;
use crate::job::job_types::workflow::comfy_ui_dependencies::ComfyDependencies;
use crate::state::scoped_job_type_execution::ScopedJobTypeExecution;
use crate::state::scoped_model_type_execution::ScopedModelTypeExecution;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use enums::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
use errors::AnyhowResult;

pub struct JobSpecificDependencies {
  pub maybe_rvc_v2_dependencies: Option<RvcV2Dependencies>,
  pub maybe_sad_talker_dependencies: Option<SadTalkerDependencies>,
  pub maybe_svc_dependencies: Option<SvcDependencies>,
  pub maybe_tacotron2_dependencies: Option<Tacotron2Dependencies>,
  pub maybe_vall_e_x_dependencies: Option<VallExDependencies>,
  pub maybe_vits_dependencies: Option<VitsDependencies>,
  pub maybe_rerender_dependencies: Option<RerenderDependencies>,
  pub maybe_stable_diffusion_dependencies: Option<StableDiffusionDependencies>,
  pub maybe_mocapnet_dependencies: Option<MocapNetDependencies>,
  pub maybe_styletts2_dependencies: Option<StyleTTS2Dependencies>,
  pub maybe_comfy_ui_dependencies: Option<ComfyDependencies>,
  pub maybe_convert_fbx_to_gltf_dependencies: Option<FbxToGltfDependencies>,
  pub maybe_convert_bvh_to_workflow_dependencies: Option<RenderEngineSceneToVideoDependencies>,
  pub maybe_gpt_sovits_dependencies: Option<GptSovitsDependencies>,
  pub maybe_f5_tts_dependencies: Option<F5TTSDependencies>,
  pub maybe_seed_vc_dependencies: Option<SeedVcDependencies>,
}

impl JobSpecificDependencies {

  pub async fn setup_for_jobs(
    scoped_job_type_execution: &ScopedJobTypeExecution,
    scoped_model_type_execution: &ScopedModelTypeExecution
  ) -> AnyhowResult<Self> {
    let mut maybe_rvc_v2_dependencies = None;
    let mut maybe_sad_talker_dependencies = None;
    let mut maybe_svc_dependencies = None;
    let mut maybe_tacotron2_dependencies = None;
    let mut maybe_vall_e_x_dependencies = None;
    let mut maybe_vits_dependencies = None;
    let mut maybe_rerender_dependencies = None;
    let mut maybe_stable_diffusion_dependencies = None;
    let mut maybe_mocapnet_dependencies = None;
    let mut maybe_styletts2_dependencies = None;
    let mut maybe_comfy_ui_dependencies = None;
    let mut maybe_convert_fbx_to_gltf_dependencies = None;
    let mut maybe_convert_bvh_to_workflow_dependencies = None;
    let mut maybe_gpt_sovits_dependencies = None;
    let mut maybe_f5_tts_dependencies = None;
    let mut maybe_seed_vc_dependencies = None;

    if scoped_model_type_execution.can_run_job(InferenceModelType::ComfyUi)
        || scoped_job_type_execution.can_run_job(InferenceJobType::LivePortrait)
        || scoped_job_type_execution.can_run_job(InferenceJobType::VideoRender)
        || scoped_job_type_execution.can_run_job(InferenceJobType::FaceFusion)
        || scoped_job_type_execution.can_run_job(InferenceJobType::ComfyUi)
    {
      print_with_space("Setting ComfyUI dependencies...");
      maybe_comfy_ui_dependencies = Some(ComfyDependencies::setup().await?);
    }

    if scoped_job_type_execution.can_run_job(InferenceJobType::GptSovits) {
      print_with_space("Setting GPT-SoViTS dependencies...");
      maybe_gpt_sovits_dependencies = Some(GptSovitsDependencies::setup()?);
    }

    if scoped_job_type_execution.can_run_job(InferenceJobType::F5TTS) {
      print_with_space("Setting F5TTS dependencies...");
      maybe_f5_tts_dependencies = Some(F5TTSDependencies::setup()?);
    }

    if scoped_job_type_execution.can_run_job(InferenceJobType::SeedVc) {
      print_with_space("Setting SeedVC dependencies...");
      maybe_seed_vc_dependencies = Some(SeedVcDependencies::setup()?);
    }

    if scoped_model_type_execution.can_run_job(InferenceModelType::RvcV2)
        || scoped_job_type_execution.can_run_job(InferenceJobType::RvcV2)
    {
      print_with_space("Setting RVCv2 dependencies...");
      maybe_rvc_v2_dependencies = Some(RvcV2Dependencies::setup()?);
    }

    if scoped_model_type_execution.can_run_job(InferenceModelType::SadTalker)
        || scoped_job_type_execution.can_run_job(InferenceJobType::SadTalker)
    {
      print_with_space("Setting SadTalker dependencies...");
      maybe_sad_talker_dependencies = Some(SadTalkerDependencies::setup()?);
    }

    if scoped_model_type_execution.can_run_job(InferenceModelType::SoVitsSvc)
        || scoped_job_type_execution.can_run_job(InferenceJobType::SoVitsSvc)
    {
      print_with_space("Setting SVC dependencies...");
      maybe_svc_dependencies = Some(SvcDependencies::setup()?);
    }

    if scoped_model_type_execution.can_run_job(InferenceModelType::Tacotron2)
        || scoped_job_type_execution.can_run_job(InferenceJobType::Tacotron2)
    {
      print_with_space("Setting Tacotron2 dependencies...");
      maybe_tacotron2_dependencies = Some(Tacotron2Dependencies::setup()?);
    }

    if scoped_model_type_execution.can_run_job(InferenceModelType::VallEX) {
      print_with_space("Setting VALL-E-X dependencies...");
      maybe_vall_e_x_dependencies = Some(VallExDependencies::setup()?);
    }

    if scoped_model_type_execution.can_run_job(InferenceModelType::StyleTTS2)
        || scoped_job_type_execution.can_run_job(InferenceJobType::StyleTTS2)
    {
      print_with_space("Setting StyleTTS2 dependencies...");
      maybe_styletts2_dependencies = Some(StyleTTS2Dependencies::setup()?);
    }

    if scoped_model_type_execution.can_run_job(InferenceModelType::Vits) {
      print_with_space("Setting Vits dependencies...");
      maybe_vits_dependencies = Some(VitsDependencies::setup()?);
    }

    if scoped_model_type_execution.can_run_job(InferenceModelType::RerenderAVideo) {
      print_with_space("Setting Rerender dependencies...");
      maybe_rerender_dependencies = Some(RerenderDependencies::setup()?);
    }

    if scoped_model_type_execution.can_run_job(InferenceModelType::StableDiffusion) {
      print_with_space("Setting Stable Diffusion dependencies...");
      maybe_stable_diffusion_dependencies = Some(StableDiffusionDependencies::setup()?);
    }

    if scoped_model_type_execution.can_run_job(InferenceModelType::MocapNet) {
      print_with_space("Setting MocapNet dependencies...");
      maybe_mocapnet_dependencies = Some(MocapNetDependencies::setup()?);
    }

    if scoped_model_type_execution.can_run_job(InferenceModelType::ConvertFbxToGltf) {
      print_with_space("Setting ConvertFbxToGltf dependencies...");
      maybe_convert_fbx_to_gltf_dependencies = Some(FbxToGltfDependencies::setup()?);
    }

    if scoped_model_type_execution.can_run_job(InferenceModelType::BvhToWorkflow) {
      print_with_space("Setting ConvertBvhToWorkflow dependencies...");
      maybe_convert_bvh_to_workflow_dependencies = Some(RenderEngineSceneToVideoDependencies::setup()?);
    }

    Ok(JobSpecificDependencies {
      maybe_rvc_v2_dependencies,
      maybe_sad_talker_dependencies,
      maybe_svc_dependencies,
      maybe_tacotron2_dependencies,
      maybe_vall_e_x_dependencies,
      maybe_vits_dependencies,
      maybe_rerender_dependencies,
      maybe_stable_diffusion_dependencies,
      maybe_mocapnet_dependencies,
      maybe_styletts2_dependencies,
      maybe_comfy_ui_dependencies,
      maybe_convert_fbx_to_gltf_dependencies,
      maybe_convert_bvh_to_workflow_dependencies,
      maybe_gpt_sovits_dependencies,
      maybe_f5_tts_dependencies,
      maybe_seed_vc_dependencies,
    })
  }
}

fn print_with_space(line: &str) {
  println!("\n  ---------- \n  {line} \n  ---------- \n");
}
