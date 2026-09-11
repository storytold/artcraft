use crate::error::grok_error::GrokError;
use crate::requests::index_page::parsers::index::parse_index_on_demand_script::parse_index_on_demand_script;
use crate::requests::index_page::requests::get_index_page_script_with_client::{get_index_page_script_with_client, GetIndexPageScriptArgs};
use wreq::Client;

// self.svg_data, self.numbers = Parser.parse_values(c_request.text, self.anim, self.xsid_script)

pub struct GetXsidScriptArgs<'a> {
  pub client: &'a Client,
  pub html: &'a str,
  pub cookie: &'a str,
  pub xsid_script_id: &'a str,
}

/// We pull numbers out of the xsid script
#[derive(Clone, Debug)]
pub struct XsidScript {
  pub xsid_script_body: String,
}

pub async fn get_xsid_script(args: GetXsidScriptArgs<'_>) -> Result<XsidScript, GrokError> {

  let script_link = match args.xsid_script_id {
    "ondemand.s" => {
      // TODO: Not sure this is relevant anymore. Not a full or correct implementation of this branch.
      let on_demand = parse_index_on_demand_script(&args.html);
      let on_demand = on_demand.unwrap_or_else(|| "".to_string());
      format!("https://abs.twimg.com/responsive-web/client-web/ondemand.s.{}a.js", on_demand)
    },
    _ => format!("https://grok.com/_next/{}", args.xsid_script_id),
  };

  let xsid_script_body = get_index_page_script_with_client(GetIndexPageScriptArgs {
    client: &args.client,
    cookie: args.cookie,
    script_url: &script_link,
  }).await?;

  Ok(XsidScript {
    xsid_script_body,
  })
}

#[cfg(test)]
mod tests {
  use crate::requests::index_page::get_index_page_and_scripts::{get_index_page_and_scripts, GetIndexPageAndScriptsArgs};
  use crate::requests::index_page::get_numbers::{get_numbers, GetNumbersArgs};
  use crate::requests::index_page::parsers::index::parse_index_verification_token::parse_index_verification_token;
  use crate::requests::index_page::parsers::script::parse_script_actions_and_xsid_script_path::parse_script_actions_and_xsid_script_path;
  use crate::requests::index_page::utils::convert_verification_token_to_loading_anim::convert_verification_token_to_loading_anim;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore] // Manual test invocation
  async fn test() -> AnyhowResult<()> {
    let cookie = get_test_cookies()?;

    let page_and_scripts = get_index_page_and_scripts(GetIndexPageAndScriptsArgs {
      cookie: &cookie,
    }).await?;

    let verification_token = parse_index_verification_token(&page_and_scripts.index_body_html)
        .expect("expected verification token");

    println!("Verification Token: {:?}", verification_token);

    let loading_anim = convert_verification_token_to_loading_anim(&verification_token)?;

    println!("Loading Animation: {:?}", loading_anim);

    let actions_and_xsid_script = parse_script_actions_and_xsid_script_path(&page_and_scripts.scripts)?;

    println!("Actions and XSID: {:?}", actions_and_xsid_script);

    let result = get_numbers(GetNumbersArgs {
      client: &page_and_scripts.client,
      html: &page_and_scripts.index_body_html,
      cookie: &cookie,
      loading_anim: &loading_anim,
      xsid_script_id: &actions_and_xsid_script.xsid_script_path,
    }).await?;

    println!("Final Numbers: {:?}", result);

    println!("\n\nBody:\n\n");
    println!("{}", page_and_scripts.index_body_html);

    assert_eq!(1, 2);
    Ok(())
  }
}
