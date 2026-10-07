# Billing, Credits & Cost Estimation Reference

The ArtCraft MCP server provides tools to inspect wallet balances, quote generation costs before running jobs, and generate secure Stripe checkout flows.

---

## 1. Credit Balance Inspection (`artcraft_get_credits`)

Queries the authenticated user's wallet balances across free, monthly, and banked credit pools.

### Usage:
- No arguments required (defaults to `"artcraft"` namespace).
- Returns:
  - **Free credits**: Daily or promo credits.
  - **Monthly credits**: Credits renewed with active subscription tier.
  - **Banked credits**: Purchased credit packs that do not expire.
  - **Sum total credits**: Total available spending balance.

---

## 2. Pre-Generation Cost Estimation

Always estimate costs before launching resource-heavy jobs to prevent running out of credits.

### A. General Media Estimation (`artcraft_estimate_cost`)
Supports Image, Video, 3D Mesh, and Voice pipelines.
- **Parameters**:
  - `model`: Model identifier (e.g. `seedance_2p0`, `flux_1_dev`, `tripo_h3_1`).
  - `provider`: Provider identifier (e.g. `artcraft`, `fal`, `midjourney`).
  - `generation_mode`: Mode (`text_to_image`, `image_to_video`, `text_to_video`, etc.).
  - `duration_seconds`: Video duration (5, 10, 15s).
  - `image_batch_count`: Batch size (1-4).

### B. Gaussian Splat Estimation (`artcraft_estimate_splat_cost`)
Specifically quotes WorldLabs Marble radiance field costs based on resolution and model tier.
- **Parameters**:
  - `version`: Splat model version (`marble_0p1_mini`, `marble_0p1_plus`, `marble_1p0`, `marble_1p1`).
  - `is_panoramic`: Boolean (panoramic captures require additional processing credits).

---

## 3. Stripe Checkout & Top-Ups

When a user's credit balance is low or they want to subscribe to higher generation limits:

### A. Credit Pack Top-Up (`artcraft_create_checkout_session`)
Generates an instant, direct Stripe checkout session link.
- **Credit Pack Slugs**:
  - `artcraft_1000` (1,000 Credits)
  - `artcraft_2500` (2,500 Credits)
  - `artcraft_5000` (5,000 Credits — Default)
  - `artcraft_10000` (10,000 Credits)
  - `artcraft_25000` (25,000 Credits)
  - `artcraft_50000` (50,000 Credits)

### B. Tier Subscriptions (`artcraft_create_subscription_checkout`)
Generates a Stripe recurring checkout link for ArtCraft plans.
- **Plans**: `artcraft_basic`, `artcraft_pro`, `artcraft_max`
- **Cadence**: `monthly` (default) or `yearly`

### C. Customer Billing Portal (`artcraft_get_billing_portal_url`)
Returns a secure Stripe Customer Portal redirect URL where the user can:
- Update credit card / payment methods
- Download PDF tax invoices and receipts
- Upgrade, downgrade, or cancel recurring subscriptions
