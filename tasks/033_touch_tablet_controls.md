# Task 033 - Touch Tablet Controls

## Goal

Add a first-pass tablet touch interface inspired by block-building games, while keeping the existing macOS desktop workflow intact.

## Requirements

- Dragging on the viewport rotates the camera view.
- Touch taps on the viewport still place/select by the pointed face.
- Add an on-screen D-pad for moving the placement cursor forward, back, left, and right relative to the current camera view.
- Keep existing vertical cursor movement available on touch.
- Add touch buttons for place, rotate, and erase.
- Add a compact touch shape bar so tablet users do not need the desktop side panel.
- Collapse the desktop side panels on tablet-sized or touch-first layouts.
- Preserve existing keyboard and mouse controls.

## Acceptance Checks

- Touch HUD appears at iPad-like widths.
- Side panels hide on tablet layout.
- Touch shape bar can select a shape.
- Touch layer controls move the cursor.
- Existing build, visual, and packaged smoke checks pass.
