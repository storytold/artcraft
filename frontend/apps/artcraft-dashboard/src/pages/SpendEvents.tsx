import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ModerationApi } from "@/api/ModerationApi";
import type { UserSpendEvent } from "@/api/ModerationApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useTableHeight } from "@/hooks/useTableHeight";
import {
  IconAlertCircle,
  IconCoin,
  IconRefresh,
  IconLoader2,
} from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const COLUMN_COUNT = 8;

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatUsd(cents: number): string {
  return usdFormatter.format(cents / 100);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stripeRef(event: UserSpendEvent): string | null {
  return (
    event.maybe_stripe_payment_intent_id ||
    event.maybe_stripe_invoice_id ||
    event.maybe_stripe_charge_id ||
    event.maybe_source_object_id ||
    null
  );
}

export function SpendEvents() {
  usePageTitle("Spend Events");
  const [events, setEvents] = useState<UserSpendEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);

  const cancelledRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);

  const loadData = async (offset?: number | null, append = false) => {
    if (!append) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const modApi = new ModerationApi();
      const resp = await modApi.ListUserSpendEvents(offset);

      if (cancelledRef.current) return;

      if (resp.success && resp.data) {
        setEvents((prev) =>
          append ? [...prev, ...resp.data!.events] : resp.data!.events,
        );
        setNextOffset(resp.data.next_offset);
      } else {
        setError(resp.errorMessage || "Failed to load spend events");
      }
    } catch (err: any) {
      if (!cancelledRef.current)
        setError(err.message || "Failed to load spend events");
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  const handleRefresh = () => {
    setEvents([]);
    setNextOffset(null);
    loadData();
  };

  useEffect(() => {
    cancelledRef.current = false;
    loadData();
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && nextOffset != null) {
      loadData(nextOffset, true);
    }
  }, [nextOffset, isLoadingMore]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  const { ref: tableRef, height: tableHeight } = useTableHeight();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <IconCoin className="size-6 text-muted-foreground" />
            Spend Events
          </h1>
          <p className="text-muted-foreground">
            Every payment, refund, and credit grant, newest first
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <IconRefresh className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="max-w-xl">
          <IconAlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div ref={tableRef}>
          {isLoading ? (
            <Table containerClassName="rounded-xl border bg-card shadow-sm overflow-hidden">
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="text-xs">When</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs text-right">Credits</TableHead>
                  <TableHead className="text-xs">Source</TableHead>
                  <TableHead className="text-xs">Stripe Ref</TableHead>
                  <TableHead className="text-xs">Env</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 12 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: COLUMN_COUNT }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
              <IconCoin className="size-10 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No spend events yet.</p>
            </div>
          ) : (
            <Table
              containerClassName="rounded-xl border bg-card shadow-sm min-h-[200px]"
              containerStyle={{ maxHeight: tableHeight ?? "60vh" }}
            >
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="text-xs">When</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs text-right">Credits</TableHead>
                  <TableHead className="text-xs">Source</TableHead>
                  <TableHead className="text-xs">Stripe Ref</TableHead>
                  <TableHead className="text-xs">Env</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const ref = stripeRef(event);
                  const isRefund = event.amount_usd_cents < 0;
                  return (
                    <TableRow key={event.token} className="group">
                      <TableCell className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
                        {formatDate(event.payment_occurred_at)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {event.maybe_username ? (
                          <Link
                            to={`/user/profile/${event.maybe_username}`}
                            className="hover:underline text-foreground"
                          >
                            @{event.maybe_username}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground/30">&mdash;</span>
                        )}
                        {event.maybe_display_name && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {event.maybe_display_name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border-transparent"
                        >
                          {event.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-sm text-right tabular-nums whitespace-nowrap ${
                          isRefund ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {formatUsd(event.amount_usd_cents)}
                      </TableCell>
                      <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                        {event.maybe_credits_granted != null ? (
                          event.maybe_credits_granted.toLocaleString()
                        ) : (
                          <span className="text-muted-foreground/30">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground"
                        >
                          {event.payment_source}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground/70">
                        {ref ? (
                          <span className="truncate max-w-[160px] inline-block align-bottom">
                            {ref}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {event.is_production ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-emerald-400 border-emerald-500/30"
                          >
                            prod
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-400 border-amber-500/30"
                          >
                            test
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {nextOffset != null && (
                  <TableRow ref={sentinelRef}>
                    <TableCell colSpan={COLUMN_COUNT} className="text-center py-4">
                      {isLoadingMore ? (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <IconLoader2 className="size-4 animate-spin" />
                          Loading more...
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">
                          Scroll for more
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
