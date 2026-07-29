import type { MetadataRow } from '../lib/format';

interface MetadataTableProps {
  rows: MetadataRow[];
}

export function MetadataTable({ rows }: MetadataTableProps) {
  return (
    <div className="glass overflow-hidden !rounded-2xl !shadow-none">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200/70 dark:border-white/10">
            <th className="px-5 py-3 font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Field
            </th>
            <th className="px-5 py-3 font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.label}
              className={
                index % 2 === 0
                  ? 'bg-transparent'
                  : 'bg-slate-500/[0.04] dark:bg-white/[0.02]'
              }
            >
              <td className="whitespace-nowrap px-5 py-2.5 align-top font-medium text-slate-600 dark:text-slate-300">
                {row.label}
              </td>
              <td
                className={[
                  'px-5 py-2.5 align-top break-all',
                  row.mono
                    ? 'font-mono text-[13px] text-violet-600 dark:text-cyan-300'
                    : 'text-slate-800 dark:text-slate-100',
                ].join(' ')}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
