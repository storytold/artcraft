import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserReferralCodesApi,
  USER_FEATURE_FLAGS,
  type ReferralCodeEntry,
} from "@storyteller/api";
import { LoadingSpinner } from "@storyteller/ui-loading-spinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCopy,
  faPlus,
  faTrashAlt,
} from "@fortawesome/pro-solid-svg-icons";
import { useSession } from "../../lib/session";
import { toast } from "../../components/toast/toast";
import Seo from "../../components/seo";

const MAX_REFERRAL_CODES = 5;
const REFERRAL_CODE_MAX_LENGTH = 30;
const REFERRAL_CODE_REGEX = /^[A-Za-z0-9._-]+$/;
const SHARE_ORIGIN = "https://getartcraft.com";

export default function Referrals() {
  const navigate = useNavigate();
  const { user, loggedIn, authChecked } = useSession();

  const [codes, setCodes] = useState<ReferralCodeEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [newCode, setNewCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [deletingToken, setDeletingToken] = useState<string | null>(null);
  const [confirmToken, setConfirmToken] = useState<string | null>(null);

  const api = useMemo(() => new UserReferralCodesApi(), []);

  const hasReferralsFlag = !!user?.maybe_feature_flags?.includes(
    USER_FEATURE_FLAGS.REFERRALS,
  );

  useEffect(() => {
    if (!authChecked) return;
    if (!loggedIn || !hasReferralsFlag) {
      navigate("/", { replace: true });
    }
  }, [authChecked, loggedIn, hasReferralsFlag, navigate]);

  const fetchCodes = useCallback(async () => {
    setLoadingList(true);
    const response = await api.ListReferralCodes();
    if (response.success && response.data) {
      setCodes(response.data.referral_codes);
      setListError(null);
    } else {
      setListError(response.errorMessage ?? "Failed to load referral codes.");
    }
    setLoadingList(false);
  }, [api]);

  useEffect(() => {
    if (authChecked && loggedIn && hasReferralsFlag) {
      fetchCodes();
    }
  }, [authChecked, loggedIn, hasReferralsFlag, fetchCodes]);

  const validationError = useMemo(() => {
    const trimmed = newCode.trim();
    if (trimmed.length === 0) return null;
    if (trimmed.length > REFERRAL_CODE_MAX_LENGTH) {
      return `Referral code must be ${REFERRAL_CODE_MAX_LENGTH} characters or fewer.`;
    }
    if (!REFERRAL_CODE_REGEX.test(trimmed)) {
      return "Only letters, numbers, underscores, periods, and dashes are allowed.";
    }
    return null;
  }, [newCode]);

  const atLimit = codes.length >= MAX_REFERRAL_CODES;
  const submitDisabled =
    creating ||
    atLimit ||
    newCode.trim().length === 0 ||
    validationError !== null;

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = newCode.trim();
      if (!trimmed || validationError || atLimit) return;
      setCreating(true);
      setCreateError(null);
      const response = await api.CreateReferralCode({ code: trimmed });
      if (response.success) {
        setNewCode("");
        toast.success("Referral code created.");
        await fetchCodes();
      } else {
        setCreateError(response.errorMessage ?? "Failed to create code.");
      }
      setCreating(false);
    },
    [api, newCode, validationError, atLimit, fetchCodes],
  );

  const handleDelete = useCallback(
    async (token: string) => {
      setDeletingToken(token);
      const response = await api.DeleteReferralCode({ token });
      if (response.success) {
        setCodes((prev) => prev.filter((c) => c.token !== token));
        toast.success("Referral code deleted.");
      } else {
        toast.error(response.errorMessage ?? "Failed to delete code.");
      }
      setDeletingToken(null);
      setConfirmToken(null);
    },
    [api],
  );

  if (!authChecked) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#101014]">
        <LoadingSpinner className="h-10 w-10 text-white/60" />
      </div>
    );
  }

  if (!loggedIn || !hasReferralsFlag || !user) {
    return null;
  }

  const profileLink = `${SHARE_ORIGIN}/?u=${encodeURIComponent(user.username)}`;

  return (
    <div className="relative min-h-full w-full bg-[#101014] text-white">
      <Seo
        title="Referrals - ArtCraft"
        description="Create and share referral links to invite people to ArtCraft."
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px] z-0 overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.18) 0%, transparent 70%)",
        }}
      />

      <main className="relative z-10 px-4 sm:px-8 pt-10 pb-10">
        <div className="max-w-3xl mx-auto">
          <header className="text-center mb-8">
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">
              Share the craft
            </span>
            <h1 className="text-5xl tracking-[-0.035em] font-medium leading-[1.02] mb-5">
              Referrals
            </h1>
            <p className="mx-auto text-base sm:text-lg text-white/55 leading-relaxed">
              Invite people to ArtCraft and get rewarded.
            </p>
          </header>

          <ProfileLinkPanel profileLink={profileLink} />

          <div className="my-6 sm:my-8 flex items-center justify-center gap-3 text-white/40">
            <div className="h-px w-10 bg-white/20" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              Or
            </span>
            <div className="h-px w-10 bg-white/20" />
          </div>

          <section className="rounded-2xl bg-[#1C1C20] border border-white/10 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">
                  Option 2
                </div>
                <h2 className="text-lg font-medium text-white">
                  Create a custom code
                </h2>
                <p className="mt-1 text-sm text-white/55">
                  Memorable codes for sharing on socials, in a video, or
                  anywhere you want a branded link.
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium text-white/45 pt-1">
                {codes.length} / {MAX_REFERRAL_CODES}
              </span>
            </div>

            {loadingList ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner className="h-7 w-7 text-white/60" />
              </div>
            ) : listError ? (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {listError}
              </div>
            ) : codes.length === 0 ? (
              <p className="py-10 text-center text-sm text-white/45">
                You don't have any referral codes yet. Create one below.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {codes.map((entry) => (
                  <ReferralCodeRow
                    key={entry.token}
                    entry={entry}
                    isDeleting={deletingToken === entry.token}
                    isConfirmingDelete={confirmToken === entry.token}
                    onRequestDelete={() => setConfirmToken(entry.token)}
                    onCancelDelete={() => setConfirmToken(null)}
                    onConfirmDelete={() => handleDelete(entry.token)}
                  />
                ))}
              </ul>
            )}

            <form onSubmit={handleCreate} className="mt-6 space-y-2">
              <label
                htmlFor="new-referral-code"
                className="block text-xs font-bold uppercase tracking-wide text-white/60 ml-1"
              >
                New code
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="new-referral-code"
                  type="text"
                  value={newCode}
                  onChange={(e) => {
                    setNewCode(e.target.value);
                    setCreateError(null);
                  }}
                  placeholder={
                    atLimit ? "Delete one to create another" : "my-code"
                  }
                  disabled={atLimit || creating}
                  maxLength={REFERRAL_CODE_MAX_LENGTH}
                  className="flex-1 h-11 rounded-xl bg-black/20 border border-white/10 focus:border-primary/50 px-4 text-sm text-white placeholder-white/25 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={submitDisabled}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary-600 px-6 text-[14px] font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-[12px]" />
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
              {validationError || createError ? (
                <p className="text-xs text-red-400 ml-1">
                  {createError ?? validationError}
                </p>
              ) : atLimit ? (
                <p className="text-xs text-white/45 ml-1">
                  You've reached the limit of {MAX_REFERRAL_CODES} active codes.
                </p>
              ) : (
                <p className="text-xs text-white/40 ml-1">
                  Up to {REFERRAL_CODE_MAX_LENGTH} characters: letters, numbers,
                  underscore, period, and dash.
                </p>
              )}
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

