import { useState, useEffect } from "react";
import {
  ModerationApi,
  type ModeratorStripeCustomerIdSource,
  type ModeratorUserStripeCustomerIdEntry,
} from "@/api/ModerationApi";
import { formatNamespace, stripeCustomerDashboardUrl } from "@/lib/stripe";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconCreditCard,
  IconExternalLink,
} from "@tabler/icons-react";

const STRIPE_SOURCE_LABELS: Record<ModeratorStripeCustomerIdSource, string> = {
  customer_link: "Customer Link",
  subscription: "Subscription",
};

/// The user's Stripe billing block (customer IDs across namespaces, their sources
/// — customer links + subscriptions — dashboard links, and a drift warning when a
/// namespace maps to more than one customer id). Self-contained: fetches its own data.
export function UserBillingSection({ userToken }: { userToken: string }) {
  const [customerIds, setCustomerIds] = useState<ModeratorUserStripeCustomerIdEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    new ModerationApi()
      .GetUserStripeCustomerIds(userToken)
      .then((resp) => {
        if (cancelled) return;
        if (resp.success && resp.data) setCustomerIds(resp.data.customer_ids);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userToken]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    });
  };

  // One row per unique customer id, with all the (namespace, source) pairs it was found under.
  const stripeCustomers = customerIds.reduce<
    { id: string; entries: ModeratorUserStripeCustomerIdEntry[] }[]
  >((acc, entry) => {
    const group = acc.find((g) => g.id === entry.stripe_customer_id);
    if (group) {
      group.entries.push(entry);
    } else {
      acc.push({ id: entry.stripe_customer_id, entries: [entry] });
    }
    return acc;
  }, []);

  // A namespace mapping to more than one distinct customer id means the
  // subscription and credits customer drifted apart — worth flagging.
  const namespaceIdSets = customerIds.reduce<Map<string, Set<string>>>(
    (map, entry) => {
      const ids = map.get(entry.payments_namespace) ?? new Set<string>();
      ids.add(entry.stripe_customer_id);
      return map.set(entry.payments_namespace, ids);
    },
    new Map(),
  );
  const mismatchedNamespaces = [...namespaceIdSets.entries()]
    .filter(([, ids]) => ids.size > 1)
    .map(([ns]) => ns);

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-5">
      <h4 className="text-sm font-semibold mb-4 text-foreground/80 uppercase tracking-wider pb-3 border-b border-border/50 flex items-center gap-2 h-11.25">
        <IconCreditCard className="size-4" />
        Stripe Customer Data
      </h4>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Stripe Customers
          </span>
          {isLoading ? (
            <Skeleton className="h-12 w-full rounded-lg" />
          ) : stripeCustomers.length > 0 ? (
            <div className="flex flex-col gap-2">
              {stripeCustomers.map(({ id, entries }) => (
                <div
                  key={id}
                  className="flex flex-col gap-1.5 p-2 bg-secondary/30 rounded-lg"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <a
                      href={stripeCustomerDashboardUrl(id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 min-w-0 font-mono text-xs hover:underline"
                      title="Open in Stripe Dashboard"
                    >
                      <span className="truncate">{id}</span>
                      <IconExternalLink className="size-3 shrink-0 text-muted-foreground" />
                    </a>
                    <button
                      type="button"
                      className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0.5"
                      onClick={() => copyToClipboard(id, `stripe_${id}`)}
                      title="Copy customer ID"
                    >
                      {copiedStates[`stripe_${id}`] ? (
                        <IconCheck className="size-3 text-emerald-400" />
                      ) : (
                        <IconCopy className="size-3 opacity-50" />
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {entries.map((entry) => (
                      <Badge
                        key={`${entry.payments_namespace}_${entry.source}`}
                        variant="secondary"
                        className="text-[10px] py-0 px-1.5"
                      >
                        {formatNamespace(entry.payments_namespace)}
                        {" · "}
                        {STRIPE_SOURCE_LABELS[entry.source]}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              {mismatchedNamespaces.length > 0 && (
                <p className="flex items-center gap-1 text-[11px] text-amber-400">
                  <IconAlertTriangle className="size-3 shrink-0" />
                  Multiple customer IDs in{" "}
                  {mismatchedNamespaces.map(formatNamespace).join(", ")}
                </p>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground italic">
              Not Connected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
