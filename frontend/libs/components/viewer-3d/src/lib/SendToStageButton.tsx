import { useRef, useState } from "react";
import { Button } from "@storyteller/ui-button";
import toast from "react-hot-toast";

export function SendToStageButton({ onSend, onSent }: { onSend: () => Promise<void>; onSent?: () => void }) {
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  return (
    <Button
      className="w-full py-1.5 text-[13px]"
      variant="secondary"
      disabled={pending}
      loading={pending}
      onClick={async (event) => {
        event.stopPropagation();
        if (submitting.current) return;
        submitting.current = true;
        setPending(true);
        try {
          await onSend();
          toast.success("Added to the 3D stage");
          onSent?.();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Could not add this asset to the stage. Please try again.");
        } finally {
          submitting.current = false;
          setPending(false);
        }
      }}
    >
      {pending ? "Sending to stage…" : "Send to stage"}
    </Button>
  );
}
