import { useEffect, useMemo, useState } from "react";
import {
  ModerationApi,
  type FeatureFlagDescriptor,
} from "@/api/ModerationApi";
import { getFeatureFlagIcon } from "@/lib/feature-flag-icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  IconAlertCircle,
  IconFlag,
  IconSearch,
  IconTrash,
  IconDeviceFloppy,
} from "@tabler/icons-react";

interface UserFeatureFlagsDialogProps {
  usernameOrToken: string;
  displayName: string;
  username: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UserFeatureFlagsDialog({
  usernameOrToken,
  displayName,
  username,
  open,
  onOpenChange,
  onSuccess,
}: UserFeatureFlagsDialogProps) {
  const [availableFlags, setAvailableFlags] = useState<FeatureFlagDescriptor[]>(
    [],
  );
  const [initialUserFlags, setInitialUserFlags] = useState<string[]>([]);
  const [selectedFlags, setSelectedFlags] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setFilter("");
      setError(null);
      setClearConfirmOpen(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setAvailableFlags([]);
    setInitialUserFlags([]);
    setSelectedFlags(new Set());

    const api = new ModerationApi();
    Promise.all([
      api.ListAvailableFeatureFlags(),
      api.ListUserFeatureFlags(usernameOrToken),
    ])
      .then(([allResp, userResp]) => {
        if (cancelled) return;
        if (!allResp.success) {
          setError(allResp.errorMessage || "Failed to load available flags");
          return;
        }
        if (!userResp.success) {
          setError(userResp.errorMessage || "Failed to load user flags");
          return;
        }
        const all = allResp.data?.feature_flags ?? [];
        const user = userResp.data?.feature_flags ?? [];
        setAvailableFlags(all);
        setInitialUserFlags(user);
        setSelectedFlags(new Set(user));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, usernameOrToken]);

  const availableByKey = useMemo(() => {
    const map = new Map<string, FeatureFlagDescriptor>();
    for (const f of availableFlags) map.set(f.key, f);
    return map;
  }, [availableFlags]);

  const allFlagRows = useMemo(() => {
    const rows: FeatureFlagDescriptor[] = availableFlags.map((f) => ({ ...f }));
    const seen = new Set(availableFlags.map((f) => f.key));
    for (const key of initialUserFlags) {
      if (!seen.has(key)) {
        rows.push({ key, full_name: key, description: "" });
        seen.add(key);
      }
    }
    return rows.sort((a, b) => a.key.localeCompare(b.key));
  }, [availableFlags, initialUserFlags]);

  const filteredFlags = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return allFlagRows;
    return allFlagRows.filter(
      (f) =>
        f.key.toLowerCase().includes(q) ||
        f.full_name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q),
    );
  }, [allFlagRows, filter]);

  const hasChanges = useMemo(() => {
    if (selectedFlags.size !== initialUserFlags.length) return true;
    for (const f of initialUserFlags) {
      if (!selectedFlags.has(f)) return true;
    }
    return false;
  }, [selectedFlags, initialUserFlags]);

  const toggleFlag = (flag: string, checked: boolean) => {
    setSelectedFlags((prev) => {
      const next = new Set(prev);
      if (checked) next.add(flag);
      else next.delete(flag);
      return next;
    });
  };

  const handleSave = async () => {
    if (isSubmitting || !hasChanges) return;
    setIsSubmitting(true);
    setError(null);
    const api = new ModerationApi();
    const resp = await api.EditUserFeatureFlags(usernameOrToken, {
      SetExactFlags: { flags: Array.from(selectedFlags).sort() },
    });
    setIsSubmitting(false);
    if (resp.success) {
      onSuccess?.();
      onOpenChange(false);
    } else {
      setError(resp.errorMessage || "Failed to update feature flags");
    }
  };

  const handleClearAll = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    const api = new ModerationApi();
    const resp = await api.EditUserFeatureFlags(
      usernameOrToken,
      "ClearAllFlags",
    );
    setIsSubmitting(false);
    setClearConfirmOpen(false);
    if (resp.success) {
      onSuccess?.();
      onOpenChange(false);
    } else {
      setError(resp.errorMessage || "Failed to clear feature flags");
    }
  };

  const selectedCount = selectedFlags.size;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-lg flex flex-col"
          overlayClassName="bg-black/70"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconFlag className="size-5 text-muted-foreground" />
              Feature Flags
            </DialogTitle>
            <DialogDescription>
              Manage feature flags for{" "}
              <span className="font-semibold text-foreground/80">
                {displayName}
              </span>{" "}
              (@{username}).
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="relative">
              <IconSearch className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Filter flags..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                disabled={isLoading}
                className="pl-9"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>
                {isLoading
                  ? "Loading..."
                  : `${selectedCount} of ${allFlagRows.length} enabled`}
              </span>
              {!isLoading && initialUserFlags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={() => setClearConfirmOpen(true)}
                  disabled={isSubmitting}
                >
                  <IconTrash className="size-3" />
                  Clear all
                </Button>
              )}
            </div>

            <div className="max-h-[50vh] overflow-y-auto rounded-md border bg-muted/20">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Spinner className="size-5 opacity-50" />
                </div>
              ) : filteredFlags.length === 0 ? (
                <p className="text-sm text-muted-foreground italic px-3 py-6 text-center">
                  {allFlagRows.length === 0
                    ? "No feature flags available."
                    : "No flags match your filter."}
                </p>
              ) : (
                <ul className="divide-y divide-border/50">
                  {filteredFlags.map((flag) => {
                    const checked = selectedFlags.has(flag.key);
                    const isUnknown = !availableByKey.has(flag.key);
                    const Icon = getFeatureFlagIcon(flag);
                    return (
                      <li key={flag.key}>
                        <label className="flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors">
                          <Checkbox
                            className="mt-0.5"
                            checked={checked}
                            onCheckedChange={(v) =>
                              toggleFlag(flag.key, v === true)
                            }
                          />
                          <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {!isUnknown && flag.full_name && (
                                <span className="text-sm font-medium">
                                  {flag.full_name}
                                </span>
                              )}
                              <span className="text-xs font-mono text-muted-foreground break-all">
                                {flag.key}
                              </span>
                              {isUnknown && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 px-1.5 opacity-70"
                                >
                                  Unknown
                                </Badge>
                              )}
                            </div>
                            {flag.description && (
                              <p className="text-xs text-muted-foreground">
                                {flag.description}
                              </p>
                            )}
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <IconAlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!hasChanges || isSubmitting || isLoading}
              onClick={handleSave}
            >
              {isSubmitting ? (
                <Spinner className="size-3.5" />
              ) : (
                <IconDeviceFloppy className="size-3.5" />
              )}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent overlayClassName="bg-black/70">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all feature flags?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove every feature flag currently enabled for{" "}
              <span className="font-semibold text-foreground">
                {displayName}
              </span>{" "}
              (@{username}). This action is recorded in the staff audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                handleClearAll();
              }}
            >
              {isSubmitting ? (
                <Spinner className="size-3.5" />
              ) : (
                <IconTrash className="size-3.5" />
              )}
              {isSubmitting ? "Clearing..." : "Clear all flags"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
