#[ignore]
#[cfg(test)]
mod tests {
    use anyhow::Ok;
    use rand::Rng;
    use serial_test::serial;
    use sqlx::mysql::MySqlPoolOptions;
    use sqlx::MySqlPool;
    use tokio;

    // common tests
    use enums_db::by_table::model_weights::weights_category::WeightsCategory;
    use enums_db::by_table::model_weights::weights_types::WeightsType;
    use enums_db::common::view_as::ViewAs;
    use enums_db::common::visibility::Visibility;
    use errors::AnyhowResult;
    use tokens::tokens::{model_weights::ModelWeightToken, users::UserToken};

    use crate::config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
    use crate::queries::model_weights::create::create_weight::create_weight;
    use crate::queries::model_weights::create::create_weight::CreateModelWeightsArgs;
    use crate::queries::model_weights::delete_weights::{
        delete_weights_as_mod,
        delete_weights_as_user,
        undelete_weights_as_mod,
        undelete_weights_as_user,
    };
    use crate::queries::model_weights::get::get_weight::get_weight_by_token;
    use crate::queries::model_weights::list::list_weights_by_user::{list_weights_by_creator_username, ListWeightsForUserArgs};
    use crate::queries::model_weights::list::list_weights_query_builder::ListWeightsQueryBuilder;
    use crate::queries::users::user::get::get_user_token_by_username::get_user_token_by_username;

    async fn setup() -> sqlx::Pool<sqlx::MySql> {
        println!("Dropping database model_weights");

        let db_connection_string = DEFAULT_MYSQL_CONNECTION_STRING;
        let pool = MySqlPoolOptions::new()
            .max_connections(3)
            .connect(&db_connection_string).await
            .unwrap();
        // delete everything that exists in the database
        delete_all_weights_for_table(&pool).await.unwrap();
        pool
    }

    pub async fn delete_all_weights_for_table(mysql_pool: &MySqlPool) -> AnyhowResult<()> {
        // write a query that deletes all weights
        let _r = sqlx::query("DELETE FROM model_weights").execute(mysql_pool).await?;
        Ok(())
    }

    #[ignore]
    #[tokio::test]
    #[serial]
    async fn test_create_weights() -> AnyhowResult<()> {
        let pool = setup().await;
        // create a random token for the model weight
        let mut rng = rand::thread_rng();
        let random_number: u32 = rng.gen();
        let model_weight_token1 = ModelWeightToken(random_number.to_string());

        let creator_token1 = UserToken("creatorToken!1".to_string());

        let args = CreateModelWeightsArgs {
            token: &model_weight_token1, // replace with actual ModelWeightToken
            weights_type: WeightsType::RvcV2, // replace with actual WeightsType
            weights_category: WeightsCategory::VoiceConversion, // replace with actual WeightsCategory
            title: "Title 1".to_string(),
            maybe_cover_image_media_file_token: None,
            maybe_description_markdown: Some("Description 1".to_string()),
            maybe_description_rendered_html: Some("<p>Description 1</p>".to_string()),
            creator_user_token: Some(&creator_token1), // replace with actual UserToken
            creator_ip_address: "192.168.1.1",
            creator_set_visibility: Visibility::Public,
            maybe_last_update_user_token: Some("Last Update User Token 1".to_string()),
            original_download_url: Some("http://example.com/download1".to_string()),
            original_filename: Some("filename1.txt".to_string()),
            file_size_bytes: 1024,
            file_checksum_sha2: "checksum1".to_string(),
            public_bucket_hash: "bucket_hash1".to_string(),
            maybe_public_bucket_prefix: Some("_fake".to_string()),
            maybe_public_bucket_extension: Some("rvc".to_string()),
            //cached_user_ratings_total_count: 10,
            //cached_user_ratings_positive_count: 9,
            //cached_user_ratings_negative_count: 1,
            //maybe_cached_user_ratings_ratio: Some(0.9),
            version: 1,
            mysql_pool: &pool, // replace with actual MySqlPool
        };

        create_weight(args).await?;

        let result = get_weight_by_token(&model_weight_token1, false, &pool).await?;

        let result = result.unwrap();

        // check if the result is the same as the args
        assert_eq!(result.token, model_weight_token1);
        assert_eq!(result.title, "Title 1".to_string());
        assert_eq!(result.weights_type, WeightsType::RvcV2);
        assert_eq!(result.weights_category, WeightsCategory::VoiceConversion);
        assert_eq!(result.maybe_description_markdown, Some("Description 1".to_string()));
        assert_eq!(result.maybe_description_rendered_html, Some("<p>Description 1</p>".to_string()));
        assert_eq!(result.creator_user_token, creator_token1);
        assert_eq!(result.creator_ip_address, "192.168.1.1".to_string());
        assert_eq!(result.creator_set_visibility, Visibility::Public);
        assert_eq!(
            result.maybe_last_update_user_token,
            Some(UserToken("Last Update User Token 1".to_string()))
        );
        assert_eq!(result.original_download_url, Some("http://example.com/download1".to_string()));
        assert_eq!(result.original_filename, Some("filename1.txt".to_string()));
        assert_eq!(result.file_size_bytes, 1024);
        assert_eq!(result.file_checksum_sha2, "checksum1".to_string());
        assert_eq!(result.public_bucket_hash, "bucket_hash1".to_string());
        assert_eq!(result.maybe_public_bucket_prefix, Some("_fake".to_string()));
        assert_eq!(result.maybe_public_bucket_extension, Some("rvc".to_string()));
        assert_eq!(result.version, 1);

        Ok(())
    }

