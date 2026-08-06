import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ModerationApi } from "@/api/ModerationApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { IconAlertCircle, IconBan } from "@tabler/icons-react";

export interface BulkBanUser {
  username: string;
  displayName: string;
}

interface BulkBanUsersDialogProps {
  users: BulkBanUser[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the usernames that were banned, including on partial failure. */
  onBanned?: (bannedUsernames: string[]) => void;
}

export function BulkBanUsersDialog({
  users,
  open,
  onOpenChange,
  onBanned,
}: BulkBanUsersDialogProps) {
  const [modNotes, setModNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setModNotes("");
      setConfirmOpen(false);
      setIsSubmitting(false);
      setProgress(0);
      setError(null);
    }
  }, [open]);

  const trimmedNotes = modNotes.trim();
  const isValid = trimmedNotes.length > 0 && users.length > 0;
  const userCountLabel = users.length === 1 ? "1 user" : `${users.length} users`;

  const handleConfirm = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    const modApi = new ModerationApi();
    const banned: string[] = [];
    const failed: string[] = [];
    for (const [index, user] of users.entries()) {
      setProgress(index + 1);
      const resp = await modApi.ManageUserBan({
        username: user.username,
        is_banned: true,
        mod_notes: trimmedNotes,
      });
      if (resp.success) {
        banned.push(user.username);
      } else {
        failed.push(user.username);
      }
    }
    setIsSubmitting(false);
    setConfirmOpen(false);
    if (banned.length > 0) {
      onBanned?.(banned);
    }
    if (failed.length === 0) {
      onOpenChange(false);
      toast.success(
        banned.length === 1
          ? `Banned @${banned[0]}`
          : `Banned ${banned.length} users`,
      );
    } else {
      // Keep the dialog open so the failed users (still selected) can be retried.
      setError(
        `Banned ${banned.length} of ${users.length} users. Failed: ${failed
          .map((username) => `@${username}`)
          .join(", ")}`,
      );
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md" overlayClassName="bg-black/70">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconBan className="size-5 text-destructive" />
              Ban {userCountLabel}
            </DialogTitle>
            <DialogDescription>
              You are about to ban {userCountLabel}. They will lose access to
              their accounts.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-md border bg-muted/20 p-2">
              {users.map((user) => (
                <Badge
                  key={user.username}
                  variant="secondary"
                  className="text-xs"
                  title={user.displayName}
                >
                  @{user.username}
                </Badge>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bulk-ban-mod-notes" className="text-sm font-medium">
                Moderator notes
              </Label>
              <Textarea
                id="bulk-ban-mod-notes"
                rows={4}
                placeholder="Reason for this action (required)"
                value={modNotes}
                onChange={(e) => setModNotes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Applied to every user and recorded in the staff audit log.
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
              variant="destructive"
              disabled={!isValid || isSubmitting}
              onClick={() => setConfirmOpen(true)}
            >
              <IconBan className="size-3.5" />
              Ban {userCountLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent overlayClassName="bg-black/70">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Ban</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to{" "}
              <span className="font-semibold text-foreground">
                ban {userCountLabel}
              </span>
              . This action is recorded in the staff audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              {isSubmitting ? (
                <Spinner className="size-3.5" />
              ) : (
                <IconBan className="size-3.5" />
              )}
              {isSubmitting
                ? `Banning ${progress} of ${users.length}...`
                : "Confirm Ban"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
