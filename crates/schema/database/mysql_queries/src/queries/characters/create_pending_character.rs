use log::info;
use sqlx::{Executor, MySql};
use std::marker::PhantomData;

use enums::by_table::characters::character_type::CharacterType;
use tokens::tokens::characters::CharacterToken;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::users::UserToken;

/// Arguments for inserting a new pending character record.
pub struct CreatePendingCharacterArgs<'e, 'c, E>
  where E: 'e + Executor<'c, Database = MySql>
{
  /// The type of character (e.g. KinoviSeedance).
  pub character_type: CharacterType,

  /// User's display name for the character (truncated to 255 chars by caller).
  pub character_name: &'e str,

  /// Optional user description (truncated to 512 chars by caller).
  pub maybe_description: Option<&'e str>,

  /// The media file token of the original uploaded image.
  pub maybe_original_upload_media_token: Option<&'e MediaFileToken>,

  /// The user who created this character.
  pub maybe_creator_user_token: Option<&'e UserToken>,

  /// IP address for abuse tracking.
  pub creator_ip_address: &'e str,

  /// The Kinovi character ID (e.g. "char_1774752056469_2wlxoq").
  pub kinovi_character_id: &'e str,

  /// The name Kinovi assigned to the character.
  pub kinovi_character_name: &'e str,

  /// Our inference job token for tracking the character creation.
  pub maybe_generic_inference_job_token: Option<&'e InferenceJobToken>,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Insert a new pending character record. Returns the generated CharacterToken.
///
/// The character is created with `is_active = false`. It will be activated
/// once the async creation job completes.
pub async fn create_pending_character<'e, 'c: 'e, E>(
  args: CreatePendingCharacterArgs<'e, 'c, E>,
) -> Result<CharacterToken, sqlx::Error>
  where E: 'e + Executor<'c, Database = MySql>
{
  let token = CharacterToken::generate();

  let query = sqlx::query!(
    r#"
INSERT INTO characters
SET
  token = ?,
  character_type = ?,
  is_active = false,
  character_name = ?,
  maybe_description = ?,
  maybe_avatar_media_token = NULL,
  maybe_full_image_media_token = NULL,
  maybe_original_upload_media_token = ?,
  maybe_creator_user_token = ?,
  creator_ip_address = ?,
  kinovi_character_id = ?,
  kinovi_character_name = ?,
  maybe_kinovi_asset_id = NULL,
  maybe_generic_inference_job_token = ?
    "#,
    token.as_str(),
    args.character_type.to_str(),
    args.character_name,
    args.maybe_description,
    args.maybe_original_upload_media_token.map(|t| t.as_str()),
    args.maybe_creator_user_token.map(|t| t.as_str()),
    args.creator_ip_address,
    args.kinovi_character_id,
    args.kinovi_character_name,
    args.maybe_generic_inference_job_token.map(|t| t.as_str()),
  );

  let result = query.execute(args.mysql_executor)
      .await?;

  info!("Created pending character {} (record ID {})", token, result.last_insert_id());

  Ok(token)
}
