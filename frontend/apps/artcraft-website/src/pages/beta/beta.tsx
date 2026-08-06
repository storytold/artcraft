import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faSpinnerThird } from "@fortawesome/pro-solid-svg-icons";
import { Input } from "@storyteller/ui-input";
import { Button } from "@storyteller/ui-button";
import { getLandingUrl, getReferrer } from "@storyteller/common";
import Seo from "../../components/seo";
import Footer from "../../components/footer";

// Google Apps Script web app URL that appends each signup to the Google Sheet.
// See .env.example for setup instructions.
const SIGNUP_ENDPOINT = import.meta.env.VITE_BETA_SIGNUP_ENDPOINT as
  | string
  | undefined;

const USER_TYPES = [
  "Business",
  "Hobbyist",
  "Film maker",
  "Agency",
  "Other",
] as const;

type UserType = (typeof USER_TYPES)[number];

const BETA_PERKS = [
  {
    title: "First access to new tools",
    description: "Try unreleased models and features before they ship.",
  },
  {
    title: "A direct line to the team",
    description: "Report issues and requests straight to the people building ArtCraft.",
  },
  {
    title: "Shape the roadmap",
    description: "Your feedback decides what we build next.",
  },
];

interface FieldErrors {
  name?: string;
  email?: string;
  type?: string;
  typeOther?: string;
}

const FIELD_LABEL_CLASS = "block text-xs font-semibold text-white/70 ml-1";

const inputClass = (hasError: boolean) =>
  `w-full bg-black/20 border rounded-xl px-4 py-3 text-white placeholder-white/25 outline-none transition-colors ${
    hasError
      ? "border-red-500/50 focus:border-red-500/70"
      : "border-white/10 focus:border-primary/50"
  }`;

