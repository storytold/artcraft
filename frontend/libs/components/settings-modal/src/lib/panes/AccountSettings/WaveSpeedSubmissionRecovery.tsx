import { useState } from "react";
import { Button } from "@storyteller/ui-button";
import { ListWaveSpeedSubmissions, RecoverWaveSpeedSubmission, type UncertainWaveSpeedSubmission } from "@storyteller/tauri-api";

/** Let users attach an existing prediction ID to an uncertain submission instead of submitting a paid job again. */
export function WaveSpeedSubmissionRecovery() {
  const [submissions, setSubmissions] = useState<UncertainWaveSpeedSubmission[]>([]);
  const [predictionIds, setPredictionIds] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  /** Refresh uncertain submissions and explain whether manual recovery is available. */
  const check = async () => {
    setBusy(true);
    try {
      const results = await ListWaveSpeedSubmissions();
      setSubmissions(results);
      setMessage(results.length ? "Check WaveSpeed History before submitting again. Paste the matching prediction ID to recover without another charge." : "No uncertain submissions found.");
    } catch { setMessage("Could not load submission recovery."); }
    finally { setBusy(false); }
  };
  return <div className="flex flex-col gap-2 text-sm">
    <Button type="button" variant="secondary" disabled={busy} onClick={check} className="min-h-9 cursor-pointer">Check unfinished submissions</Button>
    {message && <p role="status">{message}</p>}
    {submissions.map((submission) => <div key={submission.id} className="flex flex-col gap-2 rounded border border-ui-panel-border p-2">
      <span>{submission.model_id}: {submission.prompt.slice(0, 120)}</span>
      <input aria-label={`Prediction ID for ${submission.id}`} disabled={busy} value={predictionIds[submission.id] ?? ""} onChange={(event) => setPredictionIds((previous) => ({ ...previous, [submission.id]: event.target.value }))} className="min-h-9 rounded border border-ui-panel-border bg-transparent px-3 py-2 text-base-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" />
      <Button type="button" disabled={busy || !predictionIds[submission.id]?.trim()} className="min-h-9 cursor-pointer" onClick={async () => {
        setBusy(true);
        try {
          await RecoverWaveSpeedSubmission(submission.id, predictionIds[submission.id]);
          setSubmissions((previous) => previous.filter((entry) => entry.id !== submission.id));
          setMessage("Prediction recovered. ArtCraft will resume polling without resubmitting.");
          window.dispatchEvent(new Event("task-queue-update"));
        } catch { setMessage("Could not recover that prediction. Check the ID and your WaveSpeed API key."); }
        finally { setBusy(false); }
      }}>Recover prediction</Button>
    </div>)}
  </div>;
}
