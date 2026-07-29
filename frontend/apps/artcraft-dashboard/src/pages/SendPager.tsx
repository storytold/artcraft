import { useState } from "react";
import { ModerationApi } from "@/api/ModerationApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  IconAlertCircle,
  IconBellRinging,
  IconCheck,
  IconSend,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/usePageTitle";

type Urgency = "high" | "medium" | "low";

const URGENCY_META: Record<
  Urgency,
  { label: string; description: string; className: string }
> = {
  high: {
    label: "High",
    description: "Pages oncall immediately. Use for production incidents.",
    className: "text-destructive",
  },
  medium: {
    label: "Medium",
    description: "Notifies during working hours.",
    className: "text-amber-400",
  },
  low: {
    label: "Low",
    description: "Logged for review, no immediate page.",
    className: "text-emerald-400",
  },
};

export function SendPager() {
  usePageTitle("Send Pager");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("low");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<
    { success: true } | { success: false; message: string } | null
  >(null);

  const effectiveTitle = title.trim() || "Test Moderation Alert";
  const effectiveDescription =
    description.trim() || "This is a test moderation alert.";

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setResult(null);
    const modApi = new ModerationApi();
    const resp = await modApi.SendAlert({
      title: title.trim() || null,
      description: description.trim() || null,
      urgency,
    });
    setIsSubmitting(false);
    setConfirmOpen(false);
    if (resp.success) {
      setResult({ success: true });
      setTitle("");
      setDescription("");
    } else {
      setResult({
        success: false,
        message: resp.errorMessage || "Failed to send alert",
      });
    }
  };

  const urgencyMeta = URGENCY_META[urgency];

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <IconBellRinging className="size-6 text-muted-foreground" />
          Send Pager
        </h1>
        <p className="text-muted-foreground">
          Dispatch a test alert through the pager system.
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="alert-title" className="text-sm font-medium">
            Title
          </Label>
          <Input
            id="alert-title"
            placeholder="Test Moderation Alert"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to use the default title.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="alert-description" className="text-sm font-medium">
            Description
          </Label>
          <textarea
            id="alert-description"
            rows={4}
            placeholder="This is a test moderation alert."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={cn(
              "w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none resize-none",
              "focus-visible:border-primary transition-colors",
              "placeholder:text-muted-foreground dark:bg-input/30",
            )}
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to use the default description.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="alert-urgency" className="text-sm font-medium">
            Urgency
          </Label>
          <Select
            value={urgency}
            onValueChange={(v) => setUrgency(v as Urgency)}
          >
            <SelectTrigger id="alert-urgency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(URGENCY_META) as Urgency[]).map((u) => (
                <SelectItem key={u} value={u}>
                  <span className={URGENCY_META[u].className}>
                    {URGENCY_META[u].label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className={cn("text-xs transition-colors", urgencyMeta.className)}>
            {urgencyMeta.description}
          </p>
        </div>

        {result?.success === true && (
          <Alert className="border-emerald-500/40 bg-emerald-500/5">
            <IconCheck className="size-4 text-emerald-400" />
            <AlertDescription className="text-emerald-300">
              Alert dispatched successfully.
            </AlertDescription>
          </Alert>
        )}

        {result?.success === false && (
          <Alert variant="destructive">
            <IconAlertCircle className="size-4" />
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button
            size="sm"
            variant={urgency === "high" ? "destructive" : "default"}
            onClick={() => setConfirmOpen(true)}
            disabled={isSubmitting}
          >
            <IconSend className="size-3.5" />
            Send Alert
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent overlayClassName="bg-black/70">
          <AlertDialogHeader>
            <AlertDialogTitle>Send {urgencyMeta.label} alert?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="flex flex-col gap-2">
                <span>
                  You are about to dispatch a{" "}
                  <span className={cn("font-semibold", urgencyMeta.className)}>
                    {urgencyMeta.label.toLowerCase()} urgency
                  </span>{" "}
                  page through the alerting system.
                </span>
                <div className="rounded-md border bg-muted/30 p-3 flex flex-col gap-1 text-sm">
                  <span className="font-semibold text-foreground">
                    {effectiveTitle}
                  </span>
                  <span className="text-muted-foreground">
                    {effectiveDescription}
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant={urgency === "high" ? "destructive" : "default"}
              disabled={isSubmitting}
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              {isSubmitting ? (
                <Spinner className="size-3.5" />
              ) : (
                <IconSend className="size-3.5" />
              )}
              {isSubmitting ? "Sending..." : "Send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
