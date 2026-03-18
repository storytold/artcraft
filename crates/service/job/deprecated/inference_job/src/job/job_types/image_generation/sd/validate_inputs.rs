use anyhow::anyhow;

use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs;
use mysql_queries::payloads::generic_inference_args::inner_payloads::image_generation_payload::StableDiffusionArgs;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::image_generation::sd::process_job::StableDiffusionProcessArgs;
use crate::util::extractors::get_polymorphic_args_from_job::get_polymorphic_args_from_job;

pub async fn validate_inputs(args: StableDiffusionProcessArgs<'_>) -> Result<(), ProcessSingleJobError> {

    let polymorphic_args = get_polymorphic_args_from_job(&args.job)?;

    let sd_args = match polymorphic_args {
        PolymorphicInferenceArgs::Ig(args) => args,
        _ => {
            return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("wrong inner args for job!")));
        }
    };

    let stable_diffusion_args: StableDiffusionArgs = StableDiffusionArgs::from(sd_args.clone());

    if stable_diffusion_args.type_of_inference == "checkpoint" {
        
    } else if stable_diffusion_args.type_of_inference == "lora" {

    } else if stable_diffusion_args.type_of_inference == "inference" {
        
    } else {
        return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("wrong inference type for job!")));
    }

    Ok(())
}
