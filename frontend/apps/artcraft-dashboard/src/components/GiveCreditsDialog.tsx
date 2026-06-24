import { useState } from "react";
import { ModerationApi } from "@/api/ModerationApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { IconCoin } from "@tabler/icons-react";

interface GiveCreditsDialogProps {
  walletToken: string;
  displayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GiveCreditsDialog({
  walletToken,
  displayName,
  open,
  onOpenChange,
  onSuccess,
}: GiveCreditsDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedAmount = parseInt(amount, 10);
  const isValid = !isNaN(parsedAmount) && parsedAmount > 0;
  const dollarValue = isValid ? (parsedAmount / 100).toFixed(2) : null;

  const reset = () => {
    setAmount("");
    setConfirmOpen(false);
    setIsSubmitting(false);
  };

  const handleConfirm = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    const modApi = new ModerationApi();
    const resp = await modApi.AddBankedBalance(walletToken, parsedAmount);
    if (resp.success) {
      onSuccess();
    }
    reset();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          onOpenChange(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="sm:max-w-md" overlayClassName="bg-black/70">
          <DialogHeader>
            <DialogTitle>Give Banked Credits</DialogTitle>
            <DialogDescription>
              Add purchased (banked) credits to{" "}
              <span className="font-semibold text-foreground/80">
                {displayName}
              </span>
              's wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Input
              type="number"
              min={1}
              placeholder="Amount of credits"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              100 credits = $1.00 (1 credit = 1&cent;)
              {dollarValue && (
                <span className="ml-1 text-foreground font-medium">
                  &middot; {parsedAmount.toLocaleString()} credits = $
                  {dollarValue} USD
                </span>
              )}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!isValid}
              onClick={() => setConfirmOpen(true)}
            >
              <IconCoin className="size-3.5" />
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent overlayClassName="bg-black/70">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Credit Addition</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to add{" "}
              <span className="font-semibold text-foreground">
                {isValid ? parsedAmount.toLocaleString() : 0}
              </span>{" "}
              banked credits{" "}
              {dollarValue && (
                <>
                  (
                  <span className="font-semibold text-foreground">
                    ${dollarValue}
                  </span>
                  ){" "}
                </>
              )}
              to{" "}
              <span className="font-semibold text-foreground">
                {displayName}
              </span>
              . This action cannot be undone.
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
                <IconCoin className="size-3.5" />
              )}
              {isSubmitting ? "Adding..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
