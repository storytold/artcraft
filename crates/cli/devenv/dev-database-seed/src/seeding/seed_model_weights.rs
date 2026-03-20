use enums_db::by_table::model_weights::weights_types::WeightsType;
use std::path::Path;
use std::result::Result::Ok;

use log::info;
use rand::Rng;
use sqlx::{MySql, Pool};

use bucket_paths::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;
use enums::{
  common::visibility::Visibility,
};
use errors::{anyhow, AnyhowResult};
use filesys::file_read_bytes::file_read_bytes;
use filesys::file_size::file_size;
use filesys::path_to_string::path_to_string;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mimetypes::mimetype_for_bytes::get_mimetype_for_bytes;
use mysql_queries::queries::model_weights::create::create_weight::{
  create_weight,
  CreateModelWeightsArgs,
};
use storyteller_root::get_seed_tool_data_root;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

use crate::bucket_clients::BucketClients;
use crate::seeding::users::HANASHI_USER_TOKEN;

pub async fn seed_weights_files(
    mysql_pool: &Pool<MySql>,
    maybe_bucket_clients: Option<&BucketClients>
) -> AnyhowResult<()> {
    info!("Seeding weights files...");

    // NB: Stable token generation.
    ModelWeightToken::reset_rng_for_testing_and_dev_seeding_never_use_in_production_seriously(123);

    let seeded_weights = [
        (
            HANASHI_USER_TOKEN,
            "m_21jxt406aattq2cna1xtgf5m4mjyy1",
            WeightsType::LoRA,
            WeightsCategory::ImageGeneration,
            "Niji Mecha",
            "models/imagegen/loRA/nijiMecha.safetensors",
        ),
        (
            HANASHI_USER_TOKEN,
            "m_cxzabpxf88h10rshqraksxbqmhs412",
            WeightsType::StableDiffusion15,
            WeightsCategory::ImageGeneration,
            "Niji Diffused Mix",
            "models/imagegen/sd15/nijidiffusedmix_v40.safetensors",
        ),
        (
            HANASHI_USER_TOKEN,
            "m_21jxt406aattq2cna1xtgf5m4mjyy9",
            WeightsType::LoRA,
            WeightsCategory::ImageGeneration,
            "Niji Mecha",
            "models/imagegen/loRA/nijiMecha.safetensors",
        ),
        (
            HANASHI_USER_TOKEN,
            "m_cxzabpxf88h10rshqraksxbqmhs413",
            WeightsType::StableDiffusion15,
            WeightsCategory::ImageGeneration,
            "Niji Diffused Mix",
            "models/imagegen/sd15/nijidiffusedmix_v40.safetensors",
        ),
    ];

    let seed_tool_data_root = get_seed_tool_data_root();

    for (
        user_token,
        _weights_file_token,
        weights_type,
        weights_category,
        model_name,
        subdirectory_path,
    ) in seeded_weights {
        let user_token = UserToken::new_from_str(user_token);
        // prepare the inputs for a model
        let mut rng = rand::thread_rng();
        let _n: u32 = rng.gen();

        let model_weight_token = ModelWeightToken::generate_for_testing_and_dev_seeding_never_use_in_production_seriously();

        let title = model_name;
        let description = "This is a description";
        let description_rendered_html = "This is a description rendered html";
        let original_filename = "model.safetensors";
        let original_download_url = "https://example.com/model.safetensors";

        // let public_bucket_hash: String = weights_file_token.to_string();
        // let public_bucket_prefix = weights_type.to_string();
        // let public_bucket_extension = weights_category.to_string();

        //let cached_user_ratings_total_count = n.clone();
        //let cached_user_ratings_positive_count = n.clone();
        //let cached_user_ratings_negative_count = n.clone();
        //let cached_user_ratings_ratio = 100.0 as f32;
        let version = 1;

        // get the abs path of the weights file to upload.
        let mut weight_file_path = seed_tool_data_root.clone();
        weight_file_path.push(subdirectory_path);

        let file_size_bytes = file_size(weight_file_path.clone())?;
        let sha256_checksum = sha256_hash_file(weight_file_path.clone())?;
        
        let bucket_details = seed_model(
            &mysql_pool,
            &model_weight_token,
            &user_token,
            weights_type,
            &weight_file_path,
            maybe_bucket_clients
        ).await;
        let bucket_details_data = bucket_details.unwrap();

        let bucket_hash = bucket_details_data.bucket_hash;
        let maybe_bucket_prefix = bucket_details_data.maybe_bucket_prefix.as_deref().unwrap();
        let maybe_bucket_extension = bucket_details_data.maybe_bucket_extension.as_deref().unwrap();

        let create_model_weights_args = CreateModelWeightsArgs {
            token: &model_weight_token,
            weights_type, // Assuming weights_type is defined elsewhere
            weights_category, // Assuming weights_category is defined elsewhere
            title: title.to_string(),
            maybe_cover_image_media_file_token: None,
            maybe_description_markdown: Some(description.to_string()),
            maybe_description_rendered_html: Some(description_rendered_html.to_string()),
            creator_user_token: Some(&user_token),
            creator_ip_address: "127.0.0.1", // Assuming the IP address is localhost
            creator_set_visibility: Visibility::Public, // Assuming the visibility is public
            maybe_last_update_user_token: None, // Assuming there is no last update user token
            original_download_url: Some(original_download_url.to_string()),
            original_filename: Some(original_filename.to_string()),
            file_size_bytes, // Assuming the file size is 0
            file_checksum_sha2: sha256_checksum.to_string(), // Assuming the file checksum is an empty string
            public_bucket_hash: bucket_hash,
            maybe_public_bucket_prefix: Some(maybe_bucket_prefix.to_string()),
            maybe_public_bucket_extension: Some(maybe_bucket_extension.to_string()),
            //cached_user_ratings_total_count,
            //cached_user_ratings_positive_count,
            //cached_user_ratings_negative_count,
            //maybe_cached_user_ratings_ratio: Some(cached_user_ratings_ratio),
            version,
            mysql_pool: &mysql_pool, // Assuming mysql_pool is defined elsewhere
        };

        create_weight(create_model_weights_args).await?;

       
        info!("Seeded {:?}", weight_file_path)
        
    }

    Ok(())
}

