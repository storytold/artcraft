import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, RotateCcw, ScanSearch, Sparkles, UploadCloud } from 'lucide-react';

import { uploadVideo, VideoInfoApiError } from '../api/client';
import type { VideoInfoUploadResponse } from '../api/types';
import { classify } from '../lib/classify';
import type { Verdict } from '../lib/classify';
import { ThemeToggle } from '../components/ThemeToggle';
import { UploadBox } from '../components/UploadBox';
import { VerdictCard } from '../components/VerdictCard';
import { ReportForm } from '../components/ReportForm';

type Status = 'idle' | 'loading' | 'done' | 'error';

interface DoneState {
  fileName: string;
  response: VideoInfoUploadResponse;
  /** Persisted record token — kept for upcoming follow-up requests. */
  uploadedVideoToken: string;
  verdict: Verdict;
}

export function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<DoneState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Monotonic id so only the newest upload's result is applied: if you drop a
  // second video while the first is still processing, the latest one wins.
  const requestIdRef = useRef(0);

  const handleFile = useCallback(async (file: File) => {
    const requestId = ++requestIdRef.current;
    setFileName(file.name);
    setStatus('loading');
    setError(null);
    try {
      const response = await uploadVideo(file);
      if (requestIdRef.current !== requestId) return; // superseded by a newer upload
      setResult({
        fileName: file.name,
        response,
        uploadedVideoToken: response.uploaded_video_token,
        verdict: classify(response),
      });
      setStatus('done');
    } catch (err) {
      if (requestIdRef.current !== requestId) return; // superseded by a newer upload
      const message =
        err instanceof VideoInfoApiError
          ? err.message
          : 'Something went wrong while analyzing the video.';
      setError(message);
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    requestIdRef.current++; // discard any in-flight upload
    setStatus('idle');
    setFileName(null);
    setResult(null);
    setError(null);
  }, []);

  // The entire window is a drop target — drop a video anywhere, at any time.
  useEffect(() => {
    let dragDepth = 0;
    const hasFiles = (event: DragEvent) =>
      !!event.dataTransfer && Array.from(event.dataTransfer.types).includes('Files');

    const onDragEnter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth += 1;
      setIsDragging(true);
    };
    const onDragOver = (event: DragEvent) => {
      // Must preventDefault so the browser allows the drop (and doesn't navigate
      // away to open the file) anywhere on the page.
      if (hasFiles(event)) event.preventDefault();
    };
    const onDragLeave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth -= 1;
      if (dragDepth <= 0) {
        dragDepth = 0;
        setIsDragging(false);
      }
    };
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      dragDepth = 0;
      setIsDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [handleFile]);

  const notIdle = status !== 'idle';

  return (
    <div className="ambient-glow relative min-h-screen overflow-x-hidden">
      {/* Full-window drag overlay — shown whenever a file is dragged over the page. */}
      {isDragging && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-[2rem] border-2 border-dashed border-fuchsia-400/80 bg-white/5 px-12 py-16 text-center">
            <UploadCloud className="h-16 w-16 animate-bounce-down text-fuchsia-300" />
            <p className="brand-gradient font-display text-4xl font-extrabold sm:text-5xl">
              Drop to analyze
            </p>
            <p className="text-sm text-slate-200">Release anywhere — the newest video wins</p>
          </div>
        </div>
      )}

      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 pb-16 sm:px-8">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 font-display text-lg font-bold transition hover:opacity-80"
            title="Back to home"
          >
            <ScanSearch className="h-6 w-6 text-violet-500 dark:text-cyan-400" />
            <span>realseedance</span>
            <span className="text-violet-500 dark:text-cyan-400">?</span>
          </button>
          <ThemeToggle />
        </header>

        {/* Hero */}
        <div className="pt-6 text-center sm:pt-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/50 px-4 py-1.5 text-xs font-medium text-slate-500 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-fuchsia-500" />
            AI video provenance checker
          </div>
          <h1 className="brand-gradient font-display text-5xl font-extrabold leading-[1.05] sm:text-7xl">
            Is That Real
            <br />
            Seedance?
          </h1>
        </div>

        {/* Main content */}
        <main className="mt-10 flex-1">
          {status === 'idle' && (
            <div className="space-y-6">
              <AnimatedPrompt />
              <UploadBox busy={false} busyFileName={null} onFile={handleFile} />
            </div>
          )}

          {status === 'loading' && (
            <UploadBox busy busyFileName={fileName} onFile={handleFile} />
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="glass animate-fade-up border-rose-400/40 px-6 py-8 text-center">
                <p className="text-lg font-semibold text-rose-500">
                  Couldn&apos;t analyze that one
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                  {error}
                </p>
              </div>
              <UploadBox busy={false} busyFileName={null} onFile={handleFile} />
            </div>
          )}

          {status === 'done' && result && (
            <div className="space-y-8">
              <VerdictCard
                fileName={result.fileName}
                verdict={result.verdict}
                response={result.response}
              />

              <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <UploadAnotherButton onFile={handleFile} />
                <BigResetButton onClick={reset} />
              </div>

              <ReportForm
                key={result.uploadedVideoToken}
                uploadedVideoToken={result.uploadedVideoToken}
              />
            </div>
          )}
        </main>

        {/* Prominent "start over" available any time something is on screen. */}
        {notIdle && (
          <div className="mt-14 flex justify-center">
            <BigResetButton onClick={reset} />
          </div>
        )}

        <footer className="mt-16 text-center text-xs text-slate-400 dark:text-slate-600">
          Drag &amp; drop a video anywhere, any time.
        </footer>
      </div>
    </div>
  );
}

/** Animated "Upload Your Video To Find Out" + bouncing arrow toward the box. */
function AnimatedPrompt() {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="font-display text-xl font-semibold sm:text-2xl">
        <span className="brand-gradient">Upload Your Video</span>{' '}
        <span className="text-slate-600 dark:text-slate-300">To Find Out</span>
      </p>
      <ArrowDown className="h-7 w-7 animate-bounce-down text-fuchsia-500" />
    </div>
  );
}

/** Big, bold "start over" button — clears all state back to the home screen. */
function BigResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-2.5 rounded-2xl bg-slate-900 px-8 py-4 text-lg font-extrabold text-white shadow-lg shadow-slate-900/25 transition hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-900 dark:shadow-black/40"
    >
      <RotateCcw className="h-5 w-5 transition duration-500 group-hover:-rotate-180" />
      Start Over
    </button>
  );
}

/** "Upload another" — opens a file picker that reuses the same handler. */
function UploadAnotherButton({ onFile }: { onFile: (file: File) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 text-lg font-extrabold text-white shadow-lg shadow-violet-500/30 transition hover:scale-105 active:scale-95">
      <ScanSearch className="h-5 w-5" />
      Upload another
      <input
        type="file"
        accept="video/*,.mp4,.mov,.webm,.mkv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </label>
  );
}
