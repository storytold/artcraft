use log::info;

use actix_helpers::middleware::banned_cidr_filter::banned_cidr_set::BannedCidrSet;
use actix_helpers::middleware::banned_cidr_filter::load_cidr_ban_set_from_file::load_cidr_ban_set_from_file;
use actix_helpers::middleware::banned_ip_filter::ip_ban_list::ip_ban_list::IpBanList;
use actix_helpers::middleware::banned_ip_filter::ip_ban_list::load_ip_ban_list_from_directory::load_ip_ban_list_from_directory;

use crate::util::troll_user_bans::load_troll_user_ban_list_from_directory::load_user_token_ban_list_from_directory;
use crate::util::troll_user_bans::troll_user_ban_list::TrollUserBanList;

pub fn load_static_container_ip_bans() -> IpBanList {
  let ip_ban_directory = easyenv::get_env_string_or_default(
    "IP_BAN_DIRECTORY",
    "./includes/container_includes/banned_ip_addresses"
  );

  let ip_ban_list = load_ip_ban_list_from_directory(ip_ban_directory)
      .unwrap_or(IpBanList::new());

  info!("Static IP bans loaded: {}", ip_ban_list.total_ip_address_count().unwrap_or(0));
  ip_ban_list
}

pub fn load_cidr_bans() -> BannedCidrSet {
  let cidr_ban_file = easyenv::get_env_string_or_default(
    "CIDR_BAN_FILE",
    "./includes/container_includes/banned_cidrs/banned_cidrs.txt"
  );

  let cidr_bans = load_cidr_ban_set_from_file(cidr_ban_file)
      .unwrap_or(BannedCidrSet::new());

  info!("CIDR bans loaded : {} CIDRs, {} addresses total",
    cidr_bans.total_cidr_count().unwrap_or(0),
    cidr_bans.total_ip_address_count().unwrap_or(0));

  cidr_bans
}

// NB: Some users abuse our service.
// Instead of outright banning them, we can change the function of the service.
pub fn load_troll_user_token_bans() -> TrollUserBanList {
  let user_token_troll_ban_directory = easyenv::get_env_string_or_default(
    "USER_TOKEN_TROLL_BAN_DIRECTORY",
    "./includes/container_includes/troll_bans/user_token_troll_bans"
  );

  let troll_ban_list = load_user_token_ban_list_from_directory(user_token_troll_ban_directory)
      .unwrap_or(TrollUserBanList::new());

  info!("Static user token troll bans loaded: {}", troll_ban_list.total_user_token_count().unwrap_or(0));
  troll_ban_list
}

// NB: Some users abuse our service.
// Instead of outright banning them, we can change the function of the service.
pub fn load_ip_address_troll_bans() -> IpBanList {
  let ip_ban_directory = easyenv::get_env_string_or_default(
    "IP_TROLL_BAN_DIRECTORY",
    "./includes/container_includes/troll_bans/ip_address_troll_bans"
  );

  let ip_ban_list = load_ip_ban_list_from_directory(ip_ban_directory)
      .unwrap_or(IpBanList::new());

  info!("Static IP troll bans loaded: {}", ip_ban_list.total_ip_address_count().unwrap_or(0));
  ip_ban_list
}
