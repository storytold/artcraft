import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ModerationApi } from "@/api/ModerationApi";
import type { ImpersonationRequest } from "@/types";
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
  IconKey,
  IconRefresh,
  IconLoader2,
  IconArrowRight,
} from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export function Impersonation() {
  usePageTitle("Impersonation Logs");
  const [requests, setRequests] = useState<ImpersonationRequest[]>([]);
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
      const resp = await modApi.ListAllImpersonationRequests(cursor);

      if (cancelledRef.current) return;

      if (resp.success && resp.data) {
        setRequests((prev) =>
          append
            ? [...prev, ...resp.data!.impersonation_requests]
            : resp.data!.impersonation_requests,
        );
        setNextCursor(resp.data.next_cursor);
      } else {
        setError(resp.errorMessage || "Failed to load impersonation requests");
      }
    } catch (err: any) {
      if (!cancelledRef.current)
        setError(err.message || "Failed to load impersonation requests");
    } finally {
      if (!cancelledRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  const handleRefresh = () => {
    setRequests([]);
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusBadge = (req: ImpersonationRequest) => {
    if (req.is_redeemed) {
      return (
        <Badge
          variant="secondary"
          className="text-[10px] bg-emerald-500/10 text-emerald-400 border-transparent"
        >
          Redeemed
        </Badge>
      );
    }
    if (req.is_expired) {
      return (
        <Badge
          variant="secondary"
          className="text-[10px] bg-muted text-muted-foreground border-transparent"
        >
          Expired
        </Badge>
      );
    }
    return (
      <Badge
        variant="secondary"
        className="text-[10px] bg-amber-500/10 text-amber-400 border-transparent"
      >
        Active
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <IconKey className="size-6 text-muted-foreground" />
            Impersonation Logs
          </h1>
          <p className="text-muted-foreground">
            Audit trail of moderator impersonation requests (newest first)
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
        <div ref={tableRef}>
          {isLoading ? (
            <Table containerClassName="rounded-xl border bg-card shadow-sm overflow-hidden">
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="text-xs">Moderator</TableHead>
                  <TableHead className="text-xs"></TableHead>
                  <TableHead className="text-xs">Impersonated User</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="text-xs">Expires</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
              <IconKey className="size-10 text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground">
                No impersonation requests yet.
              </p>
            </div>
          ) : (
            <Table
              containerClassName="rounded-xl border bg-card shadow-sm min-h-[200px]"
              containerStyle={{ maxHeight: tableHeight ?? "60vh" }}
            >
              <TableHeader className="sticky top-0 z-10 bg-card">
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="text-xs">Moderator</TableHead>
                  <TableHead className="text-xs w-8"></TableHead>
                  <TableHead className="text-xs">Impersonated User</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="text-xs">Expires</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow
                    key={`${req.impersonator_user_token}-${req.impersonated_user_token}-${req.created_at}`}
                    className="group"
                  >
                    <TableCell className="text-sm font-medium">
                      <Link
                        to={`/user/profile/${req.impersonator_username}`}
                        className="hover:underline text-foreground"
                      >
                        @{req.impersonator_username}
                      </Link>
                      {req.impersonator_display_name && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {req.impersonator_display_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground/50">
                      <IconArrowRight className="size-3.5" />
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <Link
                        to={`/user/profile/${req.impersonated_username}`}
                        className="hover:underline text-foreground"
                      >
                        @{req.impersonated_username}
                      </Link>
                      {req.impersonated_display_name && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {req.impersonated_display_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {formatDate(req.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {formatDate(req.expires_at)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {statusBadge(req)}
                    </TableCell>
                  </TableRow>
                ))}
                {nextCursor != null && (
                  <TableRow ref={sentinelRef}>
                    <TableCell colSpan={6} className="text-center py-4">
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
