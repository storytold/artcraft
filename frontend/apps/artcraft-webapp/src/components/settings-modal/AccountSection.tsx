import { useState } from "react";
import { Button } from "@storyteller/ui-button";
import { Input } from "@storyteller/ui-input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { UsersApi, type UserInfo } from "@storyteller/api";
import { refreshSession, updateSessionUser } from "../../lib/session";
import { toast } from "../toast/toast";

const USERNAME_REGEX = /^[A-Za-z0-9_-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const USERNAME_MIN = 3;
const USERNAME_MAX = 16;
const EMAIL_MAX = 255;
const PASSWORD_MIN = 6;

type EditingSection = "username" | "email" | "password" | null;

interface AccountSectionProps {
  user: UserInfo;
}

export function AccountSection({ user }: AccountSectionProps) {
  const [editing, setEditing] = useState<EditingSection>(null);

  const requestOpen = (section: EditingSection) => setEditing(section);
  const close = () => setEditing(null);

  return (
    <div className="flex flex-col gap-6">
      <UsernameForm
        user={user}
        isEditing={editing === "username"}
        onOpen={() => requestOpen("username")}
        onClose={close}
      />
      <hr className="border-ui-panel-border" />
      <EmailForm
        user={user}
        isEditing={editing === "email"}
        onOpen={() => requestOpen("email")}
        onClose={close}
      />
      <hr className="border-ui-panel-border" />
      <PasswordForm
        user={user}
        isEditing={editing === "password"}
        onOpen={() => requestOpen("password")}
        onClose={close}
      />
    </div>
  );
}

interface SectionFormProps {
  user: UserInfo;
  isEditing: boolean;
  onOpen: () => void;
  onClose: () => void;
}

function UsernameForm({ user, isEditing, onOpen, onClose }: SectionFormProps) {
  const initial = user.display_name || user.username || "";
  const [value, setValue] = useState(initial);
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = value.trim();
  const isDirty = trimmed !== initial.trim();
  const canSubmit = isDirty && trimmed.length > 0 && currentPassword.length > 0;

  const reset = () => {
    setValue(initial);
    setCurrentPassword("");
    setError(null);
  };

  const handleOpen = () => {
    reset();
    onOpen();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const reason = validateUsername(trimmed);
    if (reason) {
      setError(reason);
      return;
    }
    if (!isDirty) {
      handleClose();
      return;
    }
    if (currentPassword.length === 0) {
      setError("Enter your current password.");
      return;
    }

    setSubmitting(true);
    const usersApi = new UsersApi();

    const verify = await usersApi.Login({
      usernameOrEmail: user.username,
      password: currentPassword,
    });

    if (!verify.success) {
      setSubmitting(false);
      setError("Current password is incorrect.");
      return;
    }

    const response = await usersApi.EditUsername({ displayName: trimmed });
    setSubmitting(false);

    if (response.success) {
      toast.success("Username updated.");
      updateSessionUser({
        username: trimmed.toLowerCase(),
        display_name: trimmed,
      });
      await refreshSession(true);
      onClose();
    } else {
      setError(humanizeError(response.errorMessage, "Could not update username."));
    }
  };

  return (
    <SectionShell
      title="Username"
      collapsedDescription="Your display name and the handle you sign in with."
      editingDescription={`${USERNAME_MIN} to ${USERNAME_MAX} characters. Letters, numbers, underscores, and hyphens only.`}
      currentLabel="Current"
      currentValue={initial || "Not set"}
      isEditing={isEditing}
      onOpen={handleOpen}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your username"
          maxLength={USERNAME_MAX}
          autoComplete="username"
          autoFocus
          inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
        />
        <Input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Confirm password"
          autoComplete="current-password"
          inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
        />
        {error && <FormError message={error} />}
        <FormActions
          onCancel={handleClose}
          submitting={submitting}
          disabled={!canSubmit}
        />
      </form>
    </SectionShell>
  );
}

function EmailForm({ user, isEditing, onOpen, onClose }: SectionFormProps) {
  const [value, setValue] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0 && currentPassword.length > 0;

  const reset = () => {
    setValue("");
    setCurrentPassword("");
    setError(null);
  };

  const handleOpen = () => {
    reset();
    onOpen();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const reason = validateEmail(trimmed);
    if (reason) {
      setError(reason);
      return;
    }
    if (currentPassword.length === 0) {
      setError("Enter your current password.");
      return;
    }

    setSubmitting(true);
    const usersApi = new UsersApi();

    const verify = await usersApi.Login({
      usernameOrEmail: user.username,
      password: currentPassword,
    });

    if (!verify.success) {
      setSubmitting(false);
      setError("Current password is incorrect.");
      return;
    }

    const response = await usersApi.EditEmail({ emailAddress: trimmed });
    setSubmitting(false);

    if (response.success) {
      toast.success("Email updated.");
      await refreshSession(true);
      onClose();
      reset();
    } else {
      setError(humanizeError(response.errorMessage, "Could not update email."));
    }
  };

  return (
    <SectionShell
      title="Email"
      collapsedDescription="The email address linked to your account."
      editingDescription="Enter a new email address for your account."
      currentLabel="Current"
      currentValue="Hidden for privacy"
      isEditing={isEditing}
      onOpen={handleOpen}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Input
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="you@example.com"
          maxLength={EMAIL_MAX}
          autoComplete="email"
          autoFocus
          inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
        />
        <Input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Confirm password"
          autoComplete="current-password"
          inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
        />
        {error && <FormError message={error} />}
        <FormActions
          onCancel={handleClose}
          submitting={submitting}
          disabled={!canSubmit}
        />
      </form>
    </SectionShell>
  );
}

function PasswordForm({ user, isEditing, onOpen, onClose }: SectionFormProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    oldPassword.length > 0 && password.length > 0 && confirm.length > 0;

  const reset = () => {
    setOldPassword("");
    setPassword("");
    setConfirm("");
    setError(null);
  };

  const handleOpen = () => {
    reset();
    onOpen();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (oldPassword.length === 0) {
      setError("Enter your current password.");
      return;
    }
    const reason = validatePassword(password, confirm);
    if (reason) {
      setError(reason);
      return;
    }
    if (oldPassword === password) {
      setError("New password must be different from the current password.");
      return;
    }

    setSubmitting(true);
    const usersApi = new UsersApi();

    const verify = await usersApi.Login({
      usernameOrEmail: user.username,
      password: oldPassword,
    });

    if (!verify.success) {
      setSubmitting(false);
      setError("Current password is incorrect.");
      return;
    }

    const response = await usersApi.ChangePassword({
      password,
      passwordConfirmation: confirm,
    });
    setSubmitting(false);

    if (response.success) {
      toast.success("Password updated.");
      handleClose();
    } else {
      setError(humanizeError(response.errorMessage, "Could not update password."));
    }
  };

  return (
    <SectionShell
      title="Password"
      collapsedDescription="Used to sign in to your account."
      editingDescription={`Choose a new password of at least ${PASSWORD_MIN} characters.`}
      currentLabel="Current"
      currentValue={"••••••••"}
      isEditing={isEditing}
      onOpen={handleOpen}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          placeholder="Current password"
          autoComplete="current-password"
          autoFocus
          inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            minLength={PASSWORD_MIN}
            autoComplete="new-password"
            inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
          />
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            minLength={PASSWORD_MIN}
            autoComplete="new-password"
            inputClassName="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
          />
        </div>
        {error && <FormError message={error} />}
        <FormActions
          onCancel={handleClose}
          submitting={submitting}
          disabled={!canSubmit}
        />
      </form>
    </SectionShell>
  );
}

function SectionShell({
  title,
  collapsedDescription,
  editingDescription,
  currentLabel,
  currentValue,
  isEditing,
  onOpen,
  children,
}: {
  title: string;
  collapsedDescription: string;
  editingDescription: string;
  currentLabel: string;
  currentValue: string;
  isEditing: boolean;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs opacity-70">
            {isEditing ? editingDescription : collapsedDescription}
          </p>
        </div>
        {!isEditing && (
          <Button
            type="button"
            variant="secondary"
            className="h-9 px-3 shrink-0"
            onClick={onOpen}
          >
            Change
          </Button>
        )}
      </div>
      {!isEditing ? (
        <CurrentValue label={currentLabel} value={currentValue} />
      ) : (
        children
      )}
    </div>
  );
}

function CurrentValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
        {label}
      </span>
      <span className="text-sm font-medium text-white truncate">{value}</span>
    </div>
  );
}

