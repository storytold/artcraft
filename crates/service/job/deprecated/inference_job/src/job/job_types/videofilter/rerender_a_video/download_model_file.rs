use std::path::PathBuf;

use anyhow::anyhow;
use tempdir::TempDir;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::bucket_client::BucketClient;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporter;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::model_weights::get::get_weight::RetrievedModelWeight;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::util::downloaders::maybe_download_file_from_bucket::{maybe_download_file_from_bucket, MaybeDownloadArgs};
use crate::util::filesystem::scoped_temp_dir_creator::ScopedTempDirCreator;

pub struct ModelFile {
    pub filesystem_path: PathBuf,
}
// TODO replace this with remote cloud file manager.
pub async fn download_model_file(
    model_record: &Option<RetrievedModelWeight>,
    public_bucket_client: &BucketClient,
    job_progress_reporter: &mut Box<dyn JobProgressReporter>,
    job: &AvailableInferenceJob,
    temp_dir_creator: &ScopedTempDirCreator,
    work_temp_dir: &TempDir,
) -> Result<ModelFile, ProcessSingleJobError> {

    let bucket_object_path;
    let model_filename;
    match model_record {
        Some(model_record) => {
            let model_bucket_path =
                MediaFileBucketPath::from_object_hash(
                    &model_record.public_bucket_hash,
                    model_record.maybe_public_bucket_prefix.as_deref(),
                    model_record.maybe_public_bucket_extension.as_deref(),
                );
            let base_name = &model_record.public_bucket_hash;
            let extension = model_record.maybe_public_bucket_extension.as_deref().unwrap_or("bin");
            model_filename = format!("{base_name}.{extension}");
            bucket_object_path = model_bucket_path.to_full_object_pathbuf();
        }
        None => {
            return Err(ProcessSingleJobError::from_anyhow_error(
                anyhow!("could not find model file")))
        }
    };
    let downloaded_filesystem_path = work_temp_dir.path().join(model_filename);

    maybe_download_file_from_bucket(MaybeDownloadArgs {
        name_or_description_of_file: "model file",
        final_filesystem_file_path: &downloaded_filesystem_path,
        bucket_object_path: &bucket_object_path,
        bucket_client: public_bucket_client,
        job_progress_reporter,
        job_progress_update_description: "downloading",
        job_id: job.id.0,
        scoped_tempdir_creator: &temp_dir_creator,
        maybe_existing_file_minimum_size_required: None,
    }).await?;

    Ok(ModelFile {
        filesystem_path: downloaded_filesystem_path,
    })
}
