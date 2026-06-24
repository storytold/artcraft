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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  IconAlertCircle,
  IconCheck,
  IconCopy,
  IconKey,
} from "@tabler/icons-react";

interface ImpersonateUserDialogProps {
  userToken: string;
  username: string;
  displayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImpersonateUserDialog({
  userToken,
  username,
  displayName,
  open,
  onOpenChange,
}: ImpersonateUserDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [impersonationToken, setImpersonationToken] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setImpersonationToken(null);
      setError(null);
      setCopiedField(null);
      setIsLoading(true);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setImpersonationToken(null);

    const modApi = new ModerationApi();
    modApi.ImpersonateUser({ user_token: userToken }).then((resp) => {
      if (cancelled) return;
      if (resp.success && resp.data) {
        setImpersonationToken(resp.data.password_token);
      } else {
        setError(resp.errorMessage || "Failed to generate impersonation token");
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, userToken]);

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" overlayClassName="bg-black/70">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconKey className="size-5" />
            Impersonate User
          </DialogTitle>
          <DialogDescription>
            Use the credentials below to log in as{" "}
            <span className="font-semibold text-foreground/80">
              {displayName}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-6 opacity-60" />
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive">
            <IconAlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {impersonationToken && !isLoading && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Username
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-9 justify-start text-xs font-mono px-2 overflow-hidden"
                onClick={() => copy(username, "username")}
              >
                {copiedField === "username" ? (
                  <IconCheck className="size-3.5 shrink-0 text-green-500" />
                ) : (
                  <IconCopy className="size-3.5 shrink-0" />
                )}
                <span className="truncate">{username}</span>
              </Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Password (Impersonation Token)
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-9 justify-start text-xs font-mono px-2 overflow-hidden"
                onClick={() => copy(impersonationToken, "token")}
              >
                {copiedField === "token" ? (
                  <IconCheck className="size-3.5 shrink-0 text-green-500" />
                ) : (
                  <IconCopy className="size-3.5 shrink-0" />
                )}
                <span className="truncate">{impersonationToken}</span>
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
