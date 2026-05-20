use actix_helpers::middleware::disabled_endpoint_filter::disabled_endpoints::disabled_endpoints::DisabledEndpoints;
use actix_helpers::middleware::disabled_endpoint_filter::disabled_endpoints::exact_match_disabled_endpoints::ExactMatchDisabledEndpoints;
use actix_helpers::middleware::disabled_endpoint_filter::disabled_endpoints::prefix_disabled_endpoints::PrefixDisabledEndpoints;
use log::info;

pub fn read_disabled_endpoints() -> DisabledEndpoints {
  let exact_filename = easyenv::get_env_string_or_default(
    "DISABLED_ENDPOINTS_FILE_EXACT_MATCH",
    "./includes/container_includes/disabled_endpoints/endpoint_exact_matches.txt");

  let exact = ExactMatchDisabledEndpoints::load_from_file(exact_filename)
      .unwrap_or(ExactMatchDisabledEndpoints::new()); // NB: Fail open

  let prefix_filename = easyenv::get_env_string_or_default(
    "DISABLED_ENDPOINTS_FILE_PREFIX_MATCH",
    "./includes/container_includes/disabled_endpoints/endpoint_prefixes.txt");

  let prefix = PrefixDisabledEndpoints::load_from_file(prefix_filename)
      .unwrap_or(PrefixDisabledEndpoints::new()); // NB: Fail open

  info!("Disabled endpoints by exact match: {}", exact.len());
  info!("Disabled endpoints by prefix: {}", prefix.len());

  DisabledEndpoints::new(exact, prefix)
}
