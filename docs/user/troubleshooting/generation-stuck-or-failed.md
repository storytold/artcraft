---
title: A generation is stuck or failed
description: What to do when a task sits at 95% in the Task Queue, or shows Failed, and what to send when you report it.
order: 10
verified: 0.42.0
---

Open the **Task Queue** and read the task. If it shows **Failed**, point at the reason under it. If it sits at 95%, wait, then clear it and report it.

## Symptoms

- A task in the **Task Queue** shows a progress bar that stops at 95% and says "Almost done...".
- A task shows **Failed**, sometimes with a short reason under it.
- A task shows **Failed** with no useful reason.
- You do not know if you were charged.

## Fix

### A task shows Failed

1. Click the **Task Queue** button in the top bar.
2. Find the task in the **Failed** list.
3. Read the reason under **Failed**. Point at it to see more text, when there is any.
4. If the reason is about content policy, change the prompt or the image and run it again. The app can show these reasons:
   - "Image violates content policy"
   - "Images with faces are not allowed"
   - "Text prompt violates content policy"
   - "Content violates content policy"
   - "Generated video flagged by content policy"
   - "Generated audio flagged by content policy"
   - "Generated content flagged by content policy"
5. If the reason is "Generation failed" or "An unknown error occurred", run it again. Use the copy button next to the task to get your prompt back.
6. To remove a failed task from the list, click the X on it. **Clear failed** removes all failed and cancelled tasks.

### A task is stuck at 95%

The bar at 95% is an estimate, not a real measure. The app fills the bar over the time a model usually takes and stops it at 95% until the result arrives. A slow generation can sit there for a while.

1. Wait a few minutes. Video models can take longer than images.
2. Open the **Task Queue** and check whether the task moved to **Failed** or to completed.
3. A task that has been running for more than 5 minutes gets an X button. Click it to remove the task from the list.
4. To remove all of those at once, click **Show all** at the bottom of the Task Queue. In the window that opens, click **Clear stale** in the top row, next to **Clear completed**, **Clear failed** and **Remove all**. It removes every in-progress task older than 5 minutes and asks you to confirm first. It does not touch tasks under 5 minutes old.
5. Check your balance in **Settings**, under **Plan & Credits**. See [Credits and pricing](../getting-started/credits-and-pricing.md).
6. If it still looks wrong, report it. See below.

### Do I get my credits back?

The pricing page says credits are refunded if a generation fails. In reply to a report of tasks stuck at 95%, a team member wrote that refunds are automatic for failed jobs and that stuck jobs move to failed ([#1068](https://github.com/storytold/artcraft/issues/1068)). That comment is from the issue tracker, not from this app's code, so check your balance. If a failed task was charged and not refunded, tell the team in Discord and include the details below.

If a task never moves to **Failed**, do not rely on a refund. Say the task stays at 95% well past the usual time for that model and your balance dropped. Do not remove it from the list yet. Report it first, with the details under "Still stuck?". Reports like this exist: in [#1068](https://github.com/storytold/artcraft/issues/1068) a user lost 176 credits to two jobs stuck at 95%, and [#1439](https://github.com/storytold/artcraft/issues/1439) is a similar report that is still open.

## Why this happens

Generations run on a provider's servers, and the app keeps checking their status. A task moves to **Failed** when the service reports a failure. The app shows the failure reason the service sends. When the service gives none, the app shows a generic label.

Earlier reports of tasks stuck at 95% were about Seedance 2.0 ([#1058](https://github.com/storytold/artcraft/issues/1058), [#1068](https://github.com/storytold/artcraft/issues/1068)). Those two issues are closed. A newer report, [#1439](https://github.com/storytold/artcraft/issues/1439), is still open. In the app, Seedance 2.0 shows a note that it is in Early Alpha and that generations may be slow and may have outages.

## Still stuck?

Ask in [Discord](https://discord.gg/artcraft) or open an issue in the [issue tracker](https://github.com/storytold/artcraft/issues). Include:

- the model you used and the settings (length, size, start frame)
- the time you started the generation, with your time zone
- the text of the failure reason, or a screenshot of the task
- your balance before and after, from **Plan & Credits**
- your ArtCraft version and your system
- whether you used ArtCraft credits or your own provider account
