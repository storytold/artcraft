use anyhow::anyhow;

use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs;
use mysql_queries::payloads::generic_inference_args::inner_payloads::image_generation_payload::StableDiffusionArgs;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::image_generation::sd::process_job_inference::process_job_inference;
use crate::job::job_types::image_generation::sd::process_job_lora_upload::process_job_lora_upload;
use crate::job::job_types::image_generation::sd::process_job_sd_upload::process_job_sd_upload;
use crate::state::job_dependencies::JobDependencies;
use crate::util::extractors::get_polymorphic_args_from_job::get_polymorphic_args_from_job;

pub struct StableDiffusionProcessArgs<'a> {
    pub job_dependencies: &'a JobDependencies,
    pub job: &'a AvailableInferenceJob,
}

// run inference
// insert record into the db with the inference job token complete.
pub async fn sd_args_from_job(
    args: &StableDiffusionProcessArgs<'_>
) -> Result<StableDiffusionArgs, ProcessSingleJobError> {

    let polymorphic_args = get_polymorphic_args_from_job(&args.job)?;

    let sd_args = match polymorphic_args {
        PolymorphicInferenceArgs::Ig(args) => args,
        _ => {
            return Err(
                ProcessSingleJobError::from_anyhow_error(anyhow!("wrong inner args for job!"))
            );
        }
    };
 
    let stable_diffusion_args: StableDiffusionArgs = StableDiffusionArgs::from(sd_args.clone());
    Ok(stable_diffusion_args)
}

// store the prompt and cluster them today.
pub async fn process_job_selection(
    args: StableDiffusionProcessArgs<'_>
) -> Result<JobSuccessResult, ProcessSingleJobError> {
    let sd_args = sd_args_from_job(&args).await?;

    if sd_args.type_of_inference == "inference" {
        process_job_inference(&args).await
    } else if sd_args.type_of_inference == "lora" {
        process_job_lora_upload(&args).await
    } else if sd_args.type_of_inference == "model" {
        process_job_sd_upload(&args).await
    } else {
        Err(ProcessSingleJobError::Other(anyhow!("inference type doesn't exist!")))
    }
}


#[ignore]
#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use anyhow::anyhow;
    use bucket_paths::legacy::remote_file_manager_paths::remote_cloud_bucket_details::RemoteCloudBucketDetails;
    use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
    use errors::AnyhowResult;

    #[ignore]
    #[tokio::test]
    async fn test_seed_weights_files() -> AnyhowResult<()> {
        let seed_path = PathBuf::from("/storyteller/root/custom-seed-tool-data");
        let remote_cloud_file_client = RemoteCloudFileClient::get_remote_cloud_file_client().await;
        let remote_cloud_file_client = match remote_cloud_file_client {
            Ok(res) => { res }
            Err(_) => {
                return Err(anyhow!("failed to get remote cloud file client"));
            }
        };

        let mut path_dl1 = seed_path.clone();
        path_dl1.push("downloads/loRA");
        let mut path_dl2 = seed_path.clone();
        path_dl2.push("downloads/checkpoint");

        let bucket_details1 = RemoteCloudBucketDetails {
            object_hash: String::from("apa0ej6es8d3ss2gwtf1cghge35qn9tn"),
            prefix: String::from("sd15"),
            suffix: String::from("safetensors"),
        };

        let bucket_details2 = RemoteCloudBucketDetails {
            object_hash: String::from("27kz11et18fargyyxbj66ntfn621k9d3"),
            prefix: String::from("loRA"),
            suffix: String::from("safetensors"),
        };

        remote_cloud_file_client.download_file(
            bucket_details1,
            String::from("./checkpoint")
        ).await?;
        remote_cloud_file_client.download_file(bucket_details2, String::from("./loRA")).await?;

        Ok(())
    }
}

// /**
//  *
//  *
//  * @CrossProduct this shows the batch table usage: https://github.com/storytold/storyteller-rust/blob/master/crates/schema/database/mysql_queries/src/queries/batch_generations/insert_batch_generation_records.rs#L83-L96
// I wrote a test to show how you can insert multiple media file tokens into the table at once
// I tested and it works:

// mysql> select * from batch_generations;
// +----+----------------------------------+-------------+--------------+---------------------+---------------------+
// | id | token                            | entity_type | entity_token | created_at          | updated_at          |
// +----+----------------------------------+-------------+--------------+---------------------+---------------------+
// |  4 | batch_g_25dgzw53jdwgvesgdb48bam6 | media_file  | media_foo    | 2024-01-17 02:18:52 | 2024-01-17 02:18:52 |
// |  5 | batch_g_25dgzw53jdwgvesgdb48bam6 | media_file  | media_bar    | 2024-01-17 02:18:52 | 2024-01-17 02:18:52 |
// |  6 | batch_g_25dgzw53jdwgvesgdb48bam6 | media_file  | media_baz    | 2024-01-17 02:18:52 | 2024-01-17 02:18:52 |
// |  7 | batch_g_79a2evktmnqbn9sq3k3eybze | media_file  | media_foo    | 2024-01-17 02:20:32 | 2024-01-17 02:20:32 |
// |  8 | batch_g_79a2evktmnqbn9sq3k3eybze | media_file  | media_bar    | 2024-01-17 02:20:32 | 2024-01-17 02:20:32 |
// |  9 | batch_g_79a2evktmnqbn9sq3k3eybze | media_file  | media_baz    | 2024-01-17 02:20:32 | 2024-01-17 02:20:32 |
// +----+----------------------------------+-------------+--------------+---------------------+---------------------+
// 6 rows in set (0.00 sec)

// (I ran the test twice, which is why there are two separate batches of the same media file tokens)
// I'll write an endpoint, probably something like:

// GET api.fakeyou.com/v1/batches/{batch_token}

// That will return a list of all the media files in the batch.

// We can create a page around this. ALso, we can have a separate endpoint that looks up all the other files in a batch (if you're starting on a given media file page), so that you can show thumbnails of related generations on a media file page.
//  */