    #[ignore]
    #[tokio::test]
    #[serial]
    async fn test_delete_and_undelete_weights_user() -> AnyhowResult<()> {
        let pool = setup().await;
        // create a random token for the model weight
        let mut rng = rand::thread_rng();
        let random_number: u32 = rng.gen();
        let model_weight_token1 = ModelWeightToken(random_number.to_string());

        let creator_token1 = UserToken("creatorToken!1".to_string());

        let args = CreateModelWeightsArgs {
            token: &model_weight_token1, // replace with actual ModelWeightToken
            weights_type: WeightsType::RvcV2, // replace with actual WeightsType
            weights_category: WeightsCategory::VoiceConversion, // replace with actual WeightsCategory
            title: "Title 1".to_string(),
            maybe_cover_image_media_file_token: None,
            maybe_description_markdown: Some("Description 1".to_string()),
            maybe_description_rendered_html: Some("<p>Description 1</p>".to_string()),
            creator_user_token: Some(&creator_token1), // replace with actual UserToken
            creator_ip_address: "192.168.1.1",
            creator_set_visibility: Visibility::Public,
            maybe_last_update_user_token: Some("Last Update User Token 1".to_string()),
            original_download_url: Some("http://example.com/download1".to_string()),
            original_filename: Some("filename1.txt".to_string()),
            file_size_bytes: 1024,
            file_checksum_sha2: "checksum1".to_string(),
            public_bucket_hash: "bucket_hash1".to_string(),
            maybe_public_bucket_prefix: Some("_fake".to_string()),
            maybe_public_bucket_extension: Some("rvc".to_string()),
            //cached_user_ratings_total_count: 10,
            //cached_user_ratings_positive_count: 9,
            //cached_user_ratings_negative_count: 1,
            //maybe_cached_user_ratings_ratio: Some(0.9),
            version: 1,
            mysql_pool: &pool, // replace with actual MySqlPool
        };

        create_weight(args).await?;

        delete_weights_as_user(&model_weight_token1, &pool).await?;

        let result = get_weight_by_token(&model_weight_token1, true, &pool).await?;
        let result = result.unwrap();

        match result.user_deleted_at {
            Some(date) => {
                // `date` is the unwrapped value
                // You can use `date` here
                assert!(true, "user_deleted_at is Some");
            }
            None => {
                // Handle the case where `user_deleted_at` is None
                assert!(false, "user_deleted_at is None");
            }
        }

        undelete_weights_as_user(&model_weight_token1, &pool).await?;
        let result = get_weight_by_token(&model_weight_token1, true, &pool).await?;
        let result = result.unwrap();

        match result.user_deleted_at {
            Some(date) => {
                // `date` is the unwrapped value
                // You can use `date` here
                assert!(false, "user_deleted_at is Some");
            }
            None => {
                // Handle the case where `user_deleted_at` is None
                assert!(true, "user_deleted_at is None");
            }
        }

        Ok(())
    }

