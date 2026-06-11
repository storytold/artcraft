/// Estimated costs for an inference job, captured at enqueue time.
///
/// "System" costs are what we charge the user (Artcraft pricing).
/// "External third party" costs are what the fulfilling provider (Kinovi,
/// Fal, GmiCloud, Grok, etc.) charges us, in the provider's own credit
/// denomination and/or USD cents.
#[derive(Clone, Copy, Debug, Default)]
pub struct JobCostEstimates {
  /// Provider-side cost in the provider's own credits (if it bills in credits).
  pub maybe_external_third_party_cost_credits: Option<u32>,

  /// Provider-side cost in USD cents.
  pub maybe_external_third_party_cost_usd_cents: Option<u32>,

  /// User-facing cost in our own credits.
  pub maybe_system_cost_credits: Option<u32>,

  /// User-facing cost in USD cents.
  pub maybe_system_cost_usd_cents: Option<u32>,
}
