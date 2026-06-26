# Implementation Log - 033 Touch Tablet Controls

## Summary

Added a first-pass touch/tablet control layer for the existing Electron app.

## Interaction Notes

- The viewport now supports pointer dragging for camera yaw and pitch.
- Touch taps on the viewport continue to use the same face-based placement/selection logic as mouse clicks.
- The touch D-pad moves the cursor relative to the current camera direction, so "forward" follows what the user is seeing rather than fixed world axes.
- The touch HUD includes:
  - left D-pad for forward/back/left/right cursor movement
  - vertical layer buttons for up/down
  - place, rotate, and erase controls
  - bottom shape hotbar generated from the existing shape registry

## Layout Notes

- Tablet/coarse-pointer layout hides the left and right desktop panels.
- The toolbar remains available as a compact horizontal row.
- The existing camera pad is hidden when the touch HUD is active.

## Verification

- `npm run touch:smoke`
- `npm run build:check`
- `git diff --check`
- `npm run visual:smoke`
- `npm run package:mac`
- `npm run packaged:smoke`

The macOS portable zip was rebuilt and checked.