    #[ignore]
    #[tokio::test]
    #[serial]
    async fn test_delete_and_undelete_weights_mod() -> AnyhowResult<()> {
        let mut rng = rand::thread_rng();
        let random_number: u32 = rng.gen();
        let model_weight_token1 = ModelWeightToken(random_number.to_string());

        let pool = setup().await;
        // create a random token for the model weight

        let creator_token1 = UserToken("creatorToken!1".to_string());

        let args = CreateModelWeightsArgs {
            token: &model_weight_token1, // replace with actual ModelWeightToken
            weights_type: WeightsType::RvcV2, // replace with actual WeightsType
            weights_category: WeightsCategory::VoiceConversion, // replace with actual WeightsCategory
            title: "Title 1".to_string(),
            maybe_cover_image_media_file_token: None,
            maybe_description_markdown: Some("Description 1".to_string()),
            maybe_description_rendered_html: Some("<p>Description 1</p>".to_string()),
            creator_user_token: Some(&creator_token1), // replace with actual UserToken
            creator_ip_address: "192.168.1.1",
            creator_set_visibility: Visibility::Public,
            maybe_last_update_user_token: Some("Last Update User Token 1".to_string()),
            original_download_url: Some("http://example.com/download1".to_string()),
            original_filename: Some("filename1.txt".to_string()),
            file_size_bytes: 1024,
            file_checksum_sha2: "checksum1".to_string(),
            public_bucket_hash: "bucket_hash1".to_string(),
            maybe_public_bucket_prefix: Some("_fake".to_string()),
            maybe_public_bucket_extension: Some("rvc".to_string()),
            //cached_user_ratings_total_count: 10,
            //cached_user_ratings_positive_count: 9,
            //cached_user_ratings_negative_count: 1,
            //maybe_cached_user_ratings_ratio: Some(0.9),
            version: 1,
            mysql_pool: &pool, // replace with actual MySqlPool
        };

        create_weight(args).await?;
        delete_weights_as_mod(&model_weight_token1, &pool).await?;
        let result = get_weight_by_token(&model_weight_token1, true, &pool).await?;
        let result = result.unwrap();

        match result.mod_deleted_at {
            Some(date) => {
                // `date` is the unwrapped value
                // You can use `date` here
                assert!(true, "mod_deleted_at is Some");
            }
            None => {
                // Handle the case where `user_deleted_at` is None
                assert!(false, "mod_deleted_at is None");
            }
        }

        undelete_weights_as_mod(&model_weight_token1, &pool).await?;
        let result = get_weight_by_token(&model_weight_token1, true, &pool).await?;
        let result = result.unwrap();

        match result.mod_deleted_at {
            Some(date) => {
                // `date` is the unwrapped value
                // You can use `date` here
                assert!(false, "mod_deleted is Some");
            }
            None => {
                // Handle the case where `mod_deleted` is None
                assert!(true, "mod_deleted is None");
            }
        }

        Ok(())
    }

    #[ignore]
    #[tokio::test]
    #[serial]
    async fn list_all_weights_by_user() -> AnyhowResult<()> {
        let pool = setup().await;

        let creator_username = "hanashi".to_string();
        let view_as = ViewAs::Moderator;

        seed_weights_with_category_and_type(
            WeightsType::LoRA,
            WeightsCategory::ImageGeneration,
            5,
            &creator_username
        ).await?;

        let weights_by_username = list_weights_by_creator_username(ListWeightsForUserArgs {
            creator_username: &creator_username,
            page_size: 0,
            page_index: 0,
            sort_ascending: false,
            view_as,
            maybe_scoped_weight_type: None,
            maybe_scoped_weight_category: None,
            mysql_pool: &pool,
        }).await?;
        for weight in weights_by_username.records.iter() {
            // print weight
            println!("weight: {:?}", weight.creator_username);
        }
        assert_eq!(weights_by_username.records.len(), 5);

        Ok(())
    }

