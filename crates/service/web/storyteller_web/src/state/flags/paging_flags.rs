/// Flags controlling the pager system.
#[derive(Clone, Debug)]
pub struct PagingFlags {
  /// Master switch for paging. If false, no pages are sent.
  /// Env var: ENABLE_PAGING (default: false)
  pub is_paging_enabled: bool,

  /// If true, the error alerting middleware will enqueue pages for HTTP 500s.
  /// Requires `is_paging_enabled` to also be true.
  /// Env var: ENABLE_PAGING_FOR_500S (default: false)
  pub is_paging_for_500s_enabled: bool,
}

impl PagingFlags {
  pub fn from_env() -> Self {
    Self {
      is_paging_enabled: easyenv::get_env_bool_or_default("ENABLE_PAGING", false),
      is_paging_for_500s_enabled: easyenv::get_env_bool_or_default("ENABLE_PAGING_FOR_500S", false),
    }
  }
}
