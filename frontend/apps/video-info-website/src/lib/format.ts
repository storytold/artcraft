import type { VideoInfoReadOnlyResponse } from '../api/types';

export interface MetadataRow {
  label: string;
  value: string;
  /** Long opaque values (ids, hashes) render in a monospace cell. */
  mono: boolean;
}

const ACRONYMS: Record<string, string> = {
  id: 'ID',
  c2pa: 'C2PA',
  ca: 'CA',
  os: 'OS',
  uuid: 'UUID',
  aigc: 'AIGC',
  synthid: 'SynthID',
  utc: 'UTC',
  url: 'URL',
  hex: 'hex',
};

const MONO_HINTS = [
  'id',
  'serial',
  'hex',
  'uuid',
  'log_id',
  'producer',
  'propagator',
  'manifest',
  'instance',
];

/** Build the full, flattened list of fields the endpoint returned. */
export function buildMetadataRows(
  response: VideoInfoReadOnlyResponse,
): MetadataRow[] {
  const rows: MetadataRow[] = [
    { label: 'Detected type', value: titleCase(response.kind), mono: false },
    {
      label: 'Container encoder',
      value: displayValue(response.maybe_encoder),
      mono: false,
    },
  ];

  const detail =
    response.maybe_seedance ??
    response.maybe_veo ??
    response.maybe_sora ??
    response.maybe_dreamina ??
    response.maybe_kling ??
    null;

  if (detail) {
    for (const [key, value] of Object.entries(detail)) {
      rows.push({
        label: prettyLabel(key),
        value: displayValue(value),
        mono: MONO_HINTS.some((hint) => key.includes(hint)),
      });
    }
  }

  return rows;
}

function prettyLabel(key: string): string {
  return key
    .replace(/^maybe_/, '')
    .split('_')
    .map((word) => ACRONYMS[word] ?? capitalize(word))
    .join(' ');
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function titleCase(value: string): string {
  return value
    .split(/[_\s]+/)
    .map((word) => capitalize(word))
    .join(' ');
}

function capitalize(word: string): string {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}
