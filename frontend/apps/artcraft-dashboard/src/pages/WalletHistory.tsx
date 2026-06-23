import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ModerationApi } from "@/api/ModerationApi";
import { usePageTitle } from "@/hooks/usePageTitle";
import type { Wallet, WalletLedgerEntryWithWallet } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GiveCreditsDialog } from "@/components/GiveCreditsDialog";
import { useTableHeight } from "@/hooks/useTableHeight";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  IconArrowLeft,
  IconCoin,
  IconCopy,
  IconCheck,
  IconAlertCircle,
  IconReceipt,
  IconArrowNarrowRight,
  IconRefresh,
  IconCalendarRepeat,
  IconCreditCardPay,
} from "@tabler/icons-react";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta.toLocaleString()}`;
  return delta.toLocaleString();
}

function getEntryTypeLabel(entryType: string): string {
  return entryType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getEntryBadgeProps(
  entryType: string,
  delta: number,
): {
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
} {
  const lower = entryType.toLowerCase();

  // Refunds: outline with muted styling
  if (lower.includes("refund")) {
    return { variant: "outline", className: "text-muted-foreground" };
  }
  // Monthly refills: primary-tinted
  if (lower.includes("monthly") || lower.includes("refill")) {
    return {
      variant: "secondary",
      className: "bg-primary/10 text-primary border-transparent",
    };
  }
  // Credits added: subtle positive
  if (delta > 0) {
    return {
      variant: "secondary",
      className:
        "bg-emerald-500/10 text-emerald-400 border-transparent dark:text-emerald-400",
    };
  }
  // Credits spent: subtle negative
  if (delta < 0) {
    return {
      variant: "secondary",
      className: "bg-destructive/10 text-destructive border-transparent",
    };
  }
  return { variant: "outline", className: "" };
}

export function WalletHistory() {
  const { username } = useParams<{ username: string }>();
  usePageTitle(username ? `@${username} — Wallet` : "Wallet");
  const navigate = useNavigate();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [entries, setEntries] = useState<WalletLedgerEntryWithWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [giveCreditsOpen, setGiveCreditsOpen] = useState(false);
  const { ref: tableRef, height: tableHeight } = useTableHeight();

  const totalMonthly = wallets.reduce((sum, w) => sum + w.monthly_credits, 0);
  const totalBanked = wallets.reduce((sum, w) => sum + w.banked_credits, 0);
  const totalCredits = totalMonthly + totalBanked;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedToken(text);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

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
      const walletsResp = await modApi.ListUserWallets(userToken);

      if (cancelledRef.current) return;

      if (!walletsResp.success || !walletsResp.data) {
        setError(walletsResp.errorMessage || "Failed to load wallets");
        setIsLoading(false);
        return;
      }

      setWallets(walletsResp.data.wallets);

      const allEntries: WalletLedgerEntryWithWallet[] = [];
      await Promise.all(
        walletsResp.data.wallets.map(async (wallet) => {
          const resp = await modApi.ListWalletLedgerEntries(wallet.token);
          if (resp.success && resp.data) {
            allEntries.push(...resp.data.entries);
          }
        }),
      );

      if (cancelledRef.current) return;

      allEntries.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setEntries(allEntries);
    } catch (err: any) {
      if (!cancelledRef.current)
        setError(err.message || "Failed to load wallet data");
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
            <IconCoin className="size-6 text-muted-foreground" />
            Credits History
          </h1>
          <p className="text-muted-foreground text-sm">
            <Link to={`/user/profile/${username}`} className="hover:underline">
              @{username}
            </Link>
          </p>
        </div>
        <Button
          size="sm"
          disabled={wallets.length === 0}
          onClick={() => setGiveCreditsOpen(true)}
        >
          <IconCoin className="size-3.5" />
          Give Credits
        </Button>
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
              <IconCalendarRepeat className="size-5 text-foreground/70" />
              <span className="text-sm font-medium text-foreground/70 uppercase tracking-wider">
                Monthly Credits
              </span>
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {totalMonthly.toLocaleString()}
            </span>
          </div>
          <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <IconCreditCardPay className="size-5 text-foreground/70" />
              <span className="text-sm font-medium text-foreground/70 uppercase tracking-wider">
                Banked Credits
              </span>
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {totalBanked.toLocaleString()}
            </span>
          </div>
          <div className="rounded-xl border bg-card shadow-sm p-5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <IconCoin className="size-5 text-foreground/70" />
              <span className="text-sm font-medium text-foreground/70 uppercase tracking-wider">
                Total Balance
              </span>
            </div>
            <span className="text-2xl font-bold tabular-nums">
              {totalCredits.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Ledger Entries */}
      <div className="flex flex-col gap-4 flex-1 min-h-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <IconReceipt className="size-5 text-muted-foreground" />
            Transactions
            {!isLoading && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ({entries.length})
              </span>
            )}
          </h3>
        </div>

        <div ref={tableRef}>
        {isLoading ? (
          <Table containerClassName="rounded-xl border bg-card shadow-sm overflow-hidden">
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/30">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs text-right">Delta</TableHead>
                <TableHead className="text-xs">Monthly</TableHead>
                <TableHead className="text-xs">Banked</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Token</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-14 ml-auto" />
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
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed rounded-xl">
            <IconReceipt className="size-10 text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">
              No transactions found for this user.
            </p>
          </div>
        ) : (
          <Table
            containerClassName="rounded-xl border bg-card shadow-sm min-h-[200px]"
            containerStyle={{ maxHeight: tableHeight }}
          >
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent bg-muted/30">
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs text-right">Delta</TableHead>
                <TableHead className="text-xs">Monthly</TableHead>
                <TableHead className="text-xs">Banked</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Token</TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const badge = getEntryBadgeProps(
                    entry.entry_type,
                    entry.credits_delta,
                  );
                  return (
                    <TableRow key={entry.token} className="group">
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(entry.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={badge.variant}
                          className={badge.className}
                        >
                          {getEntryTypeLabel(entry.entry_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
                        <span
                          className={
                            entry.credits_delta > 0
                              ? "text-emerald-400"
                              : entry.credits_delta < 0
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }
                        >
                          {formatDelta(entry.credits_delta)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono tabular-nums">
                        {entry.monthly_credits_before.toLocaleString()}
                        <IconArrowNarrowRight className="size-3 inline mx-1 opacity-30" />
                        <span className="font-medium text-foreground/80">
                          {entry.monthly_credits_after.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono tabular-nums">
                        {entry.banked_credits_before.toLocaleString()}
                        <IconArrowNarrowRight className="size-3 inline mx-1 opacity-30" />
                        <span className="font-medium text-foreground/80">
                          {entry.banked_credits_after.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {entry.is_refunded && (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              <IconRefresh className="size-3" />
                              Refunded
                            </Badge>
                          )}
                          {entry.maybe_linked_refund_ledger_token && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                copyToClipboard(
                                  entry.maybe_linked_refund_ledger_token!,
                                )
                              }
                              title="Copy linked refund token"
                            >
                              {copiedToken ===
                              entry.maybe_linked_refund_ledger_token ? (
                                <IconCheck className="size-3 text-emerald-400" />
                              ) : (
                                <IconCopy className="size-3" />
                              )}
                              Refund
                            </Button>
                          )}
                          {!entry.is_refunded &&
                            !entry.maybe_linked_refund_ledger_token && (
                              <span className="text-xs text-muted-foreground/30">
                                —
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                          onClick={() => copyToClipboard(entry.token)}
                          title="Copy ledger entry token"
                        >
                          {copiedToken === entry.token ? (
                            <IconCheck className="size-3 text-emerald-400" />
                          ) : (
                            <IconCopy className="size-3" />
                          )}
                          <span className="truncate max-w-[120px] inline-block align-middle">{entry.token}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
        )}
        </div>
      </div>

      <GiveCreditsDialog
        walletToken={wallets[0]?.token ?? ""}
        displayName={username ?? ""}
        open={giveCreditsOpen}
        onOpenChange={setGiveCreditsOpen}
        onSuccess={loadData}
      />
    </div>
  );
}
