use anyhow::anyhow;
use chrono::{DateTime, Utc};
use enums_db::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use errors::AnyhowResult;
use log::{info, warn};
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

pub struct PromptContextItem {
  pub media_token: MediaFileToken,
  pub context_semantic_type: PromptContextSemanticType,
  pub public_bucket_directory_hash: String,
  pub maybe_public_bucket_prefix: Option<String>,
  pub maybe_public_bucket_extension: Option<String>,
}

struct RawPromptContextItem {
  media_token: MediaFileToken,
  context_semantic_type: PromptContextSemanticType,
  public_bucket_directory_hash: String,
  maybe_public_bucket_prefix: Option<String>,
  maybe_public_bucket_extension: Option<String>,
}

pub async fn list_prompt_context_items(
  prompt_token: &PromptToken,
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Vec<PromptContextItem>> {
  let result = sqlx::query_as!(
      RawPromptContextItem,
        r#"
SELECT
    pci.media_token as `media_token: tokens::tokens::media_files::MediaFileToken`,
    pci.context_semantic_type as `context_semantic_type: enums_db::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType`,

    m.public_bucket_directory_hash,
    m.maybe_public_bucket_prefix,
    m.maybe_public_bucket_extension

FROM prompt_context_items pci
JOIN media_files m
ON
    pci.media_token = m.token
WHERE
    pci.prompt_token = ?
ORDER BY pci.id ASC
        "#,
        prompt_token.as_str()
      )
      .fetch_all(&mut **mysql_connection)
      .await;

  match result {
    Ok(items) => {
      Ok(items.into_iter().map(|item| {
        PromptContextItem {
          media_token: item.media_token,
          context_semantic_type: item.context_semantic_type,
          public_bucket_directory_hash: item.public_bucket_directory_hash,
          maybe_public_bucket_prefix: item.maybe_public_bucket_prefix,
          maybe_public_bucket_extension: item.maybe_public_bucket_extension,
        }
      }).collect::<Vec<PromptContextItem>>())
    }
    Err(err) => match err {
      sqlx::Error::RowNotFound => Ok(Vec::new()),
      _ => {
        warn!("Error querying prompt context items: {:?}", err);
        Err(anyhow!("error querying prompt context items"))
      }
    }
  }
}
