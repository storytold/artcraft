use std::collections::HashMap;

use anyhow::anyhow;
use once_cell::sync::Lazy;
use regex::Regex;
use sqlx::MySqlPool;

use errors::AnyhowResult;

/// Check that tokens are alphanumeric or can have colons.
static SAFE_TOKENS_REGEX : Lazy<Regex> = Lazy::new(|| {
  Regex::new("^[a-zA-Z0-9:]+$").unwrap()
});

/// Check that tokens are alphanumeric or can have colons.
#[must_use]
fn check_token_safety(token: &str) -> AnyhowResult<()> {
  if SAFE_TOKENS_REGEX.is_match(token) {
    Ok(())
  } else {
    Err(anyhow!("Token contains invalid characters"))
  }
}

pub async fn reorder_twitch_event_rules(
  rule_token_to_order_map: HashMap<String, u32>,
  user_token: &str,
  ip_address_update: &str,
  mysql_pool: &MySqlPool
) -> AnyhowResult<bool> {

  // THIS IS NOT SANITIZED, so we check for injection here.
  for (rule_token, _position) in rule_token_to_order_map.iter() {
    check_token_safety(rule_token.as_str())?;
  }

  check_token_safety(user_token)?;

// NB: Sadly upserts fail due to other required primary keys that we cannot supply here (eg. uuid).
//  let query_inner = rule_token_to_order_map.iter()
//      .map(|(token, position)|  {
//        format!("(\"{}\", {}, \"{}\")", token.as_str(), position, ip_address_update)
//      })
//      .collect::<Vec<String>>()
//      .join(", ");
//
//  // Upsert to accomplish multiple updates at once.
//  // tl;dr https://stackoverflow.com/a/34866431
//  // ALSO THIS IS NOT SANITIZED.
//  let query = format!(r#"
//INSERT INTO twitch_event_rules (token, user_specified_rule_order, ip_address_last_update)
//VALUES
//    {}
//ON DUPLICATE KEY UPDATE
//    token=VALUES(token),
//    user_specified_rule_order=VALUES(user_specified_rule_order),
//    ip_address_last_update=VALUES(ip_address_last_update)
//        "#, query_inner);

  let rule_tokens = rule_token_to_order_map.iter()
      .map(|(token, _position)|  {
        format!("'{}'", token)
      })
      .collect::<Vec<String>>()
      .join(", ");

  let query_inner_positions = rule_token_to_order_map.iter()
      .map(|(token, position)|  {
        format!("when token = '{}' then '{}'", token.as_str(), position)
      })
      .collect::<Vec<String>>()
      .join("\n");

  let query_inner_ip_addresses = rule_token_to_order_map.iter()
      .map(|(token, _position)|  {
        format!("when token = '{}' then '{}'", token.as_str(), ip_address_update)
      })
      .collect::<Vec<String>>()
      .join("\n");

  let query = format!(r#"
UPDATE twitch_event_rules
SET
    user_specified_rule_order = (case
       {}
    end),
    ip_address_last_update = (case
       {}
    end)
    WHERE user_token = '{}'
    AND deleted_at IS NULL
    AND token IN ({})
  "#, query_inner_positions, query_inner_ip_addresses, user_token, rule_tokens);

  // NB: This, unfortunately, cannot be statically checked.
  let query = sqlx::query(sqlx::AssertSqlSafe(&*query));

  let result = query.execute(mysql_pool).await;

  match result {
    Err(err) => Err(anyhow!("error with query: {:?}", err)),
    Ok(_r) => Ok(true),
  }
}

#[cfg(test)]
mod tests {
  use crate::queries::twitch::twitch_event_rules::reorder_twitch_event_rules::check_token_safety;

  #[test]
  fn safe_tokens() {
    assert!(check_token_safety("foo").is_ok());
    assert!(check_token_safety("FOO").is_ok());
    assert!(check_token_safety("12345").is_ok());
    assert!(check_token_safety("abcdefABCDEF012345679").is_ok());
    assert!(check_token_safety("PREFIX:TOKEN1234").is_ok());
  }

  #[test]
  fn unsafe_tokens() {
    assert!(check_token_safety("").is_err());
    assert!(check_token_safety(",").is_err());
    assert!(check_token_safety("ABCD,").is_err());
    assert!(check_token_safety("foo;").is_err());
    assert!(check_token_safety("foo;foo").is_err());
    assert!(check_token_safety("foo;foo").is_err());
    assert!(check_token_safety("\"foo").is_err());
    assert!(check_token_safety("foo\"").is_err());
    assert!(check_token_safety("foo'").is_err());
    assert!(check_token_safety("foo'bar").is_err());
    assert!(check_token_safety("foo`foo").is_err());
  }
}