    async fn seed_weights_with_category_and_type(
        weights_type: WeightsType,
        weights_category: WeightsCategory,
        number_of_items: u32,
        creator_username: &str
    ) -> AnyhowResult<()> {
        let pool = setup().await;
        let creator_token = get_user_token_by_username(
            &creator_username,
            &pool
        ).await?.unwrap_or_else(||
            panic!("Could not find user with username {}", creator_username)
        );

        for i in 0..number_of_items {
            let mut rng = rand::thread_rng();
            let number: u32 = rng.gen();

            let model_weight_token = ModelWeightToken(number.to_string());

            let args = CreateModelWeightsArgs {
                token: &model_weight_token, // replace with actual ModelWeightToken
                weights_type, // replace with actual WeightsType
                weights_category, // replace with actual WeightsCategory
                title: format!("Title {}", i),
                maybe_cover_image_media_file_token: None,
                maybe_description_markdown: Some(format!("Description {}", i)),
                maybe_description_rendered_html: Some(format!("<p>Description {}</p>", i)),
                creator_user_token: Some(&creator_token), // replace with actual UserToken
                creator_ip_address: "192.168.1.1",
                creator_set_visibility: Visibility::Public,
                maybe_last_update_user_token: Some(format!("Last Update User Token {}", i)),
                original_download_url: Some(format!("http://example.com/download{}", i)),
                original_filename: Some(format!("filename {}.txt", i)),
                file_size_bytes: 1024,
                file_checksum_sha2: format!("checksum{}", i),
                public_bucket_hash: format!("bucket_hash{}", i),
                maybe_public_bucket_prefix: Some("_fake".to_string()),
                maybe_public_bucket_extension: Some("rvc".to_string()),
                //cached_user_ratings_total_count: 10,
                //cached_user_ratings_positive_count: 9,
                //cached_user_ratings_negative_count: 1,
                //maybe_cached_user_ratings_ratio: Some(0.9),
                version: 1,
                mysql_pool: &pool, // replace with actual MySqlPool
            };

            create_weight(args).await?;
        }

        Ok(())
    }

    // Tests paging for the list weights query builder
    #[ignore]
    #[tokio::test]
    #[serial]
    async fn list_weights_query_build_test_paging() -> AnyhowResult<()> {
        let pool = setup().await;
        let creator_username = "hanashi".to_string();

        seed_weights_with_category_and_type(
            WeightsType::LoRA,
            WeightsCategory::ImageGeneration,
            20,
            &creator_username
        ).await?;

        let qb = ListWeightsQueryBuilder::new()
            .offset(Some(0))
            .weights_type(Some(WeightsType::LoRA))
            .weights_category(Some(WeightsCategory::ImageGeneration))
            .limit(10)
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false);

        let result = qb.perform_query_for_page(&pool).await?;

        // let result = qb.perform_query_for_page(&pool).await?;
        assert_eq!(result.weights.len(), 10);

