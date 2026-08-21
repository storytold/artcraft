import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ModerationApi } from "@/api/ModerationApi";
import type { TopSpender } from "@/api/ModerationApi";
import { Button } from "@/components/ui/button";
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
  IconChartLine,
  IconReceipt2,
  IconRefresh,
  IconLoader2,
  IconTrophy,
} from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const COLUMN_COUNT = 7;

const WINDOWS = [
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "14d", label: "14 days" },
  { value: "30d", label: "30 days" },
  { value: "60d", label: "60 days" },
  { value: "90d", label: "90 days" },
  { value: "180d", label: "180 days" },
  { value: "365d", label: "365 days" },
];

const DEFAULT_WINDOW = "30d";

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatUsd(cents: number): string {
  return usdFormatter.format(cents / 100);
}

export function TopSpenders() {
  usePageTitle("Top Spenders");
  const [spenders, setSpenders] = useState<TopSpender[]>([]);
  const [window, setWindow] = useState(DEFAULT_WINDOW);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);

  const cancelledRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);

  const loadData = async (
    timeWindow: string,
    offset?: number | null,
    append = false,
  ) => {
    if (!append) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const modApi = new ModerationApi();
      const resp = await modApi.ListTopSpenders(timeWindow, offset);

      if (cancelledRef.current) return;

      if (resp.success && resp.data) {
        setSpenders((prev) =>
          append ? [...prev, ...resp.data!.spenders] : resp.data!.spenders,
        );
        setNextOffset(resp.data.next_offset);
      } else {
        setError(resp.errorMessage || "Failed to load top spenders");
      }
    } catch (err: any) {
      if (!cancelledRef.current)
        setError(err.message || "Failed to load top spenders");
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  const handleWindowChange = (value: string) => {
    setWindow(value);
    setSpenders([]);
    setNextOffset(null);
    loadData(value);
  };

  const handleRefresh = () => {
    setSpenders([]);
    setNextOffset(null);
    loadData(window);
  };

  useEffect(() => {
    cancelledRef.current = false;
    loadData(DEFAULT_WINDOW);
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && nextOffset != null) {
      loadData(window, nextOffset, true);
    }
  }, [window, nextOffset, isLoadingMore]);

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
            <IconTrophy className="size-6 text-muted-foreground" />
            Top Spenders
          </h1>
          <p className="text-muted-foreground">
            Users ranked by net spend over the selected window
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

      <div className="flex items-center gap-1.5 flex-wrap">
        {WINDOWS.map((w) => (
          <Button
            key={w.value}
            variant={window === w.value ? "default" : "outline"}
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => handleWindowChange(w.value)}
            disabled={isLoading && window === w.value}
          >
            {w.label}
          </Button>
        ))}
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
                  <TableHead className="text-xs w-12">#</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs text-right">Net Spend</TableHead>
                  <TableHead className="text-xs text-right">Gross</TableHead>
                  <TableHead className="text-xs text-right">Refunds</TableHead>
                  <TableHead className="text-xs text-right">Payments</TableHead>
                  <TableHead className="text-xs text-right">Credits</TableHead>
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
          ) : spenders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
              <IconTrophy className="size-10 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">
                No spend in this window.
              </p>
            </div>
          ) : (
            <Table
              containerClassName="rounded-xl border bg-card shadow-sm min-h-[200px]"
              containerStyle={{ maxHeight: tableHeight ?? "60vh" }}
            >
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="text-xs w-12">#</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs text-right">Net Spend</TableHead>
                  <TableHead className="text-xs text-right">Gross</TableHead>
                  <TableHead className="text-xs text-right">Refunds</TableHead>
                  <TableHead className="text-xs text-right">Payments</TableHead>
                  <TableHead className="text-xs text-right">Credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spenders.map((spender, index) => (
                  <TableRow key={spender.user_token} className="group">
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/user/profile/${spender.username}`}
                          className="hover:underline text-foreground"
                        >
                          @{spender.username}
                        </Link>
                        <span className="flex items-center gap-1.5">
                          <Link
                            to={`/user/spend-summary/${spender.username}`}
                            className="text-muted-foreground hover:text-foreground"
                            title="Spend summary"
                          >
                            <IconChartLine className="size-4" />
                          </Link>
                          <span className="text-muted-foreground/30">|</span>
                          <Link
                            to={`/user/spend-history/${spender.username}`}
                            className="text-muted-foreground hover:text-foreground"
                            title="Spend history"
                          >
                            <IconReceipt2 className="size-4" />
                          </Link>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-sm text-right tabular-nums whitespace-nowrap font-medium ${
                        spender.net_spend_usd_cents < 0
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {formatUsd(spender.net_spend_usd_cents)}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-muted-foreground whitespace-nowrap">
                      {formatUsd(spender.gross_spend_usd_cents)}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums whitespace-nowrap">
                      {spender.refund_usd_cents > 0 ? (
                        <span className="text-red-400">
                          {formatUsd(spender.refund_usd_cents)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">&mdash;</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                      {spender.payment_count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                      {spender.credits_granted > 0 ? (
                        spender.credits_granted.toLocaleString()
                      ) : (
                        <span className="text-muted-foreground/30">&mdash;</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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
