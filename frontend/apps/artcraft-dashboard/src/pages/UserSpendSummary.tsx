import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ModerationApi,
  type UserSpendSummary as UserSpendSummaryData,
  type UserDailySpend,
  type ModeratorUserLookupResponse,
} from "@/api/ModerationApi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconChartLine,
  IconCoin,
  IconReceipt2,
} from "@tabler/icons-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { UserBillingSection } from "@/components/UserBillingSection";

// --- formatting helpers ---
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatUsd(cents: number): string {
  return usd.format(cents / 100);
}

// Compact axis label that scales with magnitude ($1.2k, $3.4M).
function formatUsdCompact(cents: number): string {
  const dollars = cents / 100;
  const abs = Math.abs(dollars);
  if (abs >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(dollars / 1_000).toFixed(1)}k`;
  return usdWhole.format(dollars);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// --- period selector (filters client-side; data is fetched once) ---
const PERIODS: { value: string; label: string; days: number | null }[] = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "14d", label: "Last 2 weeks", days: 14 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "60d", label: "Last 60 days", days: 60 },
  { value: "90d", label: "Last 90 days", days: 90 },
  { value: "180d", label: "Last 180 days", days: 180 },
  { value: "1y", label: "Last year", days: 365 },
  { value: "all", label: "All time", days: null },
];

const chartConfig = {
  net: { label: "Net spend", color: "var(--primary)" },
} satisfies ChartConfig;

const MAX_DAILY_PAGES = 50;
const DAILY_PAGE_SIZE = 5000;

export function UserSpendSummary() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  usePageTitle(username ? `@${username} — Spend Summary` : "Spend Summary");

  const [user, setUser] = useState<ModeratorUserLookupResponse | null>(null);
  const [summary, setSummary] = useState<UserSpendSummaryData | null>(null);
  const [daily, setDaily] = useState<UserDailySpend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>("90d");

  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!username) return;
    cancelledRef.current = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const modApi = new ModerationApi();

        const userResp = await modApi.UserLookup(username);
        if (cancelledRef.current) return;
        if (!userResp.success || !userResp.data?.maybe_user) {
          setError(userResp.errorMessage || "User not found");
          return;
        }
        const resolvedUser = userResp.data.maybe_user;
        setUser(resolvedUser);

        const summaryResp = await modApi.GetUserSpendSummary(resolvedUser.token);
        if (cancelledRef.current) return;
        if (!summaryResp.success) {
          setError(summaryResp.errorMessage || "Failed to load spend summary");
          return;
        }
        setSummary(summaryResp.data?.summary ?? null);

        // Load ALL daily rows (paginated) so the period selector can filter
        // client-side without re-fetching.
        const allDaily: UserDailySpend[] = [];
        let offset: number | null = 0;
        for (let i = 0; i < MAX_DAILY_PAGES; i++) {
          const resp = await modApi.ListUserDailySpends(
            resolvedUser.token,
            offset,
            DAILY_PAGE_SIZE,
          );
          if (cancelledRef.current) return;
          if (!resp.success || !resp.data) {
            setError(resp.errorMessage || "Failed to load daily spend");
            return;
          }
          allDaily.push(...resp.data.records);
          if (resp.data.next_offset == null) break;
          offset = resp.data.next_offset;
        }
        // API returns newest first; chart wants oldest -> newest.
        allDaily.sort((a, b) => a.spend_date.localeCompare(b.spend_date));
        setDaily(allDaily);
      } catch (err: any) {
        if (!cancelledRef.current)
          setError(err.message || "Failed to load spend summary");
      } finally {
        if (!cancelledRef.current) setIsLoading(false);
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [username]);

  const chartData = useMemo(() => {
    const days = PERIODS.find((p) => p.value === period)?.days ?? null;
    let rows = daily;
    if (days != null) {
      const cutoff = new Date();
      cutoff.setHours(0, 0, 0, 0);
      cutoff.setDate(cutoff.getDate() - (days - 1));
      rows = daily.filter((d) => new Date(d.spend_date) >= cutoff);
    }
    return rows.map((d) => ({
      date: d.spend_date,
      net: d.net_spend_usd_cents / 100,
      gross: d.gross_spend_usd_cents / 100,
    }));
  }, [daily, period]);

  const periodTotalCents = useMemo(
    () => Math.round(chartData.reduce((sum, d) => sum + d.net, 0) * 100),
    [chartData],
  );

  // Fit the Y axis tightly to the currently-displayed data (recomputes on every
  // period change), with ~10% headroom so peaks never touch/overflow the top.
  const yDomain = useMemo<[number, number]>(() => {
    if (chartData.length === 0) return [0, 1];
    const values = chartData.map((d) => d.net);
    const dataMax = Math.max(0, ...values);
    const dataMin = Math.min(0, ...values);
    const max = dataMax === 0 ? 1 : dataMax * 1.1;
    const min = dataMin === 0 ? 0 : dataMin * 1.1;
    return [min, max];
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-[360px] w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <Button variant="ghost" className="w-fit" onClick={() => navigate(`/user/profile/${username}`)}>
          <IconArrowLeft className="size-4" />
          Back to profile
        </Button>
        <Alert variant="destructive" className="max-w-xl">
          <IconAlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1 flex flex-col gap-1">
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
            <IconChartLine className="size-6 text-muted-foreground" />
            Spend Summary
          </h1>
          <p className="text-muted-foreground">
            <Link to={`/user/profile/${username}`} className="hover:underline">
              @{username}
            </Link>
            {user?.display_name && (
              <span className="ml-2 text-sm">{user.display_name}</span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/user/spend-history/${username}`}>
            <IconReceipt2 className="size-4" />
            Spend History
          </Link>
        </Button>
      </div>

      {/* Interactive spending-over-time graph */}
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Spending over time</CardTitle>
          <CardDescription>
            Net spend per day &middot;{" "}
            <span className="text-foreground font-medium">
              {formatUsd(periodTotalCents)}
            </span>{" "}
            over this period
          </CardDescription>
          <div className="ml-auto">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40" size="sm" aria-label="Select period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="rounded-lg">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[320px] bg-muted/20 border border-dashed rounded-xl">
              <IconCoin className="size-10 text-muted-foreground mb-3 opacity-20" />
              <p className="text-muted-foreground">No spend in this period.</p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
              <AreaChart data={chartData} margin={{ left: 4, right: 12 }}>
                <defs>
                  <linearGradient id="fillNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-net)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-net)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) =>
                    new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  tickMargin={8}
                  domain={yDomain}
                  allowDataOverflow
                  tickFormatter={(value) => formatUsdCompact(Number(value) * 100)}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      }
                      formatter={(value) => formatUsd(Number(value) * 100)}
                    />
                  }
                />
                <Area
                  dataKey="net"
                  type="monotone"
                  fill="url(#fillNet)"
                  stroke="var(--color-net)"
                  strokeWidth={2}
                  dot={{
                    r: 2.5,
                    fill: "var(--color-net)",
                    stroke: "var(--background)",
                    strokeWidth: 1,
                  }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Infographic HUD */}
      {summary ? (
        <SpendHud summary={summary} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-muted/20 border border-dashed rounded-xl">
          <IconCoin className="size-10 text-muted-foreground mb-3 opacity-20" />
          <p className="text-muted-foreground">No spend summary for this user.</p>
        </div>
      )}

      {/* Billing (same Stripe block as the profile page) */}
      {user && <UserBillingSection userToken={user.token} />}
    </div>
  );
}

