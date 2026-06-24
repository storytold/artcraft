import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ModerationApi } from "@/api/ModerationApi";
import type { ModerationJob } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getJobStatusBadgeProps } from "@/components/JobsTable";
import { usePageTitle } from "@/hooks/usePageTitle";
import { humanize } from "@/lib/utils";
import { RawTag } from "@/components/RawTag";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconBriefcase,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconInfoCircle,
  IconBug,
  IconUser,
  IconServer,
  IconCpu,
  IconSparkles,
  IconAlertTriangle,
  IconLink,
  IconRefresh,
} from "@tabler/icons-react";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface CopyableTokenProps {
  value: string;
  copiedId?: string | null;
  onCopy: (value: string, id: string) => void;
  id: string;
  className?: string;
  to?: string;
}

function CopyableToken({
  value,
  copiedId,
  onCopy,
  id,
  className = "",
  to,
}: CopyableTokenProps) {
  const isCopied = copiedId === id;
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {to ? (
        <Link
          to={to}
          className="flex-1 min-w-0 inline-flex items-center gap-1 font-mono text-xs hover:underline text-foreground truncate"
        >
          <span className="truncate">{value}</span>
          <IconExternalLink className="size-3 shrink-0 opacity-60" />
        </Link>
      ) : (
        <span className="flex-1 min-w-0 font-mono text-xs text-foreground truncate">
          {value}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => onCopy(value, id)}
        title="Copy to clipboard"
      >
        {isCopied ? (
          <IconCheck className="size-3 text-emerald-400" />
        ) : (
          <IconCopy className="size-3" />
        )}
      </Button>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      {children}
    </div>
  );
}

function NoneValue() {
  return <span className="text-sm text-muted-foreground/40 italic">None</span>;
}

function StringValue({ value }: { value: string }) {
  return <span className="text-sm wrap-break-word">{value}</span>;
}

// Renders snake_case backend enum values as humanized text with the raw value
// shown alongside in a small monospace pill. Use for fields whose values are
// shaped like "complete_success" / "image_generation" / "fal_queue".
function EnumValue({ value }: { value: string }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      <span className="text-sm">{humanize(value)}</span>
      <RawTag value={value} />
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}

