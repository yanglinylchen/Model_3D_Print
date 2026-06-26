# Implementation Log - 037 Touch Controls Accessibility

## Summary

Added iPad/web access to material selection and workspace resizing, and changed the touch shape bar to icon-style buttons.

## Interaction Notes

- The touch material bar appears in the viewport HUD as color swatches.
- If no block is selected, tapping a material changes the material for the next placed shape.
- If a block is selected, tapping a material changes that block's material.
- The touch workspace panel exposes X/Y/Z grid counts and applies the same resize validation as the desktop side panel.
- The shape hotbar now uses existing SVG icons where available and compact glyphs for newer shapes.
- The web viewport meta tag and button touch-action settings reduce Safari double-tap zoom.

## Verification

- `npm run build:check`
- `npm run web:build`
- `npm run touch:smoke`
- `npm run web:smoke`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

The touch and web smoke checks verify material selection, workspace resizing, icon-style shape controls, D-pad movement, and two-finger gesture dispatch.
