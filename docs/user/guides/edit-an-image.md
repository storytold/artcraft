---
title: Edit an image with a prompt
description: Load an image into Image Editor, describe the change, and generate. Use the Mask tool to limit the edit to one area on models that support it.
order: 20
verified: 0.42.0
---

Load an image into **Image Editor**, type what should change, and click **Generate**. To limit the edit to one area, paint a mask first. Masking only works with some models.

## Edit an image

1. Open the image in **Image Editor**. Use any of these:
   - Click **Image Editor** in the top bar, then **Select Image** to upload a file or **Pick from Library** to use something you made.
   - On **Home**, click the **Edit Image** card. It opens the same editor.
   - Open an image from **My Library** and click **Edit Image**.
2. Choose a model with the model picker in the prompt box.
3. Type the change in the box that says "Describe your image...". Short, clear instructions work best, for example "replace with polished chrome".
4. Click **Generate**.

Results appear in the editor's history stack while they run and when they finish. Click one to make it the base image, then edit again. Work from big changes to small ones.

## Limit the edit to one area

1. Click the **Mask** tool in the toolbar on the left. If it looks dimmed and its tooltip says "Mask (Model unsupported)", the model you picked does not support masks. Pick another model.
2. In the bar that appears at the top, choose **Add** to paint the area to change, or **Erase** to remove part of your mask.
3. Set the brush with the **Size** slider. Keep the mask tight around the area you want to change.
4. Type your prompt and click **Generate**.

## Models without mask support

Without a mask, ArtCraft sends the whole canvas as a picture, together with your prompt and any reference images. Anything you drew or placed on the canvas is part of that picture. See [Compose on the 2D canvas](2d-canvas.md) for the drawing tools.

## Start from a blank canvas

On the start card, click **Blank Canvas**, choose a size in **Choose Canvas Size**, and click **Create Canvas**.

## Add reference images

If the model accepts images, click the **Add Image** button at the left of the prompt box and add them there.

## Cost

Click **Costs** at the bottom right to see the credits for the current settings. See [Credits and pricing](../getting-started/credits-and-pricing.md).
