# Supported Aspect Ratios

When using image and video generation tools on the ArtCraft MCP server, you can supply an `aspect_ratio` parameter to enforce specific dimensions.

## Automatic / Dynamic
- `auto`: Default automatic sizing based on the prompt or reference images.
- `auto_2k` / `auto_3k` / `auto_4k`: Automatic aspect ratio targeting specific higher resolutions.

## Standard Shapes
- `square` (1:1)
- `square_hd`: High Definition Square.
- `wide`: Generic wide ratio.
- `tall`: Generic tall ratio.

## Specific Wide Ratios
- `wide_three_by_two` (3:2)
- `wide_four_by_three` (4:3)
- `wide_five_by_four` (5:4)
- `wide_sixteen_by_nine` (16:9) - standard widescreen.
- `wide_twenty_one_by_nine` (21:9) - ultrawide cinematic.

## Specific Tall Ratios
- `tall_two_by_three` (2:3)
- `tall_three_by_four` (3:4)
- `tall_four_by_five` (4:5)
- `tall_nine_by_sixteen` (9:16) - standard vertical video (e.g., Shorts, TikTok).
- `tall_nine_by_twenty_one` (9:21) - ultra-tall.