#[derive(Clone)]
struct BucketDetails {
    bucket_hash: String,
    maybe_bucket_prefix: Option<String>,
    maybe_bucket_extension: Option<String>,
}

async fn seed_model(
    _mysql_pool: &Pool<MySql>,
    _model_weight_token: &ModelWeightToken,
    _user_token: &UserToken,
    weight_type: WeightsType,
    weight_file_path: &Path,
    maybe_bucket_clients: Option<&BucketClients>
) -> AnyhowResult<BucketDetails> {
    info!("Seeding Media file {:?} ...", weight_file_path);
    // mutable variables
    if let Some(bucket_clients) = maybe_bucket_clients {
        let bucket_details = seed_file_to_bucket(weight_file_path, bucket_clients,weight_type).await?;
        return Ok(bucket_details);
    }
    Err(anyhow!("No bucket clients provided!"))

}

async fn seed_file_to_bucket(
    weight_file_path: &Path,
    bucket_clients: &BucketClients,
    weight_type: WeightsType,
) -> AnyhowResult<BucketDetails> {
    info!("Uploading weights file {:?} ...", weight_file_path);

    let maybe_bucket_prefix = Some(format!("{}_",weight_type.to_str()));
    let maybe_bucket_prefix = maybe_bucket_prefix.as_deref();

    let maybe_bucket_extension = weight_file_path
        .extension()
        .map(|extension| extension.to_str())
        .flatten();
    // we should just have this be file bucket path and then we can use a file descriptor to turn it into a specific type of path
    let bucket_location: WeightFileBucketPath = WeightFileBucketPath::generate_new(
        maybe_bucket_prefix,
        maybe_bucket_extension
    );

    let bucket_path = path_to_string(bucket_location.to_full_object_pathbuf());

    info!("Reading weights file: {:?}", weight_file_path);

    let bytes = file_read_bytes(weight_file_path)?;
    let mimetype = get_mimetype_for_bytes(&bytes).unwrap_or("application/octet-stream");

    info!("Copy this line here! Uploading weights file to bucket path: {:?}", bucket_path);

    let _r = bucket_clients.public.upload_file_with_content_type(
        &bucket_path,
        bytes.as_ref(),
        mimetype
    ).await?;

    Ok(BucketDetails {
        bucket_hash: bucket_location.get_object_hash().to_string(),
        maybe_bucket_prefix: maybe_bucket_prefix.map(|s| s.to_string()),
        maybe_bucket_extension: maybe_bucket_extension.map(|s| s.to_string()),
    })
}


