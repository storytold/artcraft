use anyhow::anyhow;
use clap::Args;
use seedance2pro_web_client::creds::seedance2pro_session::Seedance2ProSession;
use seedance2pro_web_client::requests::get_user_auth_details::get_user_auth_details::{
  get_user_auth_details, GetUserAuthDetailsArgs,
};

use super::super::state::Seedance2ProState;

/// Print the account's current credit balances (auth.user endpoint) as a
/// single CSV line: account,email,credits,available_credits.
#[derive(Args)]
pub struct AccountInfoArgs {
  /// Read session cookies from this env var instead of SEEDANCE2PRO_COOKIES.
  #[arg(long)]
  pub cookies_env: Option<String>,

  /// Account label for the output line. Defaults to the cookies env var name.
  #[arg(long)]
  pub account: Option<String>,
}

pub async fn run(state: &Seedance2ProState, args: AccountInfoArgs) -> anyhow::Result<()> {
  let (cookies, account_label) = match &args.cookies_env {
    Some(var) => (
      easyenv::get_env_string_required(var)
        .map_err(|err| anyhow!("Missing {} env var: {:?}", var, err))?,
      args.account.clone().unwrap_or_else(|| var.clone()),
    ),
    None => (
      state.cookies.clone(),
      args.account.clone().unwrap_or_else(|| "SEEDANCE2PRO_COOKIES".to_string()),
    ),
  };
  let session = Seedance2ProSession::from_cookies_string(cookies);

  let details = get_user_auth_details(GetUserAuthDetailsArgs {
    session: &session,
    host_override: None,
  }).await
    .map_err(|err| anyhow!("Error fetching auth details: {:?}", err))?;

  println!("{},{},{},{}",
    account_label, details.email, details.credits, details.available_credits);
  Ok(())
}
