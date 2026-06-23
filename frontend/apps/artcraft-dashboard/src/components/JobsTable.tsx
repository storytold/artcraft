import { useState } from "react";
import { Link } from "react-router-dom";
import type { UserJob } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { IconBriefcase, IconExternalLink, IconCopy, IconCheck } from "@tabler/icons-react";

export function getJobStatusBadgeProps(jobStatus: string): {
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  label: string;
  isFailed: boolean;
  isComplete: boolean;
} {
  const status = jobStatus.toLowerCase();
  const isFailed =
    status.includes("dead") ||
    status.includes("fail") ||
    status.includes("error");
  const isComplete = status.includes("complete") || status.includes("success");

  if (isFailed) {
    return {
      variant: "secondary",
      className: "bg-destructive/10 text-destructive border-transparent",
      label: "Failed",
      isFailed,
      isComplete,
    };
  }
  if (isComplete) {
    return {
      variant: "secondary",
      className: "bg-emerald-500/10 text-emerald-400 border-transparent",
      label: "Completed",
      isFailed,
      isComplete,
    };
  }
  return {
    variant: "outline",
    className: "text-muted-foreground",
    label: "Pending",
    isFailed,
    isComplete,
  };
}

interface JobsTableProps {
  jobs: UserJob[];
  isLoading?: boolean;
  skeletonRows?: number;
  maxHeight?: number;
}

export function JobsTable({
  jobs,
  isLoading = false,
  skeletonRows = 5,
  maxHeight,
}: JobsTableProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToken(text);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  if (isLoading) {
    return (
      <Table containerClassName="rounded-xl border bg-card shadow-sm overflow-hidden">
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/30">
              <TableHead className="text-xs">Token</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs text-right">Credits</TableHead>
              <TableHead className="text-xs">Failure Reason</TableHead>
              <TableHead className="text-xs">Refund</TableHead>
              <TableHead className="text-xs">Result</TableHead>
              <TableHead className="text-xs">3rd Party</TableHead>
              <TableHead className="text-xs">3rd Party ID</TableHead>
              <TableHead className="text-xs">Created</TableHead>
              <TableHead className="text-xs">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-14 ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
        <IconBriefcase className="size-10 text-muted-foreground mb-4 opacity-20" />
        <p className="text-muted-foreground">No jobs found for this user.</p>
      </div>
    );
  }

  return (
    <Table containerClassName="rounded-xl border bg-card shadow-sm min-h-[200px]" containerStyle={{ maxHeight: maxHeight ?? "60vh" }}>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow className="hover:bg-transparent bg-muted/30">
            <TableHead className="text-xs">Token</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs text-right">Credits</TableHead>
            <TableHead className="text-xs">Failure Reason</TableHead>
            <TableHead className="text-xs">Refund</TableHead>
            <TableHead className="text-xs">Result</TableHead>
            <TableHead className="text-xs">3rd Party</TableHead>
            <TableHead className="text-xs">3rd Party ID</TableHead>
            <TableHead className="text-xs">Created</TableHead>
            <TableHead className="text-xs">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const badge = getJobStatusBadgeProps(job.job_status);

            return (
              <TableRow key={job.job_token} className="group">
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <Link
                      to={`/moderation/job/${encodeURIComponent(job.job_token)}`}
                      className="text-[10px] font-mono text-muted-foreground hover:text-foreground hover:underline truncate max-w-[120px]"
                      title="Open job info"
                    >
                      {job.job_token}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(job.job_token)}
                      title="Copy job token"
                    >
                      {copiedToken === job.job_token ? (
                        <IconCheck className="size-3 text-emerald-400" />
                      ) : (
                        <IconCopy className="size-3" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={badge.variant} className={badge.className}>
                    {badge.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {job.credits_delta != null ? (
                    <span
                      className={
                        job.credits_delta > 0
                          ? "text-emerald-400"
                          : job.credits_delta < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }
                    >
                      {job.credits_delta > 0 ? "+" : ""}
                      {job.credits_delta.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30">&mdash;</span>
                  )}
                </TableCell>
                <TableCell className="text-xs max-w-xs">
                  {job.job_failure_reason ? (
                    <span className="text-destructive line-clamp-2">
                      {job.job_failure_reason}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30">&mdash;</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {job.maybe_linked_refund_ledger_token ? (
                    <Badge
                      variant="outline"
                      className="text-muted-foreground text-[10px]"
                    >
                      Refunded
                    </Badge>
                  ) : badge.isFailed &&
                    job.credits_delta != null &&
                    job.credits_delta < 0 ? (
                    <span className="text-[10px] text-amber-400 font-medium uppercase tracking-wider">
                      Needs refund
                    </span>
                  ) : (
                    <span className="text-muted-foreground/30">&mdash;</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {job.on_success_result_media_token ? (
                    <a
                      href={`https://getartcraft.com/media/${job.on_success_result_media_token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-foreground/80 hover:underline"
                    >
                      <IconExternalLink className="size-3" />
                      View
                    </a>
                  ) : (
                    <span className="text-muted-foreground/30">&mdash;</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {job.maybe_external_third_party ? (
                    <span className="font-medium">{job.maybe_external_third_party}</span>
                  ) : (
                    <span className="text-muted-foreground/30">&mdash;</span>
                  )}
                </TableCell>
                <TableCell>
                  {job.maybe_external_third_party_id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(job.maybe_external_third_party_id!)}
                      title="Copy 3rd party ID"
                    >
                      {copiedToken === job.maybe_external_third_party_id ? (
                        <IconCheck className="size-3 text-emerald-400" />
                      ) : (
                        <IconCopy className="size-3" />
                      )}
                      <span className="truncate max-w-[120px] inline-block align-middle">{job.maybe_external_third_party_id}</span>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground/30 text-xs">&mdash;</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
                  <span className="text-muted-foreground/50">{new Date(job.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(job.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
                  <span className="text-muted-foreground/50">{new Date(job.updated_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
  );
}
