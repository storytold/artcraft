import { useState } from "react";
import { ModerationApi } from "@/api/ModerationApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { IconAlertCircle, IconMail } from "@tabler/icons-react";

interface ChangeUserEmailDialogProps {
  userToken: string;
  username: string;
  displayName: string;
  currentEmail?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newEmail: string) => void;
}

// Mirrors the backend's lenient format check; the server is authoritative.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ChangeUserEmailDialog({
  userToken,
  username,
  displayName,
  currentEmail,
  open,
  onOpenChange,
  onSuccess,
}: ChangeUserEmailDialogProps) {
  const [newEmail, setNewEmail] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on close — covers Cancel, escape, outside-click and success paths,
  // all of which flow through onOpenChange(false).
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setNewEmail("");
      setConfirmOpen(false);
      setIsSubmitting(false);
      setError(null);
    }
    onOpenChange(next);
  };

  const trimmedEmail = newEmail.trim().toLowerCase();
  const isValidFormat = EMAIL_REGEX.test(trimmedEmail);
  const isUnchanged =
    !!currentEmail && trimmedEmail === currentEmail.trim().toLowerCase();
  const canSubmit = isValidFormat && !isUnchanged;

  const handleConfirm = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    const modApi = new ModerationApi();
    const resp = await modApi.ChangeUserEmail(userToken, trimmedEmail);
    setIsSubmitting(false);
    if (resp.success) {
      handleOpenChange(false);
      onSuccess?.(trimmedEmail);
    } else {
      setError(resp.errorMessage || "Failed to change email address");
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" overlayClassName="bg-black/70">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconMail className="size-5 text-muted-foreground" />
              Change Email Address
            </DialogTitle>
            <DialogDescription>
              Set a new email address for{" "}
              <span className="font-semibold text-foreground/80">
                {displayName}
              </span>{" "}
              (@{username}).
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {currentEmail && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Current email
                </Label>
                <span className="text-sm font-mono break-all">
                  {currentEmail}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-email" className="text-sm font-medium">
                New email address
              </Label>
              <Input
                id="new-email"
                type="email"
                autoComplete="off"
                placeholder="new.address@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSubmit) setConfirmOpen(true);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Recorded in the email-change history and the staff audit log.
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
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!canSubmit || isSubmitting}
              onClick={() => setConfirmOpen(true)}
            >
              <IconMail className="size-3.5" />
              Change Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent overlayClassName="bg-black/70">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm email change</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change the email address for{" "}
              <span className="font-semibold text-foreground">
                {displayName}
              </span>{" "}
              (@{username}) to{" "}
              <span className="font-semibold text-foreground break-all">
                {trimmedEmail}
              </span>
              . This action is recorded in the staff audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              {isSubmitting ? (
                <Spinner className="size-3.5" />
              ) : (
                <IconMail className="size-3.5" />
              )}
              {isSubmitting ? "Saving..." : "Confirm Change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