function FormActions({
  onCancel,
  submitting,
  disabled,
}: {
  onCancel: () => void;
  submitting: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <Button
        type="button"
        variant="secondary"
        className="h-9 px-3"
        onClick={onCancel}
        disabled={submitting}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="primary"
        className="h-9 px-4"
        disabled={submitting || disabled}
      >
        {submitting ? (
          <FontAwesomeIcon icon={faSpinnerThird} className="animate-spin" />
        ) : (
          "Save"
        )}
      </Button>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p className="text-xs text-red-400 leading-tight">{message}</p>
  );
}

function validateUsername(username: string): string | null {
  if (username.length === 0) return "Username cannot be empty.";
  if (username.length < USERNAME_MIN) return `Username must be at least ${USERNAME_MIN} characters.`;
  if (username.length > USERNAME_MAX) return `Username must be at most ${USERNAME_MAX} characters.`;
  if (!USERNAME_REGEX.test(username)) {
    return "Username may only contain letters, numbers, underscores, and hyphens.";
  }
  return null;
}

function validateEmail(email: string): string | null {
  if (email.length === 0) return "Email address cannot be empty.";
  if (email.length > EMAIL_MAX) return "Email address is too long.";
  if (!EMAIL_REGEX.test(email)) return "Enter a valid email address.";
  return null;
}

function validatePassword(password: string, confirm: string): string | null {
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

function humanizeError(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;
  const lower = raw.toLowerCase();
  if (lower.includes("unauthorized")) {
    return "You are signed out. Please sign in again.";
  }
  if (lower.includes("server error")) {
    return "Something went wrong on our end. Please try again in a moment.";
  }
  if (lower.includes("username is taken")) {
    return "That username is already taken.";
  }
  if (lower.includes("email address is already in use")) {
    return "That email is already in use.";
  }
  if (lower.includes("username contains slurs")) {
    return "That username is not allowed.";
  }
  if (lower.includes("username is reserved")) {
    return "That username is reserved.";
  }
  if (lower.startsWith("bad username:")) {
    return capitalize(raw.slice("bad username:".length).trim()) + ".";
  }
  if (lower.startsWith("bad email:")) {
    return capitalize(raw.slice("bad email:".length).trim()) + ".";
  }
  return capitalize(raw.replace(/\.$/, "")) + ".";
}

function capitalize(s: string): string {
  if (s.length === 0) return s;
  return s[0].toUpperCase() + s.slice(1);
}
