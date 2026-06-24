import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react';

import type { VideoInfoReadOnlyResponse } from '../api/types';
import type { Verdict } from '../lib/classify';
import { buildMetadataRows } from '../lib/format';
import { MetadataTable } from './MetadataTable';
import { ScammedBanner } from './ScammedBanner';

interface VerdictCardProps {
  fileName: string;
  verdict: Verdict;
  response: VideoInfoReadOnlyResponse;
}

const LEVEL_STYLES = {
  real: {
    Icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    headlineClass:
      'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent',
    glowClass: 'from-emerald-500/20 to-cyan-500/20',
  },
  fake: {
    Icon: XCircle,
    iconClass: 'text-rose-500',
    headlineClass:
      'bg-gradient-to-r from-rose-400 via-orange-400 to-rose-400 bg-clip-text text-transparent',
    glowClass: 'from-rose-500/20 to-orange-500/20',
  },
  unknown: {
    Icon: HelpCircle,
    iconClass: 'text-slate-400',
    headlineClass:
      'bg-gradient-to-r from-slate-400 to-slate-500 bg-clip-text text-transparent dark:from-slate-300 dark:to-slate-400',
    glowClass: 'from-slate-500/10 to-slate-500/10',
  },
} as const;

export function VerdictCard({ fileName, verdict, response }: VerdictCardProps) {
  const style = LEVEL_STYLES[verdict.level];
  const { Icon } = style;
  const rows = buildMetadataRows(response);

  return (
    <section className="animate-fade-up space-y-6">
      {/* Verdict hero */}
      <div className="glass relative overflow-hidden px-6 py-8 text-center sm:px-10">
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b ${style.glowClass} blur-2xl`}
        />
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
          <Icon className={`h-16 w-16 ${style.iconClass} animate-pop-in`} />
        </div>

        <h2
          className={`text-3xl font-extrabold leading-tight sm:text-4xl ${style.headlineClass}`}
        >
          {verdict.headline}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 dark:text-slate-400">
          {verdict.subline}
        </p>
      </div>

      {verdict.scammed && <ScammedBanner />}

      {/* Prominent model heading + metadata table */}
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
            Detected model
          </p>
          <h3 className="brand-gradient mt-1 font-display text-3xl font-bold sm:text-4xl">
            {verdict.modelLabel}
          </h3>
          <p className="mt-1 truncate text-xs text-slate-400 dark:text-slate-500">
            from {fileName}
          </p>
        </div>

        <MetadataTable rows={rows} />
      </div>
    </section>
  );
}
