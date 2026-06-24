import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ModerationApi,
  type UserReferralListItem,
} from "@/api/ModerationApi";
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
  IconShare,
  IconRefresh,
  IconLoader2,
} from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateUrl(url: string, max = 40) {
  return url.length > max ? url.slice(0, max - 1) + "…" : url;
}

export function ReferralsAnalytics() {
  usePageTitle("Referrals");
  const [referrals, setReferrals] = useState<UserReferralListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);

  const loadData = async (cursor?: string | null, append = false) => {
    if (!append) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const modApi = new ModerationApi();
      const resp = await modApi.ListGlobalUserReferrals(cursor);

      if (cancelledRef.current) return;

      if (resp.success && resp.data) {
        setReferrals((prev) =>
          append ? [...prev, ...resp.data!.referrals] : resp.data!.referrals,
        );
        setNextCursor(resp.data.next_cursor);
      } else {
        setError(resp.errorMessage || "Failed to load referrals");
      }
    } catch (err: any) {
      if (!cancelledRef.current)
        setError(err.message || "Failed to load referrals");
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  const handleRefresh = () => {
    setReferrals([]);
    setNextCursor(null);
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
    if (!isLoadingMore && nextCursor != null) {
      loadData(nextCursor, true);
    }
  }, [nextCursor, isLoadingMore]);

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
            <IconShare className="size-6 text-muted-foreground" />
            Referrals
          </h1>
          <p className="text-muted-foreground">
            All referral signups, newest first
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <IconRefresh
            className={`size-4 ${isLoading ? "animate-spin" : ""}`}
          />
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
        <h3 className="text-xl font-bold flex items-center gap-2">
          <IconShare className="size-5 text-muted-foreground" />
          All Referrals
          {!isLoading && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              ({referrals.length}
              {nextCursor != null ? "+" : ""})
            </span>
          )}
        </h3>
        <div ref={tableRef}>
          {isLoading ? (
            <Table containerClassName="rounded-xl border bg-card shadow-sm overflow-hidden">
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="text-xs">When</TableHead>
                  <TableHead className="text-xs">Invited</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Referrer</TableHead>
                  <TableHead className="text-xs">Via</TableHead>
                  <TableHead className="text-xs">Landing URL</TableHead>
                  <TableHead className="text-xs">Referrer URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
              <IconShare className="size-10 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No referrals yet.</p>
            </div>
          ) : (
            <Table
              containerClassName="rounded-xl border bg-card shadow-sm min-h-[200px]"
              containerStyle={{ maxHeight: tableHeight ?? "60vh" }}
            >
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="text-xs">When</TableHead>
                  <TableHead className="text-xs">Invited</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Referrer</TableHead>
                  <TableHead className="text-xs">Via</TableHead>
                  <TableHead className="text-xs">Landing URL</TableHead>
                  <TableHead className="text-xs">Referrer URL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((ref, i) => (
                  <ReferralRow
                    key={`${ref.invited_user.token}-${ref.created_at}-${i}`}
                    referral={ref}
                  />
                ))}
                {nextCursor != null && (
                  <TableRow ref={sentinelRef}>
                    <TableCell colSpan={7} className="text-center py-4">
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

function ReferralRow({ referral }: { referral: UserReferralListItem }) {
  const { invited_user, referrer_user, maybe_referral_code_token, maybe_landing_url, maybe_referral_url, created_at } = referral;
  const urlTitle =
    maybe_landing_url || maybe_referral_url || undefined;

  return (
    <TableRow className="group">
      <TableCell className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">
        {formatDate(created_at)}
      </TableCell>
      <TableCell className="text-sm">
        <Link
          to={`/user/profile/${invited_user.username}`}
          className="hover:underline text-foreground font-medium"
        >
          @{invited_user.username}
        </Link>
        {invited_user.display_name && (
          <span className="ml-2 text-xs text-muted-foreground">
            {invited_user.display_name}
          </span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {invited_user.email_address || (
          <span className="text-muted-foreground/30">&mdash;</span>
        )}
      </TableCell>
      <TableCell className="text-sm">
        <Link
          to={`/user/profile/${referrer_user.username}/referrals`}
          className="hover:underline text-foreground font-medium"
        >
          @{referrer_user.username}
        </Link>
        {referrer_user.display_name && (
          <span className="ml-2 text-xs text-muted-foreground">
            {referrer_user.display_name}
          </span>
        )}
      </TableCell>
      <TableCell className="text-xs">
        {maybe_referral_code_token ? (
          <Badge
            variant="secondary"
            className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border-transparent"
            title={urlTitle}
          >
            code
          </Badge>
        ) : maybe_landing_url || maybe_referral_url ? (
          <Badge
            variant="outline"
            className="text-[10px] text-muted-foreground"
            title={urlTitle}
          >
            link
          </Badge>
        ) : (
          <span className="text-muted-foreground/30">&mdash;</span>
        )}
      </TableCell>
      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
        {maybe_landing_url ? (
          <a
            href={maybe_landing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-foreground"
            title={maybe_landing_url}
          >
            {truncateUrl(maybe_landing_url)}
          </a>
        ) : (
          <span className="text-muted-foreground/30">&mdash;</span>
        )}
      </TableCell>
      <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
        {maybe_referral_url ? (
          <a
            href={maybe_referral_url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-foreground"
            title={maybe_referral_url}
          >
            {truncateUrl(maybe_referral_url)}
          </a>
        ) : (
          <span className="text-muted-foreground/30">&mdash;</span>
        )}
      </TableCell>
    </TableRow>
  );
}
