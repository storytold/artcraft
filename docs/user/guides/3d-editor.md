---
title: Stage a scene in 3D
description: Add objects and characters to 3D Stage, set up a camera, then generate an image from the current frame with a prompt.
order: 50
verified: 0.42.0
---

Open **3D Stage**, add objects with the **+** button, line up the camera, type a prompt, and click **Generate**. ArtCraft sends the current frame of your scene with the prompt, so the framing and poses carry into the image.

## Build a scene

1. Click **3D Stage** in the top bar.
2. Click the **+** button at the top. Its tooltip is "Add an asset to scene". On an empty scene a hint says "Click + to add your first 3D asset".
3. Choose where the asset comes from:
   - **ArtCraft Presets (B)**: ready-made content in tabs for Characters, Objects, Memes, Sets, Creatures, Animations and Skybox.
   - **Animations**: the animation picker.
   - **My Library**: your own creations. See [Find, download and delete your creations](library.md).
   - **Upload 3D Model**, **Upload Image** or **Upload Splat**: use your own files.
4. You can also drag an item from **My Library** into the scene.

To make a 3D object from a picture, click the wand button next to **+** (tooltip "Create 3D model from image"), or follow [Turn an image into a 3D object](image-to-3d.md).

## Move things

Use the tool buttons at the top to switch between **Move**, **Rotate** and **Scale**. The button next to them toggles **World** and **Local** space. Scale always uses local space.

Click **Outliner** in the top left to show or hide the **Scene** panel. It lists the items in your scene. Each row has controls to show or hide the item and to lock or unlock it.

Click **Shortcuts** in the top left to pin a cheatsheet of the keyboard shortcuts. Holding Ctrl (Cmd on Mac) alone for a few seconds also shows it. To change shortcuts, open **Settings**, then **Keybinds**.

## Set up the camera

- Use the **Camera** picker in the prompt box to choose a camera. The add control in its panel creates more cameras, up to six. Its **Settings** action opens camera settings.
- The pill at the top right reads **Viewport** when you are using the free viewport camera. Click it to look through the render camera, and click again to go back.
- The **Aspect ratio** menu at the top right sets the frame shape: 16:9, 3:2, 1:1, 2:3 or 9:16.
- The grid button in the prompt box toggles the grid. Its tooltip reads "Grid: ON" or "Grid: OFF".

## Generate an image from the scene

1. Choose a model in the prompt box.
2. Type a prompt in the box that says "Describe your image...". Describe style and materials. The scene already supplies the layout.
3. Click **Generate**.

The same row has **Download frame** to save the current frame as a file and **Save frame**. Click **Costs** at the bottom right for the credit cost.

## Save your scene

Open the **File** menu at the top left. It has **New scene**, **Load my scene**, **Save scene**, **Save scene as copy** and **Reset to original**. Saving needs you to be logged in.

## Record mode

The mode switch at the top has **Build** and **Record**. In **Record** mode, **Capture** takes a still of the camera view. **Record** renders an animation timeline to video. It needs a timeline first, and its tooltip says "Add an animation timeline first" until you have one.

## Watch a walkthrough

[Watch the walkthrough](https://www.youtube.com/watch?v=pM4CxN-isrY) (recorded in 2025, so the interface may look different).