const Beta = () => {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [typeOther, setTypeOther] = useState("");
  // Honeypot: hidden from humans; bots that fill it are silently dropped.
  const [website, setWebsite] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    if (website.trim() !== "") {
      // Bot filled the honeypot. Pretend everything worked.
      setIsSubmitted(true);
      return;
    }

    setIsLoading(true);
    try {
      await submitToSheet();
      setIsSubmitted(true);
    } catch (err) {
      console.error("Beta signup submission failed", err);
      setSubmitError(
        "Something went wrong sending your application. Please try again in a moment."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (name.trim() === "") {
      errors.name = "Please enter your name.";
    }
    if (email.trim() === "") {
      errors.email = "Please enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "That doesn't look like a valid email address.";
    }
    if (userType === null) {
      errors.type = "Please pick the option closest to you.";
    } else if (userType === "Other" && typeOther.trim() === "") {
      errors.typeOther = "Tell us a little about what you do.";
    }
    return errors;
  };

  const submitToSheet = async () => {
    const payload = {
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      type: userType,
      typeDetail: userType === "Other" ? typeOther.trim() : "",
      page: window.location.href,
      referrer: getReferrer() ?? "",
      landingUrl: getLandingUrl() ?? "",
    };

    if (!SIGNUP_ENDPOINT) {
      if (import.meta.env.DEV) {
        console.warn(
          "VITE_BETA_SIGNUP_ENDPOINT is not set; simulating a successful submission.",
          payload
        );
        await new Promise((resolve) => setTimeout(resolve, 600));
        return;
      }
      throw new Error("VITE_BETA_SIGNUP_ENDPOINT is not configured");
    }

    // text/plain keeps this a CORS "simple request" so the Apps Script web
    // app can answer without a preflight it isn't able to handle.
    const response = await fetch(SIGNUP_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Signup endpoint returned ${response.status}`);
    }
    const result = (await response.json()) as { success?: boolean };
    if (!result.success) {
      throw new Error("Signup endpoint reported a failure");
    }
  };

  const selectType = (type: UserType) => {
    setUserType(type);
    setFieldErrors((prev) => ({ ...prev, type: undefined, typeOther: undefined }));
  };

  return (
    <div className="relative min-h-screen bg-[#101014] text-white overflow-hidden flex flex-col">
      <Seo
        title="Beta Signup - ArtCraft"
        description="Apply for early access to new ArtCraft features."
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[700px] z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(45,129,255,0.16) 0%, transparent 70%)",
        }}
      />

      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-6 pt-32 pb-24 lg:pt-40">
        <div className="grid lg:grid-cols-[1fr_minmax(0,480px)] gap-12 lg:gap-20 items-start">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">
              ArtCraft Beta
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-[-0.035em] font-medium leading-[1.02] mb-6">
              Get new features{" "}
              <span className="font-serif-italic">before anyone else</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-10">
              We invite a small group of creators to test what we're building
              next. Tell us a bit about yourself and we'll reach out when a
              spot opens up.
            </p>

            <ul className="space-y-5">
              {BETA_PERKS.map((perk) => (
                <li key={perk.title} className="flex gap-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="text-primary text-[11px]"
                    />
                  </span>
                  <div>
                    <p className="font-semibold text-[15px]">{perk.title}</p>
                    <p className="text-white/50 text-sm">{perk.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#16161A] border border-white/[0.08] rounded-[24px] p-6 sm:p-8 shadow-2xl">
            {isSubmitted ? (
              <div className="text-center py-8" role="status" aria-live="polite">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 border border-primary/30">
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="text-primary text-xl"
                  />
                </div>
                <h2 className="text-2xl font-semibold mb-3">
                  You're on the list
                </h2>
                <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                  Thanks, {name.trim().split(/\s+/)[0]}. We review applications
                  regularly and will reach out at{" "}
                  <span className="text-white">{email.trim()}</span> when your
                  spot opens.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center h-11 px-6 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-sm font-semibold transition-all hover:-translate-y-px"
                >
                  Back to the homepage
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-7">
                  <h2 className="text-xl font-semibold mb-1.5">
                    Apply for the beta
                  </h2>
                  <p className="text-white/50 text-sm">
                    Takes about thirty seconds. No spam, ever.
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                  {submitError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm text-center">
                      {submitError}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="beta-name" className={FIELD_LABEL_CLASS}>
                      Name
                    </label>
                    <Input
                      id="beta-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ada Lovelace"
                      inputClassName={inputClass(!!fieldErrors.name)}
                    />
                    {fieldErrors.name && (
                      <p className="text-red-400 text-xs ml-1">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="beta-company" className={FIELD_LABEL_CLASS}>
                      Company{" "}
                      <span className="font-normal text-white/40">
                        (optional)
                      </span>
                    </label>
                    <Input
                      id="beta-company"
                      type="text"
                      autoComplete="organization"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Studio or company name"
                      inputClassName={inputClass(false)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="beta-email" className={FIELD_LABEL_CLASS}>
                      Email
                    </label>
                    <Input
                      id="beta-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      inputClassName={inputClass(!!fieldErrors.email)}
                    />
                    {fieldErrors.email && (
                      <p className="text-red-400 text-xs ml-1">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className={FIELD_LABEL_CLASS}>I am a...</span>
                    <div
                      className="flex flex-wrap gap-2"
                      role="radiogroup"
                      aria-label="I am a..."
                    >
                      {USER_TYPES.map((type) => {
                        const isSelected = userType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => selectType(type)}
                            className={`h-10 px-4 rounded-full border text-sm font-medium transition-colors ${
                              isSelected
                                ? "bg-primary/15 border-primary/60 text-white"
                                : "bg-black/20 border-white/10 text-white/70 hover:border-white/25 hover:text-white"
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.type && (
                      <p className="text-red-400 text-xs ml-1">
                        {fieldErrors.type}
                      </p>
                    )}
                  </div>

                  {userType === "Other" && (
                    <div className="space-y-2">
                      <label
                        htmlFor="beta-type-other"
                        className={FIELD_LABEL_CLASS}
                      >
                        What best describes you?
                      </label>
                      <Input
                        id="beta-type-other"
                        type="text"
                        value={typeOther}
                        onChange={(e) => setTypeOther(e.target.value)}
                        placeholder="Game developer, educator, ..."
                        autoFocus
                        inputClassName={inputClass(!!fieldErrors.typeOther)}
                      />
                      {fieldErrors.typeOther && (
                        <p className="text-red-400 text-xs ml-1">
                          {fieldErrors.typeOther}
                        </p>
                      )}
                    </div>
                  )}

                  <div
                    aria-hidden="true"
                    className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
                  >
                    <label htmlFor="beta-website">Website</label>
                    <input
                      id="beta-website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  <div className="pt-1">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="rounded-full w-full bg-primary hover:bg-primary-600 text-white border-none justify-center font-bold h-11"
                    >
                      {isLoading ? (
                        <FontAwesomeIcon
                          icon={faSpinnerThird}
                          className="animate-spin"
                        />
                      ) : (
                        "Request access"
                      )}
                    </Button>
                  </div>

                  <p className="text-white/30 text-xs text-center leading-relaxed">
                    We only use this to contact you about the beta. Already
                    have access?{" "}
                    <Link
                      to="/login"
                      className="text-white/50 hover:text-white underline underline-offset-2 transition-colors"
                    >
                      Log in
                    </Link>
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Beta;