// --- HUD ---

function SpendHud({ summary }: { summary: UserSpendSummaryData }) {
  return (
    <div className="flex flex-col gap-4">
      <Section title="Lifetime">
        <StatCard label="Net spend" value={formatUsd(summary.lifetime_net_spend_usd_cents)} emphasis />
        <StatCard label="Gross spend" value={formatUsd(summary.lifetime_gross_spend_usd_cents)} />
        <StatCard
          label="Refunded"
          value={formatUsd(summary.lifetime_refund_usd_cents)}
          sub={`${summary.lifetime_refund_count} refund${summary.lifetime_refund_count === 1 ? "" : "s"}`}
        />
        <StatCard label="Payments" value={summary.lifetime_payment_count.toLocaleString()} />
      </Section>

      <Section title="Revenue mix">
        <StatCard label="Subscriptions" value={formatUsd(summary.lifetime_subscription_spend_usd_cents)} />
        <StatCard label="Credit packs" value={formatUsd(summary.lifetime_credits_spend_usd_cents)} />
        <StatCard
          label="Subscriber"
          value={summary.is_active_subscriber ? "Active" : "No"}
          sub={summary.maybe_subscription_interval ?? undefined}
          badge={
            summary.is_active_subscriber ? (
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                active
              </Badge>
            ) : undefined
          }
        />
        <StatCard
          label="Re-engagement"
          value={summary.maybe_reengagement_score != null ? `${summary.maybe_reengagement_score}` : "—"}
          sub="0–1000"
        />
      </Section>

      <Section title="Recency">
        <StatCard
          label="First payment"
          value={formatDate(summary.maybe_first_payment_at)}
          sub={summary.first_spend_usd_cents ? formatUsd(summary.first_spend_usd_cents) : undefined}
        />
        <StatCard
          label="Last payment"
          value={formatDate(summary.maybe_last_payment_at)}
          sub={summary.last_spend_usd_cents ? formatUsd(summary.last_spend_usd_cents) : undefined}
        />
        <StatCard
          label="Days since last"
          value={summary.maybe_days_since_last_payment != null ? `${summary.maybe_days_since_last_payment}d` : "—"}
        />
        <StatCard
          label="Weeks since spend"
          value={summary.maybe_weeks_since_last_spend != null ? `${summary.maybe_weeks_since_last_spend}w` : "—"}
        />
      </Section>

      <Section title="Recent net spend">
        <StatCard label="Last 7 days" value={formatUsd(summary.net_spend_7d_usd_cents)} sub={`prev ${formatUsd(summary.net_spend_prev_7d_usd_cents)}`} />
        <StatCard label="Last 30 days" value={formatUsd(summary.net_spend_30d_usd_cents)} sub={`prev ${formatUsd(summary.net_spend_prev_30d_usd_cents)}`} />
        <StatCard label="Last 90 days" value={formatUsd(summary.net_spend_90d_usd_cents)} />
        <StatCard label="This year" value={formatUsd(summary.net_spend_this_year_usd_cents)} />
      </Section>

      <Section title="Cadence (Mon–Sun weeks)">
        <StatCard label="Avg weekly (4w)" value={formatUsd(summary.avg_weekly_net_spend_4w_usd_cents)} />
        <StatCard label="Avg weekly (12w)" value={formatUsd(summary.avg_weekly_net_spend_12w_usd_cents)} />
        <StatCard
          label="Active weeks (52)"
          value={`${summary.active_weeks_in_last_52}/52`}
          sub={`${summary.active_weeks_in_last_12}/12 recent`}
        />
        <StatCard
          label="Current streak"
          value={
            summary.consecutive_active_weeks > 0
              ? `${summary.consecutive_active_weeks}w active`
              : `${summary.consecutive_inactive_weeks}w idle`
          }
        />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{children}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  emphasis,
  badge,
}: {
  label: string;
  value: string;
  sub?: string;
  emphasis?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-4">
      <CardContent className="px-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          {badge}
        </div>
        <span
          className={
            emphasis
              ? "text-2xl font-bold tabular-nums tracking-tight"
              : "text-xl font-semibold tabular-nums tracking-tight"
          }
        >
          {value}
        </span>
        {sub && <span className="text-[11px] text-muted-foreground/70 tabular-nums">{sub}</span>}
      </CardContent>
    </Card>
  );
}
