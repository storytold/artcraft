---
title: Turn an image into a video
description: Add a starting image in Create Video, write a prompt that describes the motion, and generate a clip.
order: 30
verified: 0.42.0
---

Open **Create Video**, add a **First frame** image, describe what should happen, and click the round arrow button. Many models need a starting image. When one does, the box shows "Starting frame required" until you add it.

## Steps

1. Open **Create Video** in the top bar.
2. Choose a model with the model picker in the row under the prompt box. See [Models](../reference/models.md).
3. Add a starting image to the **First frame** card. Click the card and choose **Upload** or **Pick from library**. You can also drag an image file onto the prompt box.
4. Type the motion and mood in the box that says "Describe what you want to happen in the video...".
5. Set the options you want (see below).
6. Click the round arrow button. The number next to it is the credit cost.

The clip appears in the list above the prompt box while it runs and stays there when it finishes. Click it to open it.

## Start from an image you just made

- In **Create Image**, click the **Make Video** button on an image in the list.
- In a lightbox, click **Make Video**.

Both open **Create Video** with that image already in **First frame**.

## Options

Which options show up depends on the model.

- **Aspect Ratio** and **Resolution**.
- **Duration**: the length of the clip.
- **Bitrate** (**Normal** or **High**) and **Output format**.
- Sound: a toggle that reads "Sound: ON" or "Sound: OFF" in its tooltip.
- **Last frame**: a second card for an ending image, on models that support it. The swap button between the cards switches the two frames.
- **Input Mode**: on models that offer it, choose **Keyframe** (first and last frame) or **Omni Reference** (multiple media references). In **Omni Reference** you can mention uploads in the prompt with @Image1, @Video1 or @Audio1.
- **Number of generations**: shown only when the model allows more than one video per click.

Some models cannot start from text alone. The box then says: "This model can't generate from text alone - add a starting frame to animate your prompt."

## Tips for better clips

- Start from a clean, well-lit image with a clear subject.
- Keep motion small, such as a slow camera drift or a small change in pose.
- Reuse the same wording across clips if you are making a series.

## Cost and problems

Click **Costs** at the bottom right to see the credits for the current settings. See [Credits and pricing](../getting-started/credits-and-pricing.md). If a clip never finishes, see [Generation is stuck or failed](../troubleshooting/generation-stuck-or-failed.md).
