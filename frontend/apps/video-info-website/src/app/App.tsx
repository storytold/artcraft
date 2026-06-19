import { useCallback, useState } from 'react';
import { ArrowDown, RotateCcw, ScanSearch, Sparkles } from 'lucide-react';

import { readVideoInfo, VideoInfoApiError } from '../api/client';
import type { VideoInfoReadOnlyResponse } from '../api/types';
import { classify } from '../lib/classify';
import type { Verdict } from '../lib/classify';
import { ThemeToggle } from '../components/ThemeToggle';
import { UploadBox } from '../components/UploadBox';
import { VerdictCard } from '../components/VerdictCard';
import { SampleSubmitForm } from '../components/SampleSubmitForm';

type Status = 'idle' | 'loading' | 'done' | 'error';

interface DoneState {
  fileName: string;
  response: VideoInfoReadOnlyResponse;
  verdict: Verdict;
}

export function App() {
  const [status, setStatus] = useState<Status>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<DoneState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setStatus('loading');
    setError(null);
    try {
      const response = await readVideoInfo(file);
      setResult({ fileName: file.name, response, verdict: classify(response) });
      setStatus('done');
    } catch (err) {
      const message =
        err instanceof VideoInfoApiError
          ? err.message
          : 'Something went wrong while analyzing the video.';
      setError(message);
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setFileName(null);
    setResult(null);
    setError(null);
  }, []);

  const showReset = status === 'done' || status === 'error';

  return (
    <div className="ambient-glow relative min-h-screen overflow-x-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 pb-16 sm:px-8">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <ScanSearch className="h-6 w-6 text-violet-500 dark:text-cyan-400" />
            <span>realseedance</span>
            <span className="text-violet-500 dark:text-cyan-400">?</span>
          </div>
          <div className="flex items-center gap-3">
            {showReset && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/60 px-4 py-2 text-sm font-medium text-slate-600 transition hover:scale-105 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-cyan-300"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            )}
            <ThemeToggle />
          </div>
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
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/60 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:scale-105 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-cyan-300"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>

              <SampleSubmitForm />
            </div>
          )}
        </main>

        <footer className="mt-16 text-center text-xs text-slate-400 dark:text-slate-600">
          Videos are analyzed in-memory and never stored.
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

/** "Upload another" — opens a file picker that reuses the same handler. */
function UploadAnotherButton({ onFile }: { onFile: (file: File) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:scale-105 active:scale-95">
      <ScanSearch className="h-4 w-4" />
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
