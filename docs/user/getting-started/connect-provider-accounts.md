---
title: Use your own provider accounts
description: Connect your Grok or Midjourney account to ArtCraft from Settings, and what this does and does not cover.
order: 70
verified: 0.41.0
---

You can connect a Grok account or a Midjourney account to ArtCraft. Do it in **Settings**, under **Accounts**.

## Connect Grok or Midjourney

1. Click the **Settings** button in the top bar.
2. Open **Accounts**.
3. Find the **Grok Account:** or **Midjourney Account:** row. It shows "Not logged in" until you connect.
4. Click **Connect**. A sign-in window for that service opens.
5. Log in with your own account there.

When it works, the row shows your email address and the button changes to **Disconnect**. Click **Disconnect** to remove the connection.

The app can also ask you to connect. It then shows **Set up Grok** or **Set up Midjourney**. Click the button of the same name to open the same sign-in window.

## Which models use your account

Choose the provider on the model:

1. Open the model selector in the prompt box.
2. Point at a model that offers more than one provider. A **Select Provider** list appears.
3. Choose the provider.

Only models that offer several providers show this list.

## What happens to credits

For image generation, when Midjourney is the selected provider, the prompt box shows a cost of 0 ArtCraft credits. The job runs on your Midjourney account. This page does not cover how Grok or video generations are counted, because that has not been checked. For ArtCraft credits in general, see [Credits and pricing](credits-and-pricing.md).

## Other providers

The README lists Grok, Midjourney, Sora and World Labs next to ArtCraft. In version 0.41.0, **Accounts** only has rows for ArtCraft, Grok and Midjourney. This page does not explain connecting Sora or World Labs.

## Your own API key (Fal, OpenAI)

Using your own Fal key is not supported in the app's settings. A question about it in issue [#1525](https://github.com/storytold/artcraft/issues/1525) was closed without a setup guide. Fal's bring-your-own-key endpoints for OpenAI models were deprecated, see issue [#1172](https://github.com/storytold/artcraft/issues/1172).

## Still stuck?

Ask in [Discord](https://discord.gg/artcraft) or open an issue in the [issue tracker](https://github.com/storytold/artcraft/issues).
