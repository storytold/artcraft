use anyhow::anyhow;
use log::error;
use sqlx::{MySql, QueryBuilder, Transaction};

use enums_db::by_table::prompt_context_items::prompt_context_semantic_type::PromptContextSemanticType;
use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

pub struct PromptContextItem {
  pub media_token: MediaFileToken,
  pub context_semantic_type: PromptContextSemanticType,
}

pub struct InsertBatchArgs<'a, 'b> {
  pub prompt_token: PromptToken,
  pub items: Vec<PromptContextItem>,
  pub transaction: &'a mut Transaction<'b, MySql>,
}

/// Insert a list of entities into a "batch" together for grouping; returns the new batch token identifier to return
/// to the HTTP caller.
///
/// NB: Calling code is responsible for rolling back the transaction if this fails.
pub async fn insert_batch_prompt_context_items<'a, 'b>(args: InsertBatchArgs<'a, 'b>) -> AnyhowResult<()> {

  let mut query_builder = QueryBuilder::new(r#"
    INSERT INTO prompt_context_items (prompt_token, media_token, context_semantic_type) VALUES
  "#);

  for (i, item) in args.items.iter().enumerate() {
    query_builder.push("(");
    query_builder.push_bind(&args.prompt_token);
    query_builder.push(",");

    query_builder.push_bind(item.media_token.to_string());
    query_builder.push(",");

    query_builder.push_bind(item.context_semantic_type.to_string());
    query_builder.push(")");

    if i < args.items.len() - 1 {
      query_builder.push(",");
    }
  }

  let query = query_builder.build();

  let query_result  = query.execute(&mut **args.transaction).await;

  match query_result {
    Ok(_) => Ok(()),
    Err(err) => {
      error!("Error with prompt context item insert query: {:?}", &err);
      Err(anyhow!("prompt context item insert error: {:?}", &err))
    },
  }
}
