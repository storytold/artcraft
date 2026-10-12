---
title: Make an image from a prompt
description: Open Create Image, pick a model, write a prompt and click the round arrow button to generate images.
order: 10
verified: 0.42.0
---

Open **Create Image**, write what you want in the prompt box, and click the round arrow button at the right of the box. The button is disabled until you type a prompt.

## Steps

1. In the top bar, click **Create Image**. You can also click the **Create Image** card on **Home**.
2. Choose a model with the model picker at the left of the row under the prompt box. Its tooltip is **Model** and its panel is titled **Select Model**. See [Models](../reference/models.md) for what each one does.
3. Type your prompt in the box that says "Describe what you want in the image...". The counter at the bottom right shows your length against the limit for this model. If you go over, ArtCraft shows "Prompt exceeds the ... character limit for this model".
4. Set options if you want them (see below).
5. Click the round arrow button. The number next to it is the credit cost for the current settings.

Your images appear above the prompt box while they run and stay in the list when they finish. Click one to open it larger.

## Options under the prompt box

Which of these show up depends on the model you picked.

- **Aspect Ratio**: the shape of the image.
- **Resolution**: the size choices the model offers, such as 1K or 2K.
- **Quality**: the quality levels the model offers, such as Auto, Medium or High.
- **Number of generations**: how many images one click makes. The panel is titled **No. of images**. The choices depend on the model.
- Reference images: some models accept images to guide the result. Click the add card next to the prompt box and choose **Upload** or **Pick from library**, or drag image files onto the box. Each model has a maximum number of references.

The **Clear all** button empties the prompt and removes the reference images.

## Send with Enter

By default, Enter adds a new line and only the button sends your prompt. To change this, click **Settings**, open **General**, and turn on **Enter to generate**. Then Enter sends and Shift+Enter adds a new line.

## Tips for prompts

- Name the subject, the action and the style, such as lighting or materials.
- Short, descriptive phrases work better than long paragraphs.
- Use "no text, no watermark" style negatives sparingly.

## After you generate

- Click an image to open it. The panel has **Edit Image**, **Make Video** and **Download**. See [Edit an image with a prompt](edit-an-image.md), [Turn an image into a video](image-to-video.md) and [Find, download and delete your creations](library.md).
- Image items in the list also have a **Make Video** button.
- If a generation fails, a card with a **Dismiss** button appears in the list. See [Generation is stuck or failed](../troubleshooting/generation-stuck-or-failed.md).

## Cost

Click **Costs** at the bottom right of the page to open the cost calculator. See [Credits and pricing](../getting-started/credits-and-pricing.md).