        let qb = ListWeightsQueryBuilder::new()
            .weights_type(Some(WeightsType::LoRA))
            .weights_category(Some(WeightsCategory::ImageGeneration))
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false)
            .offset(Some(10))
            .limit(10);

        let result = qb.perform_query_for_page(&pool).await?;

        assert_eq!(result.weights.len(), 10);

        let qb = ListWeightsQueryBuilder::new()
            .weights_type(Some(WeightsType::LoRA))
            .weights_category(Some(WeightsCategory::ImageGeneration))
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false)
            .offset(Some(10))
            .limit(10);

        let result = qb.perform_query_for_page(&pool).await?;

        assert_eq!(result.weights.len(), 10);

        Ok(())
    }

    #[ignore]
    #[tokio::test]
    #[serial]
    async fn list_weights_query_build_test_asc_desc_cursor_reverse() -> AnyhowResult<()> {
        let pool = setup().await;
        let creator_username = "hanashi".to_string();

        seed_weights_with_category_and_type(
            WeightsType::LoRA,
            WeightsCategory::ImageGeneration,
            10,
            &creator_username
        ).await?;

        let qb = ListWeightsQueryBuilder::new()
            .offset(Some(0))
            .weights_type(Some(WeightsType::LoRA))
            .weights_category(Some(WeightsCategory::ImageGeneration))
            .limit(10)
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false)
            .sort_ascending(true)
            .cursor_is_reversed(false);

        let result = qb.perform_query_for_page(&pool).await?;

        // write code that will loop through the result and check if the ids are in ascending order
        let mut previous_id = 0;
        for weight in result.weights.iter() {
            let current_id = weight.weight_id;
            assert!(current_id > previous_id);
            previous_id = current_id;
        }

        let qb = ListWeightsQueryBuilder::new()
            .offset(Some(0))
            .weights_type(Some(WeightsType::LoRA))
            .weights_category(Some(WeightsCategory::ImageGeneration))
            .limit(10)
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false)
            .sort_ascending(false)
            .cursor_is_reversed(true);
        let result = qb.perform_query_for_page(&pool).await?;

        // write code that will loop through the result and check if the ids are in descending order
        let mut previous_id = 10000;
        for weight in result.weights.iter() {
            let current_id = weight.weight_id;
            assert!(current_id < previous_id);
            previous_id = current_id;
        }

        Ok(())
    }

    #[ignore]
    #[tokio::test]
    #[serial]
    // asc and desc tests
    async fn list_weights_query_build_test_asc_desc() -> AnyhowResult<()> {
        let pool = setup().await;
        let creator_username = "hanashi".to_string();

        seed_weights_with_category_and_type(
            WeightsType::LoRA,
            WeightsCategory::ImageGeneration,
            10,
            &creator_username
        ).await?;

        let qb = ListWeightsQueryBuilder::new()
            .offset(Some(0))
            .weights_type(Some(WeightsType::LoRA))
            .weights_category(Some(WeightsCategory::ImageGeneration))
            .limit(10)
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false)
            .sort_ascending(true);
        let result = qb.perform_query_for_page(&pool).await?;

        // write code that will loop through the result and check if the ids are in ascending order
        let mut previous_id = 0;
        for weight in result.weights.iter() {
            let current_id = weight.weight_id;
            assert!(current_id > previous_id);
            previous_id = current_id;
        }

        let qb = ListWeightsQueryBuilder::new()
            .offset(Some(0))
            .weights_type(Some(WeightsType::LoRA))
            .weights_category(Some(WeightsCategory::ImageGeneration))
            .limit(10)
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false)
            .sort_ascending(false);
        let result = qb.perform_query_for_page(&pool).await?;

        // write code that will loop through the result and check if the ids are in descending order

        let mut previous_id = 10000;
        for weight in result.weights.iter() {
            let current_id = weight.weight_id;
            assert!(current_id < previous_id);
            previous_id = current_id;
        }

        Ok(())
    }

    #[ignore]
    #[tokio::test]
    #[serial]
    async fn list_weights_query_build_test() -> AnyhowResult<()> {
        let pool = setup().await;

        let creator_username = "hanashi".to_string();

        let creator_token = get_user_token_by_username(
            &creator_username,
            &pool
        ).await?.unwrap_or_else(||
            panic!("Could not find user with username {}", creator_username)
        );

        for i in 0..6 {
            let weights_type = if i % 5 == 0 {
                WeightsType::Tacotron2
            } else if i % 5 == 1 {
                WeightsType::LoRA
            } else if i % 5 == 2 {
                WeightsType::RvcV2
            } else if i % 5 == 3 {
                WeightsType::StableDiffusionXL
            } else if (i ^ 5) == 4 {
                WeightsType::SoVitsSvc
            } else {
                WeightsType::StableDiffusion15
            };

            let weights_category = if i % 5 == 0 {
                WeightsCategory::TextToSpeech
            } else if i % 5 == 1 {
                WeightsCategory::ImageGeneration
            } else if i % 5 == 2 {
                WeightsCategory::VoiceConversion
            } else if i % 5 == 3 {
                WeightsCategory::ImageGeneration
            } else if (i ^ 5) == 4 {
                WeightsCategory::VoiceConversion
            } else {
                WeightsCategory::ImageGeneration
            };

            let mut rng = rand::thread_rng();
            let number: u32 = rng.gen();

            let model_weight_token = ModelWeightToken(number.to_string());

            let args = CreateModelWeightsArgs {
                token: &model_weight_token, // replace with actual ModelWeightToken
                weights_type, // replace with actual WeightsType
                weights_category, // replace with actual WeightsCategory
                title: format!("Title {}", i),
                maybe_cover_image_media_file_token: None,
                maybe_description_markdown: Some(format!("Description {}", i)),
                maybe_description_rendered_html: Some(format!("<p>Description {}</p>", i)),
                creator_user_token: Some(&creator_token), // replace with actual UserToken
                creator_ip_address: "192.168.1.1",
                creator_set_visibility: Visibility::Public,
                maybe_last_update_user_token: Some(format!("Last Update User Token {}", i)),
                original_download_url: Some(format!("http://example.com/download{}", i)),
                original_filename: Some(format!("filename {}.txt", i)),
                file_size_bytes: 1024,
                file_checksum_sha2: format!("checksum{}", i),
                public_bucket_hash: format!("bucket_hash{}", i),
                maybe_public_bucket_prefix: Some("_fake".to_string()),
                maybe_public_bucket_extension: Some("rvc".to_string()),
                //cached_user_ratings_total_count: 10,
                //cached_user_ratings_positive_count: 9,
                //cached_user_ratings_negative_count: 1,
                //maybe_cached_user_ratings_ratio: Some(0.9),
                version: 1,
                mysql_pool: &pool, // replace with actual MySqlPool
            };

            create_weight(args).await?;
        }

        // try a query with all the filters
        let qb = ListWeightsQueryBuilder::new()
            .weights_type(Some(WeightsType::Tacotron2))
            .weights_category(Some(WeightsCategory::TextToSpeech))
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false);

        let result = qb.perform_query_for_page(&pool).await?;

        assert_eq!(result.weights.len(), 2);

        let qb = ListWeightsQueryBuilder::new()
            .weights_type(Some(WeightsType::LoRA))
            .weights_category(Some(WeightsCategory::ImageGeneration))
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false);

        let result = qb.perform_query_for_page(&pool).await?;

        assert_eq!(result.weights.len(), 1);
        assert_eq!(result.weights[0].weights_category, WeightsCategory::ImageGeneration);
        assert_eq!(result.weights[0].weights_type, WeightsType::LoRA);

        Ok(())
    }

    #[ignore]
    #[tokio::test]
    #[serial]
    async fn list_weights_query_builder_page_type_and_category() -> AnyhowResult<()> {
        let db_connection_string = DEFAULT_MYSQL_CONNECTION_STRING;
        let pool = MySqlPoolOptions::new()
            .max_connections(3)
            .connect(&db_connection_string).await
            .unwrap();
        // using the seeded weights from the previous test
        let creator_username = "hanashi".to_string();

        for i in 0..4 {
            let weights_types = vec![
                WeightsType::HifiganTacotron2,
                WeightsType::LoRA,
                WeightsType::RvcV2,
                WeightsType::StableDiffusionXL
            ];

            let weights_type = weights_types[i as usize];

            let qb = ListWeightsQueryBuilder::new()
                .weights_type(Some(weights_type))
                .scope_creator_username(Some("hanashi"))
                .include_user_deleted_results(false);

            println!("weights_type: {:?}", weights_type);
            let result = qb.perform_query_for_page(&pool).await?;
            assert_eq!(result.weights.len(), 20, "Should be 20 weights");
            assert_eq!(
                result.weights[0].weights_type,
                weights_type,
                "Should be the same weights type"
            );
        }

        Ok(())
    }

    #[ignore]
    #[tokio::test]
    #[serial]
    async fn list_weight_query_builder_all() -> AnyhowResult<()> {
        let db_connection_string = DEFAULT_MYSQL_CONNECTION_STRING;
        let pool = MySqlPoolOptions::new()
            .max_connections(3)
            .connect(&db_connection_string).await
            .unwrap();

        let qb = ListWeightsQueryBuilder::new()
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false)
            .limit(11);

        let result = qb.perform_query_for_page(&pool).await?;
        assert_eq!(result.weights.len(), 11);
        Ok(())
    }

    #[ignore]
    #[tokio::test]
    #[serial]
    async fn list_limits() -> AnyhowResult<()> {
        let db_connection_string = DEFAULT_MYSQL_CONNECTION_STRING;

        let pool = MySqlPoolOptions::new()
            .max_connections(3)
            .connect(&db_connection_string).await
            .unwrap();

        let qb = ListWeightsQueryBuilder::new()
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false)
            .weights_category(Some(WeightsCategory::ImageGeneration))
            .limit(10);

        let result = qb.perform_query_for_page(&pool).await?;

        assert_eq!(result.weights.len(), 10);
        assert_eq!(result.weights[0].weights_category, WeightsCategory::ImageGeneration);

        let qb = ListWeightsQueryBuilder::new()
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false);

        let result = qb.perform_query_for_page(&pool).await?;

        // by default 25
        assert_eq!(result.weights.len(), 25);
        assert_eq!(result.weights[0].weights_category, WeightsCategory::ImageGeneration);
        // over query limit
        let qb: ListWeightsQueryBuilder = ListWeightsQueryBuilder::new()
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false)
            .weights_category(Some(WeightsCategory::ImageGeneration))
            .limit(80);
        let result = qb.perform_query_for_page(&pool).await?;
        assert_eq!(result.weights.len(), 60);
        // pick a random value in here
        assert_eq!(result.weights[9].weights_category, WeightsCategory::ImageGeneration);
        Ok(())
    }

    #[ignore]
    #[tokio::test]
    #[serial]
    async fn page_across_a_category() -> AnyhowResult<()> {
        // paging across a category and it works
        let db_connection_string = DEFAULT_MYSQL_CONNECTION_STRING;
        // how we implement paging.
        let page:u16 = 0;
        let page_size: u16 = 20;

        let pool = MySqlPoolOptions::new()
            .max_connections(3)
            .connect(&db_connection_string).await
            .unwrap();

        let qb = ListWeightsQueryBuilder::new()
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false)
            .weights_category(Some(WeightsCategory::ImageGeneration))
            .sort_ascending(true)
            .limit(page_size);

        let result = qb.perform_query_for_page(&pool).await?;
        assert_eq!(result.weights.len(), page_size as usize);
        assert_eq!(result.weights[0].weights_category, WeightsCategory::ImageGeneration);

        let page = 1;
        let offset = page * page_size;

        assert_eq!(result.weights.len(), page_size as usize);
        assert_eq!(result.weights[0].weights_category, WeightsCategory::ImageGeneration);
        

        let qb = ListWeightsQueryBuilder::new()
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false)
            .weights_category(Some(WeightsCategory::ImageGeneration))
            .limit(page_size)
            .sort_ascending(true)
            .offset(Some(offset.into()));
        
        let result = qb.perform_query_for_page(&pool).await?;

        let page = 2;
        let offset = page * page_size;

        assert_eq!(result.weights.len(), page_size as usize);
        assert_eq!(result.weights[0].weights_category, WeightsCategory::ImageGeneration);

        let qb = ListWeightsQueryBuilder::new()
            .scope_creator_username(Some("hanashi"))
            .include_user_deleted_results(false)
            .sort_ascending(true)
            .weights_category(Some(WeightsCategory::ImageGeneration))
            .limit(page_size)
            .offset(Some(offset.into()));

        let result = qb.perform_query_for_page(&pool).await?;

        assert_eq!(result.weights.len(), page_size as usize);
        assert_eq!(result.weights[0].weights_category, WeightsCategory::ImageGeneration);

        Ok(())
    }
}
