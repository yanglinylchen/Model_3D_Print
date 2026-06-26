# 039 Touch View Pan and Long-Press Delete Implementation

## Summary

Refined the iPad/web touch workflow after hands-on testing.

## Changes

- Removed two-finger panning from the viewport gesture path. Two-finger touch now only performs pinch zoom, avoiding confusing camera movement from midpoint drift.
- Added a right-side touch view pan pad with forward/back/left/right controls. These controls use the existing screen-relative camera pan logic.
- Added Minecraft-like long-press deletion on touch: holding a finger on an existing block deletes that block directly, while drag rotation or a second finger cancels the pending delete.
- Kept the existing delete button and confirmation dialog for deliberate button-based deletion.
- Adjusted scene lighting with lower ambient light, hemisphere fill, and stronger directional light so block height and depth are easier to read in the editor.
- Updated touch and web smoke checks to verify the view pan pad renders and remains wired.

## Verification

- `npm run build:check`
- `npm run touch:smoke`
- `npm run visual:smoke`
- `npm run web:build`
- `npm run web:smoke`

