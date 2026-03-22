use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::by_table::generic_synthetic_ids::id_category::IdCategory;
use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;
use tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken;

use crate::queries::generic_synthetic_ids::transactional_increment_generic_synthetic_id::transactional_increment_generic_synthetic_id;

pub struct UpdateDatasetArgs<'a> {
    pub dataset_token: &'a ZsVoiceDatasetToken,
    pub dataset_title: Option<&'a str>,
    pub maybe_creator_user_token: Option<&'a str>,
    pub creator_ip_address: &'a str,
    pub creator_set_visibility: &'a Visibility,
    pub maybe_mod_user_token: Option<&'a str>,
    pub ietf_language_tag: Option<&'a str>,
    pub ietf_primary_language_subtag: Option<&'a str>,
    pub mysql_pool: &'a MySqlPool
}

pub async fn update_dataset(args: UpdateDatasetArgs<'_>) -> AnyhowResult<()>{

    // TODO: enforce checks for idempotency token
    let mut maybe_creator_synthetic_id : Option<u64> = None;

    let mut transaction = args.mysql_pool.begin().await?;
    if let Some(creator_user_token) = args.maybe_creator_user_token.as_deref() {
        let user_token = UserToken::new_from_str(creator_user_token);

        let next_zs_dataset_synthetic_id = transactional_increment_generic_synthetic_id(
            &user_token,
            IdCategory::ZeroShotVoiceDataset,
            &mut transaction
        ).await?;

        maybe_creator_synthetic_id = Some(next_zs_dataset_synthetic_id);
    }
    let query_result = sqlx::query!(
        r#"
        UPDATE zs_voice_datasets
        SET
            title = ?,
            maybe_creator_user_token = ?,
            creator_ip_address = ?,
            creator_set_visibility = ?,
            maybe_mod_user_token = ?,
            maybe_creator_synthetic_id = ?,
            ietf_language_tag = ?,
            ietf_primary_language_subtag = ?,


            version = version + 1
        WHERE token = ?
        LIMIT 1
        "#,
        args.dataset_title,
        args.maybe_creator_user_token,
        args.creator_ip_address,
        args.creator_set_visibility.to_str(),
        args.maybe_mod_user_token,
        maybe_creator_synthetic_id,
        args.ietf_language_tag,
        args.ietf_primary_language_subtag,
        args.dataset_token.as_str(),
    ).execute(args.mysql_pool).await;
    // TODO(Kasisnu): This should probably rollback
    transaction.commit().await?;
    match query_result {
        Ok(_) => Ok(()),
        Err(err) => Err(anyhow!("zs dataset update error: {:?}", err)),
    }

}

