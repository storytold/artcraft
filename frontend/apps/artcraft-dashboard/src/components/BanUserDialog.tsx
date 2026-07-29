import { useEffect, useState } from "react";
import { ModerationApi } from "@/api/ModerationApi";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
import { Label } from "@/components/ui/label";
import {
  IconAlertCircle,
  IconBan,
  IconShieldCheck,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface BanUserDialogProps {
  username: string;
  displayName: string;
  isBanned: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BanUserDialog({
  username,
  displayName,
  isBanned,
  open,
  onOpenChange,
  onSuccess,
}: BanUserDialogProps) {
  const [modNotes, setModNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setModNotes("");
      setConfirmOpen(false);
      setIsSubmitting(false);
      setError(null);
    }
  }, [open]);

  const trimmedNotes = modNotes.trim();
  const isValid = trimmedNotes.length > 0;
  const willBan = !isBanned;
  const actionLabel = willBan ? "Ban" : "Unban";
  const ActionIcon = willBan ? IconBan : IconShieldCheck;

  const handleConfirm = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    const modApi = new ModerationApi();
    const resp = await modApi.ManageUserBan({
      username,
      is_banned: willBan,
      mod_notes: trimmedNotes,
    });
    setIsSubmitting(false);
    if (resp.success) {
      setConfirmOpen(false);
      onOpenChange(false);
      onSuccess?.();
    } else {
      setError(resp.errorMessage || "Failed to update ban status");
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" overlayClassName="bg-black/70">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ActionIcon
                className={cn(
                  "size-5",
                  willBan ? "text-destructive" : "text-emerald-400",
                )}
              />
              {actionLabel} User
            </DialogTitle>
            <DialogDescription>
              {willBan ? (
                <>
                  You are about to ban{" "}
                  <span className="font-semibold text-foreground/80">
                    {displayName}
                  </span>{" "}
                  (@{username}). They will lose access to their account.
                </>
              ) : (
                <>
                  You are about to unban{" "}
                  <span className="font-semibold text-foreground/80">
                    {displayName}
                  </span>{" "}
                  (@{username}). They will regain access to their account.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mod-notes" className="text-sm font-medium">
                Moderator notes
              </Label>
              <textarea
                id="mod-notes"
                rows={4}
                placeholder="Reason for this action (required)"
                value={modNotes}
                onChange={(e) => setModNotes(e.target.value)}
                className={cn(
                  "w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none resize-none",
                  "focus-visible:border-primary transition-colors",
                  "placeholder:text-muted-foreground dark:bg-input/30",
                )}
              />
              <p className="text-xs text-muted-foreground">
                Recorded in the staff audit log.
              </p>
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
              variant={willBan ? "destructive" : "default"}
              disabled={!isValid || isSubmitting}
              onClick={() => setConfirmOpen(true)}
            >
              <ActionIcon className="size-3.5" />
              {actionLabel} User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent overlayClassName="bg-black/70">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {actionLabel}</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to{" "}
              <span className="font-semibold text-foreground">
                {actionLabel.toLowerCase()}
              </span>{" "}
              <span className="font-semibold text-foreground">
                {displayName}
              </span>{" "}
              (@{username}). This action is recorded in the staff audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant={willBan ? "destructive" : "default"}
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              {isSubmitting ? (
                <Spinner className="size-3.5" />
              ) : (
                <ActionIcon className="size-3.5" />
              )}
              {isSubmitting ? "Saving..." : `Confirm ${actionLabel}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
