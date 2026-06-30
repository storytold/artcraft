import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ModerationApi,
  type UserDailySpend,
  type ModeratorUserLookupResponse,
} from "@/api/ModerationApi";
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
  IconArrowLeft,
  IconChartLine,
  IconCoin,
  IconLoader2,
} from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const PAGE_SIZE = 200;
const COLUMN_COUNT = 8;

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function formatUsd(cents: number): string {
  return usd.format(cents / 100);
}

function formatDay(spendDate: string): string {
  // spend_date is a UTC calendar date (YYYY-MM-DD); render without TZ shifting.
  const [y, m, d] = spendDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function UserSpendHistory() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  usePageTitle(username ? `@${username} — Spend History` : "Spend History");

  const [user, setUser] = useState<ModeratorUserLookupResponse | null>(null);
  const [rows, setRows] = useState<UserDailySpend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextOffset, setNextOffset] = useState<number | null>(null);

  const cancelledRef = useRef(false);
  const tokenRef = useRef<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);

  const loadPage = useCallback(async (offset: number, append: boolean) => {
    const token = tokenRef.current;
    if (!token) return;
    if (append) setIsLoadingMore(true);

    try {
      const modApi = new ModerationApi();
      const resp = await modApi.ListUserDailySpends(token, offset, PAGE_SIZE);
      if (cancelledRef.current) return;
      if (resp.success && resp.data) {
        setRows((prev) => (append ? [...prev, ...resp.data!.records] : resp.data!.records));
        setNextOffset(resp.data.next_offset);
      } else {
        setError(resp.errorMessage || "Failed to load spend history");
      }
    } catch (err: any) {
      if (!cancelledRef.current) setError(err.message || "Failed to load spend history");
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!username) return;
    cancelledRef.current = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      setRows([]);
      setNextOffset(null);
      try {
        const modApi = new ModerationApi();
        const userResp = await modApi.UserLookup(username);
        if (cancelledRef.current) return;
        if (!userResp.success || !userResp.data?.maybe_user) {
          setError(userResp.errorMessage || "User not found");
          setIsLoading(false);
          return;
        }
        setUser(userResp.data.maybe_user);
        tokenRef.current = userResp.data.maybe_user.token;
        await loadPage(0, false);
      } catch (err: any) {
        if (!cancelledRef.current) {
          setError(err.message || "Failed to load user");
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [username, loadPage]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && nextOffset != null) {
      loadPage(nextOffset, true);
    }
  }, [nextOffset, isLoadingMore, loadPage]);

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
      <TableHead className="text-xs">Date</TableHead>
      <TableHead className="text-xs text-right">Gross</TableHead>
      <TableHead className="text-xs text-right">Refund</TableHead>
      <TableHead className="text-xs text-right">Net</TableHead>
      <TableHead className="text-xs text-right">Subscription</TableHead>
      <TableHead className="text-xs text-right">Credit Packs</TableHead>
      <TableHead className="text-xs text-right">Payments</TableHead>
      <TableHead className="text-xs text-right">Credits</TableHead>
    </TableRow>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit -ml-2 mb-1"
            onClick={() => navigate(`/user/profile/${username}`)}
          >
            <IconArrowLeft className="size-4" />
            Back to profile
          </Button>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <IconCoin className="size-6 text-muted-foreground" />
            Spend History
          </h1>
          <p className="text-muted-foreground">
            Daily spend for{" "}
            <Link to={`/user/profile/${username}`} className="hover:underline">
              @{username}
            </Link>
            {user?.display_name && <span className="ml-2 text-sm">{user.display_name}</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/user/spend-summary/${username}`}>
            <IconChartLine className="size-4" />
            Spend Summary
          </Link>
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
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
              <IconCoin className="size-10 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No spend history for this user.</p>
            </div>
          ) : (
            <Table
              containerClassName="rounded-xl border bg-card shadow-sm min-h-[200px]"
              containerStyle={{ maxHeight: tableHeight ?? "60vh" }}
            >
              <TableHeader className="sticky top-0 z-10 bg-card">{headerRow}</TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const isRefundDay = row.net_spend_usd_cents < 0;
                  return (
                    <TableRow key={row.spend_date} className="group">
                      <TableCell className="text-sm whitespace-nowrap">
                        {formatDay(row.spend_date)}
                      </TableCell>
                      <TableCell className="text-sm text-right tabular-nums">
                        {formatUsd(row.gross_spend_usd_cents)}
                      </TableCell>
                      <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                        {row.refund_usd_cents > 0 ? (
                          <span className="text-red-400">{formatUsd(row.refund_usd_cents)}</span>
                        ) : (
                          <span className="text-muted-foreground/30">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-sm text-right tabular-nums font-medium ${
                          isRefundDay ? "text-red-400" : "text-emerald-400"
                        }`}
                      >
                        {formatUsd(row.net_spend_usd_cents)}
                      </TableCell>
                      <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                        {row.subscription_spend_usd_cents > 0
                          ? formatUsd(row.subscription_spend_usd_cents)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                        {row.credits_spend_usd_cents > 0
                          ? formatUsd(row.credits_spend_usd_cents)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                        {row.payment_count}
                      </TableCell>
                      <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                        {row.credits_granted > 0 ? row.credits_granted.toLocaleString() : "—"}
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