function Section({
  title,
  icon: Icon,
  children,
  className = "",
}: SectionProps) {
  return (
    <div
      className={`rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col p-5 ${className}`}
    >
      <h4 className="text-sm font-semibold mb-4 text-foreground/80 uppercase tracking-wider pb-3 border-b border-border/50 flex items-center gap-2 h-[45px]">
        <Icon className="size-4" />
        {title}
      </h4>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}

export function JobInfo() {
  const { jobToken } = useParams<{ jobToken: string }>();
  usePageTitle(jobToken ? `Job ${jobToken.slice(0, 8)}…` : "Job");
  const navigate = useNavigate();

  const [job, setJob] = useState<ModerationJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = (value: string, id: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    });
  };

  const loadJob = async () => {
    if (!jobToken) return;
    setIsLoading(true);
    setError(null);

    try {
      const api = new ModerationApi();
      const resp = await api.GetJobByToken(jobToken);
      if (resp.success && resp.data?.maybe_job) {
        setJob(resp.data.maybe_job);
      } else {
        setError(resp.errorMessage || "Job not found");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load job");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [jobToken]);

  const badge = job ? getJobStatusBadgeProps(job.status) : null;

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="p-0! h-auto w-auto hover:bg-transparent! text-foreground/70 hover:text-foreground/50"
        >
          <IconArrowLeft className="size-6" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <IconBriefcase className="size-6 text-muted-foreground" />
            Job Info
          </h1>
          {jobToken && (
            <p className="text-muted-foreground text-sm font-mono mt-1 truncate">
              {jobToken}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadJob}
            disabled={isLoading}
          >
            <IconRefresh className="size-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy(window.location.href, "job_link")}
          >
            {copiedId === "job_link" ? (
              <IconCheck className="size-4 text-emerald-400" />
            ) : (
              <IconCopy className="size-4" />
            )}
            Copy Link
          </Button>
        </div>
      </div>

      {error && !isLoading && (
        <Alert variant="destructive" className="max-w-xl">
          <IconAlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border bg-card shadow-sm flex flex-col p-5 gap-4"
            >
              <Skeleton className="h-4 w-24" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {job && badge && (
        <>
          {/* Quick Summary Banner */}
          <div className="relative rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <div className="inline-flex items-center gap-1.5">
                    <Badge variant={badge.variant} className={badge.className}>
                      {humanize(job.status)}
                    </Badge>
                    <RawTag value={job.status} />
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {humanize(job.inference_category)}
                    </Badge>
                    <RawTag value={job.inference_category} />
                  </div>
                  {job.maybe_job_type && (
                    <div className="inline-flex items-center gap-1.5">
                      <Badge variant="outline" className="text-xs">
                        {humanize(job.maybe_job_type)}
                      </Badge>
                      <RawTag value={job.maybe_job_type} />
                    </div>
                  )}
                  {job.attempt_count > 1 && (
                    <Badge
                      variant="outline"
                      className="text-xs text-amber-400 border-amber-500/30"
                    >
                      Attempt {job.attempt_count}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <span>Created {formatDateTime(job.created_at)}</span>
                  <span>Updated {formatDateTime(job.updated_at)}</span>
                </div>
              </div>

              <div className="md:ml-auto flex flex-wrap gap-2">
                {job.maybe_debug_log_event_token && (
                  <Button variant="default" size="sm" asChild>
                    <Link
                      to={`/moderation/debug-logs/${encodeURIComponent(
                        job.maybe_debug_log_event_token,
                      )}`}
                    >
                      <IconBug className="size-4" />
                      View Debug Logs
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Failure Banner (if failed) */}
          {(job.failure_reason || job.internal_debugging_failure_reason) && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-destructive uppercase tracking-wider flex items-center gap-2">
                <IconAlertTriangle className="size-4" />
                Failure Details
              </h4>
              {job.failure_reason && (
                <Field label="Failure Reason">
                  <p className="text-sm wrap-break-word text-destructive/90">
                    {job.failure_reason}
                  </p>
                </Field>
              )}
              {job.frontend_failure_category && (
                <Field label="Frontend Category">
                  <div className="inline-flex items-center gap-1.5">
                    <Badge variant="outline" className="w-max">
                      {humanize(job.frontend_failure_category)}
                    </Badge>
                    <RawTag value={job.frontend_failure_category} />
                  </div>
                </Field>
              )}
              {job.internal_debugging_failure_reason && (
                <Field label="Internal Debug Reason">
                  <pre className="text-xs font-mono whitespace-pre-wrap wrap-break-word bg-muted/40 p-3 rounded-lg text-foreground/90">
                    {job.internal_debugging_failure_reason}
                  </pre>
                </Field>
              )}
            </div>
          )}

          {/* Detail Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {/* Identity */}
            <Section title="Identity" icon={IconInfoCircle}>
              <Field label="Job Token">
                <CopyableToken
                  value={job.token}
                  copiedId={copiedId}
                  onCopy={copy}
                  id="job_token"
                />
              </Field>
              <Field label="Idempotency Token">
                <CopyableToken
                  value={job.uuid_idempotency_token}
                  copiedId={copiedId}
                  onCopy={copy}
                  id="idem"
                />
              </Field>
              <Field label="Status">
                <div className="inline-flex items-center gap-1.5">
                  <span className="text-sm font-medium">
                    {humanize(job.status)}
                  </span>
                  <RawTag value={job.status} />
                </div>
              </Field>
              <Field label="Attempt Count">
                <span className="text-sm tabular-nums">
                  {job.attempt_count}
                </span>
              </Field>
            </Section>

            {/* Creator */}
            <Section title="Creator" icon={IconUser}>
              <Field label="User">
                {job.maybe_creator_user_token ? (
                  <CopyableToken
                    value={job.maybe_creator_user_token}
                    copiedId={copiedId}
                    onCopy={copy}
                    id="creator_user"
                  />
                ) : (
                  <NoneValue />
                )}
              </Field>
              <Field label="Anonymous Visitor">
                {job.maybe_creator_anonymous_visitor_token ? (
                  <CopyableToken
                    value={job.maybe_creator_anonymous_visitor_token}
                    copiedId={copiedId}
                    onCopy={copy}
                    id="creator_anon"
                  />
                ) : (
                  <NoneValue />
                )}
              </Field>
              <Field label="IP Address">
                <span className="text-sm font-mono">
                  {job.creator_ip_address || "—"}
                </span>
              </Field>
              <Field label="Visibility">
                <div className="inline-flex items-center gap-1.5">
                  <Badge variant="outline" className="w-max">
                    {humanize(job.creator_set_visibility)}
                  </Badge>
                  <RawTag value={job.creator_set_visibility} />
                </div>
              </Field>
            </Section>

            {/* Worker / Routing */}
            <Section title="Worker & Routing" icon={IconServer}>
              <Field label="Assigned Cluster">
                {job.assigned_cluster ? (
                  <StringValue value={job.assigned_cluster} />
                ) : (
                  <NoneValue />
                )}
              </Field>
              <Field label="Assigned Worker">
                {job.assigned_worker ? (
                  <StringValue value={job.assigned_worker} />
                ) : (
                  <NoneValue />
                )}
              </Field>
              <Field label="Routing Tag">
                {job.maybe_routing_tag ? (
                  <EnumValue value={job.maybe_routing_tag} />
                ) : (
                  <NoneValue />
                )}
              </Field>
              <Field label="Job Type">
                {job.maybe_job_type ? (
                  <EnumValue value={job.maybe_job_type} />
                ) : (
                  <NoneValue />
                )}
              </Field>
            </Section>

            {/* Model & Inference */}
            <Section title="Model & Inference" icon={IconCpu}>
              <Field label="Inference Category">
                <div className="inline-flex items-center gap-1.5">
                  <Badge variant="secondary" className="w-max">
                    {humanize(job.inference_category)}
                  </Badge>
                  <RawTag value={job.inference_category} />
                </div>
              </Field>
              <Field label="Product Category">
                {job.maybe_product_category ? (
                  <EnumValue value={job.maybe_product_category} />
                ) : (
                  <NoneValue />
                )}
              </Field>
              <Field label="Model Type">
                {job.maybe_model_type ? (
                  <EnumValue value={job.maybe_model_type} />
                ) : (
                  <NoneValue />
                )}
              </Field>
              <Field label="Model Token">
                {job.maybe_model_token ? (
                  <CopyableToken
                    value={job.maybe_model_token}
                    copiedId={copiedId}
                    onCopy={copy}
                    id="model_token"
                  />
                ) : (
                  <NoneValue />
                )}
              </Field>
              <Field label="Prompt Token">
                {job.maybe_prompt_token ? (
                  <CopyableToken
                    value={job.maybe_prompt_token}
                    copiedId={copiedId}
                    onCopy={copy}
                    id="prompt_token"
                  />
                ) : (
                  <NoneValue />
                )}
              </Field>
            </Section>

            {/* Third Party */}
            <Section title="Third Party" icon={IconSparkles}>
              <Field label="Provider">
                {job.maybe_external_third_party ? (
                  <div className="inline-flex items-center gap-1.5">
                    <Badge variant="outline" className="w-max">
                      {humanize(job.maybe_external_third_party)}
                    </Badge>
                    <RawTag value={job.maybe_external_third_party} />
                  </div>
                ) : (
                  <NoneValue />
                )}
              </Field>
              <Field label="External ID">
                {job.maybe_external_third_party_id ? (
                  <CopyableToken
                    value={job.maybe_external_third_party_id}
                    copiedId={copiedId}
                    onCopy={copy}
                    id="external_id"
                  />
                ) : (
                  <NoneValue />
                )}
              </Field>
            </Section>

            {/* Result */}
            <Section title="Result" icon={IconLink}>
              <Field label="Entity Token">
                {job.on_success_result_entity_token ? (
                  <CopyableToken
                    value={job.on_success_result_entity_token}
                    copiedId={copiedId}
                    onCopy={copy}
                    id="result_entity"
                  />
                ) : (
                  <NoneValue />
                )}
              </Field>
              <Field label="Entity Type">
                {job.on_success_result_entity_type ? (
                  <EnumValue value={job.on_success_result_entity_type} />
                ) : (
                  <NoneValue />
                )}
              </Field>
              <Field label="Batch Token">
                {job.on_success_result_batch_token ? (
                  <CopyableToken
                    value={job.on_success_result_batch_token}
                    copiedId={copiedId}
                    onCopy={copy}
                    id="result_batch"
                  />
                ) : (
                  <NoneValue />
                )}
              </Field>
              <Field label="Download URL">
                {job.maybe_download_url ? (
                  <a
                    href={job.maybe_download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm inline-flex items-center gap-1 hover:underline break-all"
                  >
                    <IconExternalLink className="size-3 shrink-0" />
                    <span className="truncate">{job.maybe_download_url}</span>
                  </a>
                ) : (
                  <NoneValue />
                )}
              </Field>
              <Field label="Wallet Ledger Entry">
                {job.maybe_wallet_ledger_entry_token ? (
                  <CopyableToken
                    value={job.maybe_wallet_ledger_entry_token}
                    copiedId={copiedId}
                    onCopy={copy}
                    id="ledger_entry"
                  />
                ) : (
                  <NoneValue />
                )}
              </Field>
            </Section>
          </div>

          {/* Inference args (long) */}
          {job.maybe_inference_args && (
            <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-3">
              <h4 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider flex items-center gap-2">
                <IconCpu className="size-4" />
                Inference Arguments
              </h4>
              <PrettyJsonBlock raw={job.maybe_inference_args} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PrettyJsonBlock({ raw }: { raw: string }) {
  const trimmed = raw.trim();
  let formatted = raw;
  let isJson = false;
  try {
    const parsed = JSON.parse(trimmed);
    formatted = JSON.stringify(parsed, null, 2);
    isJson = true;
  } catch {
    formatted = raw;
  }

  return (
    <pre
      className={`text-xs font-mono whitespace-pre-wrap wrap-break-word bg-muted/40 p-4 rounded-lg max-h-[400px] overflow-auto ${
        isJson ? "text-foreground/90" : "text-foreground/80"
      }`}
    >
      {formatted}
    </pre>
  );
}
