import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ModerationApi, type ReengagementCandidate } from "@/api/ModerationApi";
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
  IconChartLine,
  IconHeartHandshake,
  IconReceipt2,
  IconRefresh,
  IconLoader2,
} from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const COLUMN_COUNT = 7;

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const formatUsd = (cents: number) => usd.format(cents / 100);

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function scoreColor(score: number): string {
  if (score >= 800) return "text-emerald-400";
  if (score >= 500) return "text-amber-400";
  return "text-muted-foreground";
}

export function ReengagementList() {
  usePageTitle("Reengagement List");
  const [candidates, setCandidates] = useState<ReengagementCandidate[]>([]);
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
      const resp = await modApi.ListReengagementCandidates(offset);
      if (cancelledRef.current) return;
      if (resp.success && resp.data) {
        setCandidates((prev) =>
          append ? [...prev, ...resp.data!.candidates] : resp.data!.candidates,
        );
        setNextOffset(resp.data.next_offset);
      } else {
        setError(resp.errorMessage || "Failed to load reengagement list");
      }
    } catch (err: any) {
      if (!cancelledRef.current)
        setError(err.message || "Failed to load reengagement list");
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  const handleRefresh = () => {
    setCandidates([]);
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
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  const { ref: tableRef, height: tableHeight } = useTableHeight();

  const headerRow = (
    <TableRow className="hover:bg-transparent bg-muted/30">
      <TableHead className="text-xs">User</TableHead>
      <TableHead className="text-xs text-right">Score</TableHead>
      <TableHead className="text-xs text-right">Lifetime Net</TableHead>
      <TableHead className="text-xs">Last Payment</TableHead>
      <TableHead className="text-xs text-right">Days Since</TableHead>
      <TableHead className="text-xs text-right">Weeks Since</TableHead>
      <TableHead className="text-xs">Subscriber</TableHead>
    </TableRow>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <IconHeartHandshake className="size-6 text-muted-foreground" />
            Reengagement List
          </h1>
          <p className="text-muted-foreground">
            Lapsed spenders to win back, highest re-engagement score first
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
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
              <TableHeader>{headerRow}</TableHeader>
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
          ) : candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
              <IconHeartHandshake className="size-10 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No users to re-engage.</p>
            </div>
          ) : (
            <Table
              containerClassName="rounded-xl border bg-card shadow-sm min-h-[200px]"
              containerStyle={{ maxHeight: tableHeight ?? "60vh" }}
            >
              <TableHeader className="sticky top-0 z-10 bg-card">{headerRow}</TableHeader>
              <TableBody>
                {candidates.map((c) => (
                  <TableRow key={c.user_token} className="group">
                    <TableCell className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/user/profile/${c.username}`}
                          className="hover:underline text-foreground"
                        >
                          @{c.username}
                        </Link>
                        <span className="flex items-center gap-1.5">
                          <Link
                            to={`/user/spend-summary/${c.username}`}
                            className="text-muted-foreground hover:text-foreground"
                            title="Spend summary"
                          >
                            <IconChartLine className="size-4" />
                          </Link>
                          <span className="text-muted-foreground/30">|</span>
                          <Link
                            to={`/user/spend-history/${c.username}`}
                            className="text-muted-foreground hover:text-foreground"
                            title="Spend history"
                          >
                            <IconReceipt2 className="size-4" />
                          </Link>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-sm text-right font-semibold tabular-nums ${scoreColor(c.reengagement_score)}`}>
                      {c.reengagement_score}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums">
                      {formatUsd(c.lifetime_net_spend_usd_cents)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(c.maybe_last_payment_at)}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                      {c.maybe_days_since_last_payment != null ? `${c.maybe_days_since_last_payment}d` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                      {c.maybe_weeks_since_last_spend != null ? `${c.maybe_weeks_since_last_spend}w` : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.is_active_subscriber ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                          active
                        </Badge>
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
                        <span className="text-muted-foreground/50">Scroll for more</span>
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
