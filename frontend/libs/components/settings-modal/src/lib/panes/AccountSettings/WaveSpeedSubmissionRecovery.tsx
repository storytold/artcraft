import { useState } from "react";
import { ListWaveSpeedSubmissions, RecoverWaveSpeedSubmission, type UncertainWaveSpeedSubmission } from "@storyteller/tauri-api";

export function WaveSpeedSubmissionRecovery() {
  const [submissions, setSubmissions] = useState<UncertainWaveSpeedSubmission[]>([]);
  const [predictionIds, setPredictionIds] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
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
    <button type="button" disabled={busy} onClick={check} className="text-left underline">Check unfinished submissions</button>
    {message && <p role="status">{message}</p>}
    {submissions.map((submission) => <div key={submission.id} className="flex flex-col gap-2 rounded border border-ui-panel-border p-2">
      <span>{submission.model_id}: {submission.prompt.slice(0, 120)}</span>
      <input aria-label={`Prediction ID for ${submission.id}`} value={predictionIds[submission.id] ?? ""} onChange={(event) => setPredictionIds((previous) => ({ ...previous, [submission.id]: event.target.value }))} className="rounded bg-transparent px-2 py-1" />
      <button type="button" disabled={busy || !predictionIds[submission.id]?.trim()} onClick={async () => {
        setBusy(true);
        try {
          await RecoverWaveSpeedSubmission(submission.id, predictionIds[submission.id]);
          setSubmissions((previous) => previous.filter((entry) => entry.id !== submission.id));
          setMessage("Prediction recovered. ArtCraft will resume polling without resubmitting.");
          window.dispatchEvent(new Event("task-queue-update"));
        } catch { setMessage("Could not recover that prediction. Check the ID and your WaveSpeed API key."); }
        finally { setBusy(false); }
      }}>Recover prediction</button>
    </div>)}
  </div>;
}
