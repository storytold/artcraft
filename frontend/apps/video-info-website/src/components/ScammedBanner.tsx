import { AlertTriangle } from 'lucide-react';

export function ScammedBanner() {
  return (
    <div className="animate-pop-in flex items-center justify-center gap-3 rounded-2xl border border-rose-400/40 bg-gradient-to-r from-rose-500/15 via-orange-500/15 to-rose-500/15 px-6 py-4">
      <AlertTriangle className="h-7 w-7 shrink-0 text-rose-500 animate-shake" />
      <span className="bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500 bg-clip-text text-xl font-extrabold uppercase tracking-wide text-transparent sm:text-2xl">
        You Might&apos;ve Been Scammed!
      </span>
      <AlertTriangle className="h-7 w-7 shrink-0 text-rose-500 animate-shake" />
    </div>
  );
}
