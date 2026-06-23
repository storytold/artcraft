const NAMESPACE_LABELS: Record<string, string> = {
  artcraft: "ArtCraft",
  fakeyou: "FakeYou",
};

export function formatNamespace(ns: string): string {
  return NAMESPACE_LABELS[ns.toLowerCase()] ?? ns;
}

export function stripeCustomerDashboardUrl(stripeCustomerId: string): string {
  return `https://dashboard.stripe.com/customers/${encodeURIComponent(stripeCustomerId)}`;
}
