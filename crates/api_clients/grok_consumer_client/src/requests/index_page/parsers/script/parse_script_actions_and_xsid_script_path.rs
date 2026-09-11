use crate::error::grok_client_error::GrokClientError;
use once_cell::sync::Lazy;
use regex::Regex;
use std::collections::HashMap;
use log::info;

static ACTIONS_REGEX : Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#"createServerReference\)\("([a-f0-9]+)""#)
      .expect("Regex should parse")
});

/// 2025-10-01: "(static/chunks/[^"]+\.js)"[^}]*?a\(880932\)"
/// 2025-12-01: "(static/chunks/[^"]+\.js)"[^}]*?\(880932\)"
static XSID_SCRIPT_REGEX : Lazy<Regex> = Lazy::new(|| {
  Regex::new(r#""(static/chunks/[^"]+\.js)"[^}]*?\(880932\)"#)
      .expect("Regex should parse")
});

#[derive(Debug, Clone)]
pub struct ActionsAndXsid {
  /// A list of opaque IDs for "actions"
  pub actions: Vec<String>,

  /// The URL path of the xsid script, with no leading slash.
  pub xsid_script_path: String,
}

pub fn parse_script_actions_and_xsid_script_path(scripts: &HashMap<String, String>) -> Result<ActionsAndXsid, GrokClientError> {
  let mut action_script_path = None;
  let mut script_content_1 = None;
  let mut script_content_2 = None;

  for (script_path, script_body) in scripts.iter() {
    if script_body.contains("anonPrivateKey") {
      action_script_path = Some(script_path.to_string());
      script_content_1 = Some(script_body.to_string());
    } else if script_body.contains("880932") {
      script_content_2 = Some(script_body.to_string());
    }
  }

  // NB: Commented out because we don't use it.
  // let action_script_path = match action_script_path {
  //   Some(action_script_path) => action_script_path,
  //   None => return Err(GrokClientError::ScriptLogicOutOfDate),
  // };

  let script_content_1 = match script_content_1 {
    Some(script_content_1) => script_content_1,
    None => return Err(GrokClientError::Script1LogicOutOfDate),
  };

  let script_content_2 = match script_content_2 {
    Some(script_content_2) => script_content_2,
    None => return Err(GrokClientError::Script2LogicOutOfDate),
  };

  //println!("Script content 1:");
  //println!("{}", script_content_1);
  //println!("Script content 2:");
  //println!("{}", script_content_2);

  let actions = ACTIONS_REGEX.captures_iter(&script_content_1)
      .flat_map(|captures| captures.get(1).map(|m| m.as_str().to_string()))
      .collect::<Vec<_>>();

  let xsid_script_path = parse_xsid_script_path_from_turbopack_script(&script_content_2)?;

  Ok(ActionsAndXsid {
    actions,
    xsid_script_path,
  })
}

fn parse_xsid_script_path_from_turbopack_script(script_source: &str) -> Result<String, GrokClientError> {
  let xsid_script_path = XSID_SCRIPT_REGEX.captures(&script_source)
      .map(|captures| captures.get(1)
          .map(|m| m.as_str()
              .to_string()))
      .flatten();

  match xsid_script_path {
    Some(xsid_script) => Ok(xsid_script),
    None => Err(GrokClientError::ScriptXsidLogicOutOfDate),
  }
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page_and_scripts::{get_index_page_and_scripts, GetIndexPageAndScriptsArgs};
  use crate::requests::index_page::parsers::script::parse_script_actions_and_xsid_script_path::{parse_script_actions_and_xsid_script_path, parse_xsid_script_path_from_turbopack_script};
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // manually test
  async fn test() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);
    let cookie = get_test_cookies()?;
    let page_and_scripts = get_index_page_and_scripts(GetIndexPageAndScriptsArgs {
      cookie: &cookie,
    }).await?;

    let result = parse_script_actions_and_xsid_script_path(&page_and_scripts.scripts)?;

    println!("{:?}", result);

    assert_eq!(1, 2);
    Ok(())
  }

  #[test]
  fn parse_turbopack_script_2_for_xsid() {
    // NB: The XSID parsing script broke on December 1st.
    // The valid script to parse out is "static/chunks/6450f465e55b5c24.js" (as it contains the magic numbers). This comes before the string (880932)
    // They probably just changed the TurboPack configs.
    let example_script_2 = r#"
      (globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,483347,a=>{a.v(s=>Promise.all(["static/chunks/6450f465e55b5c24.js"].map(s=>a.l(s))).then(()=>s(880932)))},330040,a=>{a.v(s=>Promise.all(["static/chunks/5cc0fc78839e38d4.js"].map(s=>a.l(s))).then(()=>s(921398)))},127660,a=>{a.v(s=>Promise.all(["static/chunks/fc24fa4ac57f0fa9.js"].map(s=>a.l(s))).then(()=>s(969999)))},307492,a=>{a.v(s=>Promise.all(["static/chunks/eb46b9f393cc69d9.js"].map(s=>a.l(s))).then(()=>s(529107)))},460973,a=>{a.v(s=>Promise.all(["static/chunks/7ff9ad06da182f94.js"].map(s=>a.l(s))).then(()=>s(296273)))},900864,
    "#;

    let parsed = parse_xsid_script_path_from_turbopack_script(example_script_2).unwrap();
    assert_eq!(parsed, "static/chunks/6450f465e55b5c24.js".to_string());
  }
}
