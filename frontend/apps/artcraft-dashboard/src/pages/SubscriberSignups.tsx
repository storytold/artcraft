import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ModerationApi } from "@/api/ModerationApi";
import type { SubscriberUser } from "@/types";
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
  IconCreditCard,
  IconExternalLink,
  IconRefresh,
  IconLoader2,
} from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";

function getSubscriptionStatusBadge(status: string | null) {
  if (!status) return { className: "text-muted-foreground", label: "Unknown" };
  const s = status.toLowerCase();
  if (s === "active")
    return { className: "bg-emerald-500/10 text-emerald-400 border-transparent", label: "Active" };
  if (s === "trialing")
    return { className: "bg-blue-500/10 text-blue-400 border-transparent", label: "Trialing" };
  if (s === "canceled" || s === "cancelled")
    return { className: "bg-destructive/10 text-destructive border-transparent", label: "Canceled" };
  if (s === "past_due")
    return { className: "bg-amber-500/10 text-amber-400 border-transparent", label: "Past Due" };
  if (s === "unpaid")
    return { className: "bg-orange-500/10 text-orange-400 border-transparent", label: "Unpaid" };
  return { className: "text-muted-foreground", label: status };
}

export function SubscriberSignups() {
  usePageTitle("Subscriber Signups");
  const [users, setUsers] = useState<SubscriberUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);

  const cancelledRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLTableRowElement | null>(null);

  const loadData = async (cursor?: number | null, append = false) => {
    if (!append) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const modApi = new ModerationApi();
      const resp = await modApi.ListSubscribersBySignupDate(cursor);

      if (cancelledRef.current) return;

      if (resp.success && resp.data) {
        setUsers((prev) => (append ? [...prev, ...resp.data!.users] : resp.data!.users));
        setNextCursor(resp.data.next_cursor);
      } else {
        setError(resp.errorMessage || "Failed to load subscribers");
      }
    } catch (err: any) {
      if (!cancelledRef.current)
        setError(err.message || "Failed to load subscribers");
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  const handleRefresh = () => {
    setUsers([]);
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
            <IconCreditCard className="size-6 text-muted-foreground" />
            Subscriber Signups
          </h1>
          <p className="text-muted-foreground">
            Subscribing users by signup date (newest first)
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
        <h3 className="text-xl font-bold flex items-center gap-2">
          <IconCreditCard className="size-5 text-muted-foreground" />
          Subscribers
          {!isLoading && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              ({users.length}{nextCursor != null ? "+" : ""})
            </span>
          )}
        </h3>
        <div ref={tableRef}>
          {isLoading ? (
            <Table containerClassName="rounded-xl border bg-card shadow-sm overflow-hidden">
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="text-xs">Username</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Signed Up</TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs">Interval</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Paid</TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
              <IconCreditCard className="size-10 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">No subscribers found.</p>
            </div>
          ) : (
            <Table
              containerClassName="rounded-xl border bg-card shadow-sm min-h-[200px]"
              containerStyle={{ maxHeight: tableHeight ?? "60vh" }}
            >
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="text-xs">Username</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Signed Up</TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs">Interval</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Paid</TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const statusBadge = getSubscriptionStatusBadge(
                    user.maybe_stripe_subscription_status,
                  );

                  return (
                    <TableRow key={user.id} className="group">
                      <TableCell className="text-sm font-medium">
                        <Link
                          to={`/user/profile/${user.username}`}
                          className="hover:underline text-foreground"
                        >
                          @{user.username}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="text-muted-foreground">{user.email_address}</span>
                        {!user.email_confirmed && (
                          <Badge variant="outline" className="ml-2 text-[10px] text-amber-400 border-amber-400/30">
                            Unconfirmed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-xs">
                        {user.subscription_product_slug ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {user.subscription_product_slug}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/30">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground capitalize">
                        {user.maybe_stripe_recurring_interval || (
                          <span className="text-muted-foreground/30">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="secondary" className={statusBadge.className + " text-[10px]"}>
                          {statusBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {user.maybe_stripe_invoice_is_paid === true ? (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-transparent">
                            Paid
                          </Badge>
                        ) : user.maybe_stripe_invoice_is_paid === false ? (
                          <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive border-transparent">
                            Unpaid
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/30">&mdash;</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                          <a href={`/user/profile/${user.username}`} target="_blank" rel="noopener noreferrer">
                            <IconExternalLink className="size-3.5" />
                            View Profile
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {nextCursor != null && (
                  <TableRow ref={sentinelRef}>
                    <TableCell colSpan={8} className="text-center py-4">
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
