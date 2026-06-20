import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, Save, TriangleAlert } from 'lucide-react';

import { saveVideoNote, VideoInfoApiError } from '../api/client';
import type { VideoInfoNoteRequest } from '../api/types';
import {
  CUSTOM_VALUE,
  MODEL_TYPE_GROUPS,
  WEBSITE_OPTIONS,
} from '../lib/options';

const DEBOUNCE_MS = 4000;

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface ReportFormProps {
  /** The uploaded video this report is about. */
  uploadedVideoToken: string;
}

export function ReportForm({ uploadedVideoToken }: ReportFormProps) {
  const [modelType, setModelType] = useState('');
  const [customModelName, setCustomModelName] = useState('');
  const [website, setWebsite] = useState('');
  const [customWebsite, setCustomWebsite] = useState('');
  const [comments, setComments] = useState('');
  const [email, setEmail] = useState('');
  const [wasScammed, setWasScammed] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // The note token is kept so subsequent saves update the same record.
  const [noteToken, setNoteToken] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [dirty, setDirty] = useState(false);

  const modelChosen = modelType !== '' && modelType !== CUSTOM_VALUE;
  const websiteChosen = website !== '' && website !== CUSTOM_VALUE;
  const hasContent =
    modelChosen ||
    (modelType === CUSTOM_VALUE && customModelName.trim() !== '') ||
    websiteChosen ||
    (website === CUSTOM_VALUE && customWebsite.trim() !== '') ||
    comments.trim() !== '' ||
    email.trim() !== '' ||
    wasScammed ||
    canShare;

  const submit = useCallback(async () => {
    if (!hasContent) return;
    setStatus('saving');
    const request: VideoInfoNoteRequest = {
      uploaded_video_token: uploadedVideoToken,
      maybe_uploaded_video_note_token: noteToken ?? undefined,
      maybe_reported_model_type: modelChosen ? modelType : undefined,
      maybe_reported_model_name:
        modelType === CUSTOM_VALUE ? customModelName.trim() || undefined : undefined,
      maybe_website: websiteChosen ? website : undefined,
      maybe_other_website:
        website === CUSTOM_VALUE ? customWebsite.trim() || undefined : undefined,
      maybe_comments: comments.trim() || undefined,
      maybe_email_address: email.trim() || undefined,
      can_share_report: canShare,
      was_scammed: wasScammed,
    };
    try {
      const response = await saveVideoNote(request);
      setNoteToken(response.uploaded_video_note_token);
      setStatus('saved');
      setDirty(false);
    } catch (err) {
      const message =
        err instanceof VideoInfoApiError ? err.message : 'Could not save your report.';
      console.warn('report save failed:', message);
      setStatus('error');
    }
  }, [
    hasContent,
    uploadedVideoToken,
    noteToken,
    modelChosen,
    modelType,
    customModelName,
    websiteChosen,
    website,
    customWebsite,
    comments,
    email,
    canShare,
    wasScammed,
  ]);

  // Auto-save 4s after the last change.
  useEffect(() => {
    if (!dirty || !hasContent) return;
    const timer = setTimeout(() => {
      void submit();
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [dirty, hasContent, submit]);

  // Mark dirty on any field change.
  const onChange = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setDirty(true);
    setStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
  };

  return (
    <div className="glass space-y-5 px-6 py-6 sm:px-8">
      <div>
        <h4 className="font-display text-lg font-semibold">Report this video</h4>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tell us what you think it really is. Saves automatically a few seconds after you stop.
        </p>
      </div>

      {/* Model the user thinks it is */}
      <Field label="What model do you think it is?">
        <Select value={modelType} onChange={onChange(setModelType)} placeholder="Select a model…">
          {MODEL_TYPE_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={CUSTOM_VALUE}>Custom / Other…</option>
        </Select>
        {modelType === CUSTOM_VALUE && (
          <TextInput
            value={customModelName}
            onChange={onChange(setCustomModelName)}
            placeholder="Name the model"
          />
        )}
      </Field>

      {/* Where it came from */}
      <Field label="Which website did it come from?">
        <Select value={website} onChange={onChange(setWebsite)} placeholder="Select a website…">
          {WEBSITE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          <option value={CUSTOM_VALUE}>Other (enter URL)…</option>
        </Select>
        {website === CUSTOM_VALUE && (
          <TextInput
            value={customWebsite}
            onChange={onChange(setCustomWebsite)}
            placeholder="https://…"
          />
        )}
      </Field>

      {/* Free-form notes */}
      <Field label="Notes (optional)">
        <textarea
          value={comments}
          onChange={(e) => onChange(setComments)(e.target.value)}
          rows={3}
          placeholder="Anything else you noticed?"
          className="w-full resize-y rounded-2xl border border-slate-300/70 bg-white/70 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-slate-500"
        />
      </Field>

      {/* Flags */}
      <div className="space-y-2.5">
        <FancyCheckbox
          checked={wasScammed}
          onChange={onChange(setWasScammed)}
          label="Did you get scammed?"
        />
        <FancyCheckbox
          checked={canShare}
          onChange={onChange(setCanShare)}
          label="Can we share this statistic with the community?"
        />
      </div>

      {/* Optional email */}
      <Field label="Want us to share better alternatives with you?">
        <TextInput value={email} onChange={onChange(setEmail)} placeholder="you@example.com (optional)" />
      </Field>

      <div className="flex items-center justify-between gap-3">
        <StatusLine status={status} dirty={dirty} hasContent={hasContent} />
        <button
          type="button"
          onClick={() => {
            setDirty(false);
            void submit();
          }}
          disabled={!hasContent || status === 'saving'}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {status === 'saving' ? (
            <Loader2 className="h-4 w-4 animate-spin-slow" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
      </div>
    </div>
  );
}

function StatusLine({
  status,
  dirty,
  hasContent,
}: {
  status: SaveStatus;
  dirty: boolean;
  hasContent: boolean;
}) {
  if (status === 'saving') {
    return <Hint icon={<Loader2 className="h-4 w-4 animate-spin-slow" />}>Saving…</Hint>;
  }
  if (status === 'error') {
    return (
      <Hint className="text-rose-500" icon={<TriangleAlert className="h-4 w-4" />}>
        Couldn&apos;t save — try again
      </Hint>
    );
  }
  if (dirty && hasContent) {
    return <Hint>Unsaved changes…</Hint>;
  }
  if (status === 'saved') {
    return (
      <Hint className="text-emerald-500" icon={<Check className="h-4 w-4" />}>
        Saved
      </Hint>
    );
  }
  return <span />;
}

function Hint({
  children,
  icon,
  className = '',
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}

function FancyCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'group flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition',
        checked
          ? 'border-violet-400/70 bg-violet-500/10 text-slate-800 dark:border-cyan-400/40 dark:bg-cyan-400/10 dark:text-slate-100'
          : 'border-slate-300/70 text-slate-600 hover:border-violet-400/50 dark:border-white/10 dark:text-slate-300',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition',
          checked
            ? 'border-transparent bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-md shadow-fuchsia-500/30'
            : 'border-slate-400/60 group-hover:border-violet-400/70 dark:border-white/20',
        ].join(' ')}
      >
        <Check
          className={[
            'h-4 w-4 transition',
            checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
          ].join(' ')}
        />
      </span>
      <span>{label}</span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
      <div className="space-y-2">{children}</div>
    </label>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-300/70 bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 dark:border-white/10 dark:bg-white/5"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-slate-300/70 bg-white/70 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-slate-500"
    />
  );
}
