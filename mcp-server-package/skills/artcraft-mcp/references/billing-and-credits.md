# Billing, Credits & Cost Estimation

## Read-only (no confirm needed)

| Tool                              | Returns                                      |
|-----------------------------------|----------------------------------------------|
| `artcraft_get_credits`            | Wallet credit balances                       |
| `artcraft_get_subscription`       | Current plan tier, limits, renewal           |
| `artcraft_get_session_info`       | Non-sensitive session profile fields         |
| `artcraft_get_billing_portal_url` | Stripe portal URL (manage cards/invoices)    |

## Pre-generation estimates (free)

`artcraft_estimate_cost` — required: `media_type` (`image`|`video`|`splat`)
and `model`. Optional: `generation_mode`, `input_image_count`,
`aspect_ratio`, `resolution`, `quality`, `duration_seconds`, `batch_count`,
`generate_audio`, `has_reference_image`.

`artcraft_estimate_splat_cost` — required: `model`; optional
`has_reference_image`.

Best practice: estimate, report credits + USD cents to the user, get
explicit approval, then call the paid tool with `confirm: true`.

## Credit top-ups (paid — `confirm: true` required)

`artcraft_create_checkout_session` creates a Stripe checkout for a credit
pack:

| `credits_pack`    | Credits |
|-------------------|---------|
| `artcraft_1000`   | 1,000   |
| `artcraft_2500`   | 2,500   |
| `artcraft_5000`   | 5,000   |
| `artcraft_10000`  | 10,000  |
| `artcraft_25000`  | 25,000  |
| `artcraft_50000`  | 50,000  |

Unknown slugs are rejected — there is no silent fallback to a larger pack.

## Subscriptions (paid — `confirm: true` required)

`artcraft_create_subscription_checkout`:

| Parameter | Values                                          |
|-----------|--------------------------------------------------|
| `plan`    | `artcraft_basic`, `artcraft_pro`, `artcraft_max` |
| `cadence` | `monthly` (default), `yearly`                    |

Both checkout tools return a Stripe URL — the user completes payment in
the browser. Generation never charges until the paid tool itself runs.
