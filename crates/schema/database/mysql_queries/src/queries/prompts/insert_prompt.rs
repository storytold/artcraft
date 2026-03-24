use std::marker::PhantomData;

use anyhow::anyhow;
use log::info;
use sqlx;
use sqlx::{Executor, MySql};

use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation_provider::GenerationProvider;
use errors::AnyhowResult;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::payloads::prompt_args::prompt_inner_payload::PromptInnerPayload;

pub struct InsertPromptArgs<'e, 'c,  E>
  where E: 'e + Executor<'c, Database = MySql>
{
  /// If we need to generate the prompt token upfront, this will be the token to use for the insert.
  pub maybe_apriori_prompt_token: Option<&'e PromptToken>,

  pub prompt_type: PromptType,

  pub maybe_creator_user_token: Option<&'e UserToken>,
  
  pub maybe_model_type: Option<CommonModelType>,
  pub maybe_generation_provider: Option<GenerationProvider>,

  pub maybe_positive_prompt: Option<&'e str>,
  pub maybe_negative_prompt: Option<&'e str>,

  pub maybe_generation_mode: Option<CommonGenerationMode>,
  pub maybe_aspect_ratio: Option<CommonAspectRatio>,
  pub maybe_resolution: Option<CommonResolution>,
  pub maybe_batch_count: Option<u8>,
  pub maybe_generate_audio: Option<bool>,

  pub maybe_other_args: Option<&'e PromptInnerPayload>,

  pub creator_ip_address: &'e str,

  pub mysql_executor: E,

  // TODO: Not sure if this works to tell the compiler we need the lifetime annotation.
  //  See: https://doc.rust-lang.org/std/marker/struct.PhantomData.html#unused-lifetime-parameters
  pub phantom: PhantomData<&'c E>,
}

pub async fn insert_prompt<'e, 'c : 'e, E>(args: InsertPromptArgs<'e, 'c, E>)
  -> AnyhowResult<PromptToken>
  where E: 'e + Executor<'c, Database = MySql>
{
  let prompt_token = match args.maybe_apriori_prompt_token {
    Some(token) => token.clone(),
    None => PromptToken::generate(),
  };

  let maybe_other_args = match args.maybe_other_args {
    None => None,
    Some(inner_payload) => {
      let encoded = inner_payload.to_json()
          .map_err(|_e| anyhow!("could not encode inner payload"))?;
      Some(encoded)
    },
  };

  info!("maybe other prompt args (json): {:?}", maybe_other_args);

  let query = sqlx::query!(
      r#"
INSERT INTO prompts
SET
  token = ?,
  prompt_type = ?,

  maybe_creator_user_token = ?,
  
  maybe_model_type = ?,
  maybe_generation_provider = ?,

  maybe_positive_prompt = ?,
  maybe_negative_prompt = ?,

  maybe_generation_mode = ?,
  maybe_aspect_ratio = ?,
  maybe_resolution = ?,
  maybe_batch_count = ?,
  maybe_generate_audio = ?,
  
  maybe_other_args = ?,

  creator_ip_address = ?
        "#,
    prompt_token.as_str(),
    args.prompt_type.to_str(),
    args.maybe_creator_user_token.map(|t| t.as_str()),
    args.maybe_model_type.map(|m| m.to_str()),
    args.maybe_generation_provider.map(|g| g.to_str()),
    args.maybe_positive_prompt,
    args.maybe_negative_prompt,
    args.maybe_generation_mode.map(|m| m.to_str()),
    args.maybe_aspect_ratio.map(|a| a.to_str()),
    args.maybe_resolution.map(|r| r.to_str()),
    args.maybe_batch_count,
    args.maybe_generate_audio,
    maybe_other_args,
    args.creator_ip_address,
  );

  let _result = query.execute(args.mysql_executor).await?;

  Ok(prompt_token)
}
