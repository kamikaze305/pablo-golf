# Card Back Image

## Instructions for Adding Your Card Back Image

1. **Save your card back image** as `card-back.png` in this folder
2. **Recommended size**: 48x64 pixels (to match the card component size)
3. **Format**: PNG with transparency support
4. **File name**: Must be exactly `card-back.png`

## Current Setup

The PlayingCard component is configured to:
- Load the image from `/images/card-back.png`
- Fall back to CSS styling if the image fails to load
- Scale the image to fit the card dimensions using `object-cover`

## Image Requirements

- **Dimensions**: 48x64 pixels (or larger, will be scaled down)
- **Format**: PNG recommended for best quality
- **Background**: Should match the card back design you want
- **Transparency**: Optional, but recommended for better integration

## Fallback

If no image is provided, the component will automatically fall back to the CSS-based red card back design with the "8" pattern.
