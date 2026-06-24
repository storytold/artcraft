import { useState } from 'react';
import { Send } from 'lucide-react';

/**
 * Placeholder for a future "submit this sample for analysis" flow. Intentionally
 * inert for now — it captures intent locally but does not send anything yet.
 */
export function SampleSubmitForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="glass space-y-4 px-6 py-6 sm:px-8">
      <div>
        <h4 className="font-display text-lg font-semibold">
          Help us catalogue the fakes
        </h4>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Want us to take a closer look at this clip? Drop an email and we&apos;ll
          reach out. (Coming soon — nothing is sent yet.)
        </p>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <input
          type="email"
          required
          placeholder="you@example.com"
          className="flex-1 rounded-full border border-slate-300/70 bg-white/70 px-5 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={submitted}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300/70 bg-white/60 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:scale-105 hover:text-violet-600 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-cyan-300"
        >
          <Send className="h-4 w-4" />
          {submitted ? 'Thanks — saved!' : 'Submit for analysis'}
        </button>
      </form>
    </div>
  );
}
