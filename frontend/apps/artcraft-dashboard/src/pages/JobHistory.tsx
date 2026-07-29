import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ModerationApi } from "@/api/ModerationApi";
import type { UserJob } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { JobsTable, getJobStatusBadgeProps } from "@/components/JobsTable";
import { useTableHeight } from "@/hooks/useTableHeight";
import {
  IconArrowLeft,
  IconAlertCircle,
  IconBriefcase,
  IconAlertTriangle,
  IconSkull,
} from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";

export function JobHistory() {
  const { username } = useParams<{ username: string }>();
  usePageTitle(username ? `@${username} — Jobs` : "Jobs");
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<UserJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);

  const loadData = async () => {
    if (!username) return;
    setIsLoading(true);
    setError(null);

    try {
      const modApi = new ModerationApi();
      const userResp = await modApi.UserLookup(username);

      if (cancelledRef.current) return;

      if (!userResp.success || !userResp.data?.maybe_user) {
        setError(userResp.errorMessage || "User not found");
        setIsLoading(false);
        return;
      }

      const userToken = userResp.data.maybe_user.token;
      const jobsResp = await modApi.ListUserJobs(userToken);

      if (cancelledRef.current) return;

      if (jobsResp.success && jobsResp.data) {
        setJobs(jobsResp.data.jobs);
      } else {
        setError(jobsResp.errorMessage || "Failed to load jobs");
      }
    } catch (err: any) {
      if (!cancelledRef.current)
        setError(err.message || "Failed to load job data");
    } finally {
      if (!cancelledRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    cancelledRef.current = false;
    loadData();
    return () => {
      cancelledRef.current = true;
    };
  }, [username]);

  const { ref: tableRef, height: tableHeight } = useTableHeight();

  const totalJobs = jobs.length;
  const failedJobs = jobs.filter(
    (j) => getJobStatusBadgeProps(j.job_status).isFailed,
  ).length;
  const needsRefund = jobs.filter((j) => {
    const { isFailed } = getJobStatusBadgeProps(j.job_status);
    return (
      isFailed &&
      j.credits_delta != null &&
      j.credits_delta < 0 &&
      !j.maybe_linked_refund_ledger_token
    );
  }).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/user/profile/${username}`)}
          className="p-0! h-auto w-auto hover:bg-transparent! text-foreground/70 hover:text-foreground/50"
        >
          <IconArrowLeft className="size-6" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <IconBriefcase className="size-6 text-muted-foreground" />
            Job History
          </h1>
          <p className="text-muted-foreground text-sm">
            <Link to={`/user/profile/${username}`} className="hover:underline">
              @{username}
            </Link>
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="max-w-xl">
          <IconAlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-3"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <IconBriefcase className="size-5 text-foreground/70" />
              <span className="text-sm font-medium text-foreground/70 uppercase tracking-wider">
                Total Jobs
              </span>
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {totalJobs.toLocaleString()}
            </span>
          </div>
          <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <IconSkull className="size-5 text-foreground/70" />
              <span className="text-sm font-medium text-foreground/70 uppercase tracking-wider">
                Failed Jobs
              </span>
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {failedJobs.toLocaleString()}
            </span>
          </div>
          <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <IconAlertTriangle className="size-5 text-foreground/70" />
              <span className="text-sm font-medium text-foreground/70 uppercase tracking-wider">
                Needs Refund
              </span>
            </div>
            <span className="text-2xl font-bold tabular-nums text-amber-400">
              {needsRefund.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Jobs Table */}
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <IconBriefcase className="size-5 text-muted-foreground" />
          All Jobs
          {!isLoading && (
            <span className="text-sm font-normal text-muted-foreground ml-1">
              ({totalJobs})
            </span>
          )}
        </h3>
        <div ref={tableRef}>
          <JobsTable
            jobs={jobs}
            isLoading={isLoading}
            skeletonRows={8}
            maxHeight={tableHeight}
          />
        </div>
      </div>
    </div>
  );
}
