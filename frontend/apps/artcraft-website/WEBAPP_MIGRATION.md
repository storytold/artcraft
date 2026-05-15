# Website → Webapp Migration

The marketing site (`artcraft-website`) is being split apart from the app
(`artcraft-webapp`). Anything that isn't pure marketing content belongs in
the webapp at `app.getartcraft.com`.

The migration is **gated by a single boolean** so it can be reverted while
we soak the new redirect behavior in production. When we're confident the
webapp is handling everything cleanly, do the **cleanup pass** below to
permanently delete everything that's only kept around for the rollback path.

---

## The switch

`src/config/links.ts`:

```ts
export const USE_WEBAPP_FOR_APP_FEATURES = true;
```

- `true` (default): legacy paths redirect to the webapp; navbar shows
  "Launch App"; in-page links go cross-origin to `app.getartcraft.com`.
- `false`: everything runs locally on the marketing site (the original
  pre-split behavior).

In dev, `WEBAPP_URL` auto-switches to `http://localhost:4201/` so cross-app
links work against the local webapp Vite server.

---

## What's behind the flag

### Pages that exist locally only as a fallback

When `USE_WEBAPP_FOR_APP_FEATURES = true`, these routes mount
`<WebappRedirect to="…" />` instead of the page component. The page files
are kept on disk so we can roll back by flipping the flag.

- `src/pages/login/`
- `src/pages/signup/`
- `src/pages/forgot-password/`
- `src/pages/create-image/`
- `src/pages/create-video/`
- `src/pages/create-vfx/` (the `/background-change` route)
- `src/pages/library/`
- `src/pages/referrals/`
- `src/pages/welcome/`
- `src/pages/onboarding/`
- `src/pages/checkout/` (success + cancel)

### Components only used by the above

- `src/components/auth/` (SignupForm, GoogleLoginButton)
- `src/components/credits-modal.tsx`
- `src/components/generation-gallery/`
- `src/components/lightbox/lightbox.tsx` (the modal `Lightbox`; the
  `LightboxDetails` + `shared.ts` files in the same folder are still used
  by the public `/media` page and must be kept)
- `src/components/navbar/task-queue.tsx`
- `src/components/prompt-box/`
- `src/components/settings-modal/`

### Lib files only used by the above

- `src/lib/cost-estimate-api.ts`
- `src/lib/enter-to-generate-store.ts`
- `src/lib/omni-gen-hooks.ts`
- `src/lib/prompts-cache.ts`
- `src/lib/recreate.ts`

### Files with conditional flag branches (need cleanup, not deletion)

- `src/app/app.tsx` — drop the `appOrWebapp()` helper, drop the local route
  imports, leave only the `<WebappRedirect />` routes
- `src/components/navbar/navbar.tsx` — drop the `!USE_WEBAPP_FOR_APP_FEATURES`
  branches (Login + Sign up buttons in desktop and mobile); keep only Launch
  App for logged-in users and the Pricing + Launch App combo for logged-out
  users
- `src/components/footer/footer.tsx` — drop the conditional Image/Video
  links in the Pages column
- `src/components/download-modal.tsx` — drop the inline `SignupForm` flow
  and the `view`/`navigate` state; keep only the webapp `/signup` and
  `/login` link buttons
- `src/pages/landing3/landing3.tsx` — `appLink("/create-image")` /
  `appLink("/create-video")` can become bare `webappUrl("…")` calls (or
  inline `${WEBAPP_URL}create-image`)
- `src/pages/media/media.tsx` — drop the local
  `applyRecreateFromMediaToken` branch and the `useNavigate` import; keep
  only the `window.location.href = …` webapp redirect
- `src/pages/pricing/pricing.tsx` — the "Buy Credits" section + `CreditsModal`
  is currently shown unconditionally; once `credits-modal.tsx` is deleted,
  remove the section, the `creditsModalOpen` state, the `isLoggedIn` state,
  and the session-check `useEffect`

### The flag itself

`src/config/links.ts` — drop `USE_WEBAPP_FOR_APP_FEATURES`, drop the
`appLink()` helper (use `webappUrl()` directly everywhere). Keep
`WEBAPP_URL`, `webappUrl()`, `SOCIAL_LINKS`, `SUPPORT_EMAIL`, and the dev
override.

---

## Cleanup pass — what to do when we're ready to commit to the webapp split

1. **Confirm the flag has been `true` in production for long enough** that
   we're sure no real users hit the local routes.
2. **Delete** every directory and file listed under "Pages that exist
   locally only as a fallback", "Components only used by the above", and
   "Lib files only used by the above".
3. **Strip the flag branches** from each file under "Files with conditional
   flag branches".
4. **Remove `USE_WEBAPP_FOR_APP_FEATURES`** and `appLink()` from
   `src/config/links.ts`.
5. **Run** `npx tsc -p tsconfig.app.json --noEmit` from
   `frontend/apps/artcraft-website` and fix any references the cleanup
   exposed. (Pre-existing errors in `download-button.tsx` `LINUX` and
   `pricing-table.tsx` `maybeReferralUsername` are unrelated and can be
   ignored.)
6. **Verify** in dev with `nx serve @frontend/artcraft-website` that every
   navbar/footer/landing/media flow still works and that legacy URLs still
   redirect to the webapp via `WebappRedirect`.

---

## What stays on the marketing site no matter what

These are pure marketing content and are **not** behind the flag:

- `/` → `landing3`
- `/landing3`
- `/seedance-2` → `landing-sd2`
- `/download`
- `/media`, `/media/:id` (public viewer; the lightbox's "Recreate" button
  does cross-origin to the webapp, but the viewer itself stays here)
- `/press-kit`
- `/tutorials`, `/tutorials/:slug`
- `/faq`, `/faq/:slug`
- `/news`, `/news/:slug`
- `/support`
- `/pricing` — Stripe checkout flow stays here (PricingTable → Stripe →
  `/checkout/success` → WebappRedirect → webapp)