function ProfileLinkPanel({ profileLink }: { profileLink: string }) {
  return (
    <section className="rounded-2xl bg-[#1C1C20] border border-white/10 p-6 sm:p-8 shadow-2xl">
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">
          Option 1
        </div>
        <h2 className="text-lg font-medium text-white">
          Share your username link
        </h2>
        <p className="mt-1 text-sm text-white/55">
          The simplest invite, ready to send. Anyone who signs up through this
          link is credited to you, no setup required.
        </p>
      </div>
      <CopyableLink value={profileLink} />
    </section>
  );
}

function ReferralCodeRow({
  entry,
  isDeleting,
  isConfirmingDelete,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  entry: ReferralCodeEntry;
  isDeleting: boolean;
  isConfirmingDelete: boolean;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const shareLink = `${SHARE_ORIGIN}/?r=${encodeURIComponent(entry.code)}`;
  const createdLabel = new Date(entry.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <li className="rounded-xl bg-black/20 border border-white/[0.08] px-4 py-3.5">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium text-white truncate">
            {entry.code}
          </div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wide text-white/40">
            Created {createdLabel}
          </div>
        </div>
        {isConfirmingDelete ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onCancelDelete}
              disabled={isDeleting}
              className="h-9 px-3 rounded-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={isDeleting}
              className="h-9 px-3.5 rounded-full text-xs font-semibold text-white bg-red-500/85 hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onRequestDelete}
            className="h-9 w-9 inline-flex items-center justify-center rounded-full text-white/45 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Delete referral code"
          >
            <FontAwesomeIcon icon={faTrashAlt} className="text-[13px]" />
          </button>
        )}
      </div>
      <CopyableLink value={shareLink} />
    </li>
  );
}

function CopyableLink({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }, [value]);

  return (
    <div className="flex items-stretch gap-2">
      <input
        type="text"
        value={value}
        readOnly
        onFocus={(e) => e.currentTarget.select()}
        className="flex-1 min-w-0 h-11 rounded-xl bg-black/20 border border-white/10 focus:border-primary/50 px-4 text-sm text-white/80 font-mono outline-none transition-colors"
      />
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] px-4 text-xs font-semibold text-white/85 transition-all"
      >
        <FontAwesomeIcon
          icon={copied ? faCheck : faCopy}
          className="text-[12px]"
        />
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
