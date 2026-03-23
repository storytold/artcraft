use anyhow::anyhow;
use sqlx::MySqlPool;

use enums_db::common::visibility::Visibility;
use errors::AnyhowResult;
use tokens::tokens::zs_voices::ZsVoiceToken;

pub struct UpdateVoiceArgs<'a> {
    pub voice_token: &'a ZsVoiceToken,
    pub voice_title: Option<&'a str>,
    pub creator_set_visibility: &'a Visibility,
    pub maybe_mod_user_token: Option<&'a str>,
    pub ietf_language_tag: Option<&'a str>,
    pub ietf_primary_language_subtag: Option<&'a str>,
    pub mysql_pool: &'a MySqlPool
}

pub async fn update_voice(args: UpdateVoiceArgs<'_>) -> AnyhowResult<()>{
    let transaction = args.mysql_pool.begin().await?;

    let query_result = sqlx
    ::query!(
        r#"
        UPDATE zs_voices
        SET
            title = ?,
            creator_set_visibility = ?,
            maybe_mod_user_token = ?,
            ietf_language_tag = ?,
            ietf_primary_language_subtag = ?,
            version = version + 1
        WHERE token = ?
        LIMIT 1
        "#,
        args.voice_title,
        args.creator_set_visibility.to_str(),
        args.maybe_mod_user_token,
        args.ietf_language_tag,
        args.ietf_primary_language_subtag,
        args.voice_token.as_str(),
    ).execute(args.mysql_pool).await;

    transaction.commit().await?;

    match query_result {
        Ok(_) => Ok(()),
        Err(err) => 
        {
            Err(anyhow!("zs voice update error: {:?}", err))
        },
    }
}
